import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { EditResultSchema } from '@/lib/ops';
import { SYSTEM_PROMPT } from '@/lib/prompt';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
// Optional. An API key belongs to one workspace, and Anthropic reports the workspace that served each
// request in the `anthropic-workspace-id` response header. If this is set, a response from any other
// workspace is treated as an error, which catches a key from the wrong workspace being deployed.
const EXPECTED_WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID?.trim() || undefined;

const RequestSchema = z.object({
  request: z.string().min(1).max(20000),
  trip: z.unknown(),
  meta: z.object({ name: z.string(), start: z.string(), end: z.string(), nights: z.number() }),
});

const TOOL: Anthropic.Beta.BetaTool = {
  name: 'apply_trip_ops',
  description:
    'Apply a patch to the trip. summary: one short human-readable sentence per change. ops: the list of operations, in order.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'array', items: { type: 'string' } },
      ops: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            op: {
              type: 'string',
              enum: ['update_item', 'add_item', 'remove_item', 'update_day', 'add_day', 'remove_day', 'update_stay', 'add_stay', 'remove_stay', 'add_journey', 'update_journey', 'remove_journey'],
            },
          },
          required: ['op'],
        },
      },
    },
    required: ['summary', 'ops'],
  },
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 500 });
  }
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Bad request' }, { status: 400 });
  const { request, trip, meta } = parsed.data;
  const tripJson = JSON.stringify(trip);
  if (tripJson.length > 300_000) return Response.json({ error: 'Trip too large' }, { status: 413 });

  const client = new Anthropic();
  const content =
    `Trip: ${meta.name}, ${meta.start} to ${meta.end} (${meta.nights} nights). Day 1 is ${meta.start}.\n\n` +
    `Current trip JSON:\n${tripJson}\n\nRequest:\n${request}`;

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content }],
    });
    if (EXPECTED_WORKSPACE) {
      const { workspace_id } = await stream.withResponse();
      if (!workspace_id) {
        console.warn('ANTHROPIC_WORKSPACE_ID is set but the response named no workspace, so it could not be checked.');
      } else if (workspace_id !== EXPECTED_WORKSPACE) {
        stream.abort();
        console.error(`Anthropic served this request from workspace ${workspace_id}, expected ${EXPECTED_WORKSPACE}.`);
        return Response.json({ error: 'workspace_mismatch' }, { status: 502 });
      }
    }
    const msg = await stream.finalMessage();

    if (msg.stop_reason === 'refusal') {
      return Response.json({ error: 'refused' }, { status: 422 });
    }
    if (msg.stop_reason === 'max_tokens') {
      return Response.json({ error: 'The change was too large to apply in one go.' }, { status: 422 });
    }
    const call = msg.content.find((b) => b.type === 'tool_use' && b.name === TOOL.name);
    if (!call || call.type !== 'tool_use') {
      return Response.json({ error: 'No changes returned.' }, { status: 422 });
    }
    const result = EditResultSchema.safeParse(call.input);
    if (!result.success) {
      console.error('Invalid ops from model', z.prettifyError(result.error));
      return Response.json({ error: 'The model returned changes that did not validate.' }, { status: 422 });
    }
    return Response.json(result.data);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'rate_limited' }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message, `request-id=${err.requestID ?? 'none'}`);
      // 5xx is Anthropic's side and worth retrying; anything else is a problem with the request or key.
      return Response.json({ error: 'upstream', status: err.status ?? null }, { status: err.status && err.status >= 500 ? 503 : 502 });
    }
    console.error(err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}
