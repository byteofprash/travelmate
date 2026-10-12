import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
// Optional. An API key belongs to one workspace, and Anthropic reports the workspace that served each
// request in the `anthropic-workspace-id` response header. If this is set, a response from any other
// workspace is treated as an error, which catches a key from the wrong workspace being deployed.
const EXPECTED_WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID?.trim() || undefined;

/**
 * One Claude call that must answer by calling `tool`. Resolves the tool's raw input, or an error Response that the
 * route can return as is. The caller validates the input.
 */
export async function callTool(opts: { system: string; tool: Anthropic.Beta.BetaTool; content: string }): Promise<{ input: unknown } | Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 500 });
  }
  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: opts.system,
      tools: [opts.tool],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: opts.content }],
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

    if (msg.stop_reason === 'refusal') return Response.json({ error: 'refused' }, { status: 422 });
    if (msg.stop_reason === 'max_tokens') return Response.json({ error: 'The change was too large to apply in one go.' }, { status: 422 });
    const call = msg.content.find((b) => b.type === 'tool_use' && b.name === opts.tool.name);
    if (!call || call.type !== 'tool_use') return Response.json({ error: 'No changes returned.' }, { status: 422 });
    return { input: call.input };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return Response.json({ error: 'rate_limited' }, { status: 429 });
    if (err instanceof Anthropic.APIConnectionError) {
      // The server could not reach Anthropic at all (network, DNS, a timeout).
      console.error('Anthropic connection error', err.message);
      return Response.json({ error: 'connection' }, { status: 503 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message, `request-id=${err.requestID ?? 'none'}`);
      // 5xx is Anthropic's side and worth retrying; anything else is a problem with the request or key. `detail` is
      // Anthropic's own error message (it never contains the key), so the app can say what is wrong.
      return Response.json(
        { error: 'upstream', status: err.status ?? null, detail: String(err.message).slice(0, 300), requestId: err.requestID ?? null },
        { status: err.status && err.status >= 500 ? 503 : 502 },
      );
    }
    console.error(err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}

/** The first few problems in a failed validation, as short lines: "ops.2.day.title: Invalid input: expected string". */
export function summarizeIssues(error: z.ZodError, max = 5): string {
  return error.issues
    .slice(0, max)
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}

/**
 * callTool plus validation. Models occasionally return a patch that is almost right, so if the first answer does not
 * match `schema`, Claude is told exactly what was wrong and asked once more before giving up. A second failure comes
 * back as a 422 whose `detail` lists the problems, so the app (and the log) can say what was wrong.
 */
export async function callValidated<T>(opts: {
  system: string;
  tool: Anthropic.Beta.BetaTool;
  content: string;
  schema: z.ZodType<T>;
  /** For tests: replaces the real Claude call. */
  call?: typeof callTool;
}): Promise<{ data: T } | Response> {
  const call = opts.call ?? callTool;
  let content = opts.content;
  let issues = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const out = await call({ system: opts.system, tool: opts.tool, content });
    if (out instanceof Response) return out;
    const parsed = opts.schema.safeParse(out.input);
    if (parsed.success) return { data: parsed.data };
    issues = summarizeIssues(parsed.error);
    console.error(`Invalid ${opts.tool.name} answer from the model (attempt ${attempt})\n${z.prettifyError(parsed.error)}`);
    content =
      `${opts.content}\n\nYour previous answer was rejected because it did not match the required format:\n${issues}\n` +
      `Call the tool again with a corrected answer. Follow the formats in the instructions exactly.`;
  }
  return Response.json({ error: 'The model returned changes that did not validate.', detail: issues }, { status: 422 });
}
