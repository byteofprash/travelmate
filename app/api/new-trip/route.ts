import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { NewTripResultSchema } from '@/lib/newtrip';
import { NEW_TRIP_PROMPT } from '@/lib/prompt';
import { checkAccess } from '@/lib/server/access';
import { callTool } from '@/lib/server/claude';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RequestSchema = z.object({
  text: z.string().min(1).max(20000),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const TOOL: Anthropic.Beta.BetaTool = {
  name: 'create_trip',
  description:
    'Create a new trip from the pasted text. missing: null, or one sentence saying what is needed if the trip cannot be made. name, start, end (YYYY-MM-DD), summary, changes (one short sentence per thing created) and ops (building the trip from empty, in order).',
  input_schema: {
    type: 'object',
    properties: {
      missing: { type: ['string', 'null'] },
      name: { type: 'string' },
      start: { type: 'string' },
      end: { type: 'string' },
      summary: { type: 'string' },
      changes: { type: 'array', items: { type: 'string' } },
      ops: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            op: {
              type: 'string',
              enum: ['add_stay', 'add_day', 'add_journey', 'add_item', 'update_day', 'update_stay'],
            },
          },
          required: ['op'],
        },
      },
    },
    required: ['missing', 'name', 'start', 'end', 'summary', 'changes', 'ops'],
  },
};

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

  const out = await callTool({ system: NEW_TRIP_PROMPT, tool: TOOL, content: `Today is ${today}.\n\nText:\n${text}` });
  if (out instanceof Response) return out;
  const result = NewTripResultSchema.safeParse(out.input);
  if (!result.success) {
    console.error('Invalid new trip from model', z.prettifyError(result.error));
    return Response.json({ error: 'The model returned a trip that did not validate.' }, { status: 422 });
  }
  return Response.json(result.data);
}
