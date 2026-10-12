import { createHash, timingSafeEqual } from 'node:crypto';

/** Constant-time comparison of a secret sent by a caller with the one configured on the server. */
export function secretMatches(sent: string | null, secret: string | undefined): boolean {
  if (!secret?.trim() || !sent) return false;
  const h = (s: string) => createHash('sha256').update(s.trim()).digest();
  return timingSafeEqual(h(sent), h(secret));
}

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * The gate for every API route that does something. The app has no user accounts: whoever has the access code
 * (APP_SECRET, sent in the x-access-code header) can use it, and nobody else can. It fails closed: with no
 * APP_SECRET on the server, every request is refused.
 *
 * Returns null when the caller may proceed, or the error Response to send back. A wrong code waits a moment
 * before answering, which makes guessing slow.
 */
export async function checkAccess(req: Request): Promise<Response | null> {
  if (!process.env.APP_SECRET?.trim()) {
    return json({ error: 'APP_SECRET is not set on the server, so the app is locked.', code: 'no-secret' }, 503);
  }
  if (!secretMatches(req.headers.get('x-access-code'), process.env.APP_SECRET)) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: 'Wrong access code.', code: 'bad-code' }, 401);
  }
  return null;
}
