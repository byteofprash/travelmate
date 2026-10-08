import { client, codeMatches } from '@/lib/server/state-store';
import { readInbox, writeInbox } from '@/lib/server/inbox-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function gate(req: Request) {
  if (!process.env.APP_SECRET) return json({ error: 'APP_SECRET is not set on the server.', code: 'no-secret' }, 503);
  if (!codeMatches(req.headers.get('x-access-code'))) return json({ error: 'Wrong access code.', code: 'bad-code' }, 401);
  const r = client();
  if (!r) return json({ error: 'No database is connected.', code: 'no-storage' }, 503);
  return r;
}

/** The emails waiting in the inbox, newest first. */
export async function GET(req: Request) {
  const r = gate(req);
  if (r instanceof Response) return r;
  try {
    return json({ items: await readInbox(r) });
  } catch (err) {
    console.error('inbox GET failed', err);
    return json({ error: 'The database could not be read.', code: 'storage-error' }, 502);
  }
}

/** Remove one email (`?id=`), after it was added to a trip or dismissed. Removing one that is already gone is fine. */
export async function DELETE(req: Request) {
  const r = gate(req);
  if (r instanceof Response) return r;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id.', code: 'bad-request' }, 400);
  try {
    const items = await readInbox(r);
    await writeInbox(r, items.filter((i) => i.id !== id));
    return json({ ok: true });
  } catch (err) {
    console.error('inbox DELETE failed', err);
    return json({ error: 'The database could not be written.', code: 'storage-error' }, 502);
  }
}
