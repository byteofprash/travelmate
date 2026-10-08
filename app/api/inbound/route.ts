import { z } from 'zod';
import { client, secretMatches } from '@/lib/server/state-store';
import { MAX_TEXT, readInbox, writeInbox, type InboxItem } from '@/lib/server/inbox-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 200_000;

const schema = z.object({
  from: z.string().max(320),
  subject: z.string().max(500).default(''),
  date: z.string().max(100).nullable().default(null),
  text: z.string().max(MAX_BODY),
});

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Control characters other than tab and newline, which have no business in an itinerary. */
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim();

/**
 * Receives an email from the Cloudflare email worker (cloudflare/email-worker) and parks it in the inbox. It has its
 * own secret, INBOUND_SECRET, so the worker never holds the app's access code. Nothing here touches the trips: the
 * user chooses a trip in the app and reviews the change before it is applied.
 */
export async function POST(req: Request) {
  if (!process.env.INBOUND_SECRET) return json({ error: 'INBOUND_SECRET is not set on the server.', code: 'no-secret' }, 503);
  if (!secretMatches(req.headers.get('x-inbound-secret'), process.env.INBOUND_SECRET)) return json({ error: 'Wrong secret.', code: 'bad-secret' }, 401);
  const r = client();
  if (!r) return json({ error: 'No database is connected.', code: 'no-storage' }, 503);

  const raw = await req.text();
  if (raw.length > MAX_BODY + 5_000) return json({ error: 'Email too large.', code: 'too-large' }, 413);
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(JSON.parse(raw));
  } catch {
    return json({ error: 'Invalid request.', code: 'bad-request' }, 400);
  }
  const text = clean(body.text).slice(0, MAX_TEXT);
  if (!text) return json({ error: 'The email has no text.', code: 'empty' }, 422);

  try {
    const item: InboxItem = {
      id: crypto.randomUUID(),
      from: clean(body.from),
      subject: clean(body.subject) || '(no subject)',
      date: body.date,
      text,
      receivedAt: new Date().toISOString(),
    };
    const items = await readInbox(r);
    await writeInbox(r, [item, ...items]);
    return json({ ok: true, id: item.id });
  } catch (err) {
    console.error('inbound failed', err);
    return json({ error: 'The database could not be written.', code: 'storage-error' }, 502);
  }
}
