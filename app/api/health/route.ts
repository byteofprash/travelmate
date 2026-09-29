import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const EXPECTED_WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID?.trim() || undefined;

/**
 * Open /api/health to check the Anthropic setup. It makes one token-counting call, which is free and
 * generates nothing, and reports whether the key works, which workspace served it and, if it fails,
 * why. It never returns the key.
 */
export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { ok: false, hasKey: false, problem: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel, then redeploy.' },
      { status: 503 },
    );
  }
  try {
    const client = new Anthropic();
    const { workspace_id, request_id } = await client.messages
      .countTokens({ model: MODEL, messages: [{ role: 'user', content: 'ping' }] })
      .withResponse();
    const workspaceMatches = EXPECTED_WORKSPACE ? (workspace_id ? workspace_id === EXPECTED_WORKSPACE : null) : null;
    const ok = workspaceMatches !== false;
    return Response.json(
      {
        ok,
        hasKey: true,
        model: MODEL,
        workspace: workspace_id ?? null,
        expectedWorkspace: EXPECTED_WORKSPACE ?? null,
        workspaceMatches,
        requestId: request_id ?? null,
        ...(ok ? {} : { problem: 'The key belongs to a different workspace than ANTHROPIC_WORKSPACE_ID.' }),
      },
      { status: ok ? 200 : 502 },
    );
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      const status = err.status ?? null;
      const problem =
        status === 401 ? 'Anthropic rejected the key: it is invalid or revoked, or has extra spaces or quotes when pasted.'
        : status === 403 ? 'The key is valid but not permitted to do this (check its workspace and permissions).'
        : status === 404 ? `Model not found: check CLAUDE_MODEL (currently ${MODEL}).`
        : status === 429 ? 'Rate limited by Anthropic. Try again shortly.'
        : `Anthropic returned an error: ${err.message}`;
      return Response.json({ ok: false, hasKey: true, model: MODEL, status, problem }, { status: 502 });
    }
    return Response.json({ ok: false, hasKey: true, problem: 'Could not reach Anthropic from the server.' }, { status: 502 });
  }
}
