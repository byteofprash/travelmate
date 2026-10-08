import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const EXPECTED_WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID?.trim() || undefined;

/** Non-secret facts about how the server is set up, to help explain odd errors. */
function setup(client: Anthropic) {
  const key = process.env.ANTHROPIC_API_KEY ?? '';
  let baseUrlHost = 'unknown';
  try {
    baseUrlHost = new URL(client.baseURL).host;
  } catch {}
  return {
    baseUrlHost, // anything other than api.anthropic.com means requests go through another service
    customBaseUrl: baseUrlHost !== 'api.anthropic.com',
    keyKind: key.startsWith('sk-ant-admin') ? 'admin-key (cannot call the Messages API)' : key.startsWith('sk-ant-oat') ? 'oauth-token (not an API key)' : /^sk-ant-api/.test(key) ? 'api-key' : 'unrecognised',
    keyLength: key.length,
    keyHasStrayQuotesOrSpaces: /^["'\s]|["'\s]$/.test(key),
    authTokenAlsoSet: Boolean(process.env.ANTHROPIC_AUTH_TOKEN),
  };
}

/**
 * Open /api/health to check the Anthropic setup. It makes one token-counting call, which is free and
 * generates nothing, and reports whether the key works, which workspace served it and, if it fails,
 * why. It never returns the key.
 */
export async function GET(req: Request) {
  const deep = new URL(req.url).searchParams.get('deep') === '1';
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { ok: false, hasKey: false, problem: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel, then redeploy.' },
      { status: 503 },
    );
  }
  try {
    const client = new Anthropic();
    const info = setup(client);
    // ?deep=1 sends a tiny real request with the same beta and fallback settings as /api/edit (costs a few
    // tokens); the default is a free token count. If the default passes and deep fails, the problem is in
    // the request settings rather than the key.
    const { workspace_id, request_id } = deep
      ? await client.beta.messages
          .create({
            model: MODEL,
            max_tokens: 16,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: 'low' },
            messages: [{ role: 'user', content: 'Reply with OK.' }],
          })
          .withResponse()
      : await client.messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: 'ping' }] }).withResponse();
    const workspaceMatches = EXPECTED_WORKSPACE ? (workspace_id ? workspace_id === EXPECTED_WORKSPACE : null) : null;
    const ok = workspaceMatches !== false;
    return Response.json(
      {
        ok,
        hasKey: true,
        check: deep ? 'deep' : 'basic',
        model: MODEL,
        setup: info,
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
      const h = err.headers;
      // Anthropic's own errors carry a request-id header, `server: cloudflare` and a request_id in the body.
      const answeredBy = {
        server: h?.get('server') ?? null,
        via: h?.get('via') ?? null,
        contentType: h?.get('content-type') ?? null,
        hasRequestIdHeader: Boolean(h?.get('request-id')),
        hasRequestIdInBody: Boolean((err.error as { request_id?: string } | undefined)?.request_id),
      };
      const looksLikeAnthropic = answeredBy.hasRequestIdHeader || answeredBy.hasRequestIdInBody;
      const problem =
        status === 401 ? 'Anthropic rejected the key: it is invalid or revoked, or has extra spaces or quotes when pasted.'
        : status === 403 ? 'The key is valid but not permitted to do this (check its workspace and permissions).'
        : status === 404 ? `Model not found: check CLAUDE_MODEL (currently ${MODEL}).`
        : status === 429 ? 'Rate limited by Anthropic. Try again shortly.'
        : status && status >= 500 && !looksLikeAnthropic ? `Something between this server and Anthropic returned ${status} (${err.message}). It did not come from Anthropic's API (no request ID), so check the setup and answeredBy fields: a custom ANTHROPIC_BASE_URL, a proxy or gateway, or a firewall on the host.`
        : status && status >= 500 ? `Anthropic's servers returned ${status} (${err.message}). That is on Anthropic's side and is usually temporary. Retry in a few minutes, and if it persists give Anthropic the requestId below.`
        : `Anthropic returned an error: ${err.message}`;
      return Response.json({ ok: false, hasKey: true, check: deep ? 'deep' : 'basic', model: MODEL, status, requestId: err.requestID ?? null, answeredBy, setup: setup(new Anthropic()), problem }, { status: 502 });
    }
    return Response.json({ ok: false, hasKey: true, problem: 'Could not reach Anthropic from the server.' }, { status: 502 });
  }
}
