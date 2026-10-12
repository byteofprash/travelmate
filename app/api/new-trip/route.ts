import { z } from 'zod';
import { NewTripResultSchema } from '@/lib/newtrip';
import { NEW_TRIP_PROMPT } from '@/lib/prompt';
import { checkAccess } from '@/lib/server/access';
import { callValidated } from '@/lib/server/claude';
import { NEW_TRIP_TOOL } from '@/lib/server/tool-schemas';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RequestSchema = z.object({
  text: z.string().min(1).max(20000),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Create a new trip (name, dates, days, stays, journeys) from pasted text. The app builds the trip from the result. */
export async function POST(req: Request) {
  const denied = await checkAccess(req);
  if (denied) return denied;
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, { status: 500 });
  }
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Bad request' }, { status: 400 });
  const { text, today } = parsed.data;

  const out = await callValidated({ system: NEW_TRIP_PROMPT, tool: NEW_TRIP_TOOL, content: `Today is ${today}.\n\nText:\n${text}`, schema: NewTripResultSchema });
  if (out instanceof Response) return out;
  return Response.json(out.data);
}
