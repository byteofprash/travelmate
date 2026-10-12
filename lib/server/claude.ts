import Anthropic from '@anthropic-ai/sdk';

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
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message, `request-id=${err.requestID ?? 'none'}`);
      // 5xx is Anthropic's side and worth retrying; anything else is a problem with the request or key.
      return Response.json({ error: 'upstream', status: err.status ?? null }, { status: err.status && err.status >= 500 ? 503 : 502 });
    }
    console.error(err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}
