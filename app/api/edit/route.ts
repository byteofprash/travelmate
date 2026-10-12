import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { EditResultSchema } from '@/lib/ops';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import { callTool } from '@/lib/server/claude';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

  const content =
    `Trip: ${meta.name}, ${meta.start} to ${meta.end} (${meta.nights} nights). Day 1 is ${meta.start}.\n\n` +
    `Current trip JSON:\n${tripJson}\n\nRequest:\n${request}`;

  const out = await callTool({ system: SYSTEM_PROMPT, tool: TOOL, content });
  if (out instanceof Response) return out;
  const result = EditResultSchema.safeParse(out.input);
  if (!result.success) {
    console.error('Invalid ops from model', z.prettifyError(result.error));
    return Response.json({ error: 'The model returned changes that did not validate.' }, { status: 422 });
  }
  return Response.json(result.data);
}
