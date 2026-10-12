/**
 * Turn a failed call to our own API (/api/edit, /api/new-trip) into a sentence that says what to do. The routes answer
 * with { error, status?, detail?, requestId? }; anything unexpected falls back to a message that includes the status
 * code, which is what to quote when asking for help.
 */
export async function explainFailure(res: Response | null, fallback: string): Promise<string> {
  if (!res) return 'No connection. Check your network and try again.';
  let body: { error?: string; status?: number | null; detail?: string; requestId?: string | null } = {};
  try {
    body = await res.json();
  } catch {
    // Not JSON: a platform error page, for example Vercel's when a function runs out of time.
  }
  const err = body.error ?? '';
  const detail = (body.detail ?? '').trim();

  if (res.status === 504 || res.status === 408) return 'This took too long and timed out. Try a smaller change or a shorter text.';
  if (res.status === 413) return 'That is too large to do in one go. Try a smaller change.';
  if (/ANTHROPIC_API_KEY/.test(err)) return 'The server has no Anthropic API key. Add ANTHROPIC_API_KEY in Vercel, then redeploy.';
  if (res.status === 429 || err === 'rate_limited') return 'Claude is rate limited right now. Wait a minute and try again.';
  if (err === 'workspace_mismatch') return 'The API key belongs to a different Anthropic workspace than ANTHROPIC_WORKSPACE_ID. Use a key from the right workspace.';
  if (err === 'connection') return 'The server could not reach Anthropic. Try again in a moment.';
  if (err === 'refused') return 'Claude declined that request. Try rephrasing it.';
  if (err === 'upstream') {
    const s = body.status ?? 0;
    const ref = body.requestId ? ` (request ${body.requestId})` : '';
    if (/credit balance/i.test(detail)) return 'Your Anthropic account is out of credit. Add credit in the Anthropic console, then try again.';
    if (s === 401 || s === 403) return `Anthropic rejected the API key (${s}). Check ANTHROPIC_API_KEY in Vercel: it may be wrong, revoked or from another workspace.${ref}`;
    if (s === 404) return `Anthropic does not know the model${detail ? `: ${detail.slice(0, 120)}` : ''}. Set CLAUDE_MODEL to a model your key can use.${ref}`;
    if (s >= 500) return 'Anthropic is having trouble right now. Try again in a moment.';
    return `Anthropic rejected the request (${s || res.status})${detail ? `: ${detail.slice(0, 160)}` : ''}${ref}`;
  }
  // Our own, already readable messages (too large, did not validate, no changes returned, …).
  if (res.status === 422 && err) return detail ? `${err} (${detail.split('\n')[0].slice(0, 140)})` : err;
  return `${fallback} (error ${res.status}${err ? `: ${err.slice(0, 80)}` : ''})`;
}
