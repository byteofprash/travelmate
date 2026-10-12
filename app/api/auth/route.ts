import { checkAccess } from '@/lib/server/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Is this access code valid? The lock screen calls this; 200 means yes, 401 wrong code, 503 the server has no APP_SECRET. */
export async function GET(req: Request) {
  const denied = await checkAccess(req);
  if (denied) return denied;
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
