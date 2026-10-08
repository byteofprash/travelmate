import { z } from 'zod';
import { client, codeMatches, readDoc, writeDoc, type StoredDoc } from '@/lib/server/state-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 900_000; // stay under Upstash's request size limit

const putSchema = z.object({
  baseRev: z.number().int().min(0),
  data: z.object({ index: z.array(z.unknown()), trips: z.record(z.string(), z.unknown()) }),
});

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** The checks every request needs. Returns an error response, or the Redis client. */
function gate(req: Request) {
  if (!process.env.APP_SECRET) return json({ error: 'APP_SECRET is not set on the server, so syncing is switched off.', code: 'no-secret' }, 503);
  if (!codeMatches(req.headers.get('x-access-code'))) return json({ error: 'Wrong access code.', code: 'bad-code' }, 401);
  const r = client();
  if (!r) return json({ error: 'No database is connected (set KV_REST_API_URL and KV_REST_API_TOKEN).', code: 'no-storage' }, 503);
  return r;
}

/** Current synced trips: { rev, updatedAt, data }, or { rev: 0, data: null } before anything was saved. */
export async function GET(req: Request) {
  const r = gate(req);
  if (r instanceof Response) return r;
  try {
    const doc = await readDoc(r);
    return json(doc ?? { rev: 0, updatedAt: null, data: null });
  } catch (err) {
    console.error('state GET failed', err);
    return json({ error: 'The database could not be read.', code: 'storage-error' }, 502);
  }
}

/**
 * Save the trips. `baseRev` is the revision the client last saw; if the server is ahead, nothing is written and
 * the current document comes back with status 409 so the client can decide what to keep.
 */
export async function PUT(req: Request) {
  const r = gate(req);
  if (r instanceof Response) return r;
  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: 'The trips are too large to sync.', code: 'too-large' }, 413);
  let body: z.infer<typeof putSchema>;
  try {
    body = putSchema.parse(JSON.parse(text));
  } catch {
    return json({ error: 'Invalid request.', code: 'bad-request' }, 400);
  }
  try {
    const cur = await readDoc(r);
    const curRev = cur?.rev ?? 0;
    if (body.baseRev !== curRev) return json(cur ?? { rev: 0, updatedAt: null, data: null }, 409);
    const doc: StoredDoc = { rev: curRev + 1, updatedAt: new Date().toISOString(), data: body.data as StoredDoc['data'] };
    await writeDoc(r, doc);
    return json({ rev: doc.rev, updatedAt: doc.updatedAt });
  } catch (err) {
    console.error('state PUT failed', err);
    return json({ error: 'The database could not be written.', code: 'storage-error' }, 502);
  }
}
