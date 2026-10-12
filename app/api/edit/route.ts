import { z } from 'zod';
import { EditResultSchema } from '@/lib/ops';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import { checkAccess } from '@/lib/server/access';
import { callValidated } from '@/lib/server/claude';
import { EDIT_TOOL } from '@/lib/server/tool-schemas';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RequestSchema = z.object({
  request: z.string().min(1).max(20000),
  trip: z.unknown(),
  meta: z.object({ name: z.string(), start: z.string(), end: z.string(), nights: z.number() }),
});

export async function POST(req: Request) {
  const denied = await checkAccess(req);
  if (denied) return denied;
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 500 });
  }
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Bad request' }, { status: 400 });
  const { request, trip, meta } = parsed.data;
  const tripJson = JSON.stringify(trip);
  if (tripJson.length > 300_000) return Response.json({ error: 'Trip too large' }, { status: 413 });

  const content =
    `Trip: ${meta.name}, ${meta.start} to ${meta.end} (${meta.nights} nights). Day 1 is ${meta.start}.\n\n` +
    `Current trip JSON:\n${tripJson}\n\nRequest:\n${request}`;

  const out = await callValidated({ system: SYSTEM_PROMPT, tool: EDIT_TOOL, content, schema: EditResultSchema });
  if (out instanceof Response) return out;
  return Response.json(out.data);
}
