import type Anthropic from '@anthropic-ai/sdk';

/**
 * The full, typed JSON Schema for the trip tools: every operation, every field's type, the allowed values and which
 * fields are required. The model is told exactly what to send, and `lib/ops.ts` still validates what comes back.
 *
 * This is not `strict: true`. Anthropic's strict mode caps a request at 24 optional fields and 16 union fields, and
 * this format has many more optional fields than that, so a strict schema would be rejected as too complex.
 */

const str = (description?: string) => ({ type: 'string', ...(description ? { description } : {}) });
const int = (description?: string) => ({ type: 'integer', ...(description ? { description } : {}) });
const ll = { type: 'array', items: { type: 'number' }, description: '[latitude, longitude]' };
const strList = { type: 'array', items: { type: 'string' } };

const TAGS = ['Visit', 'Meal', 'Stay', 'Flight', 'Arrival', 'Pick-up'];
const LEG_MODES = ['car', 'walk', 'train', 'metro', 'flight'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const itemProps = {
  kind: { type: 'string', enum: ['stop', 'leg'], description: 'stop = a place or event; leg = travel between two stops' },
  id: str('Stops only. Omit for new items; one is generated.'),
  time: str('"HH:MM" (24 hour) or "—" when unknown'),
  title: str('Stops: the place or event'),
  sub: str('Stops: a short line under the title'),
  tag: { type: 'string', enum: TAGS },
  dur: str('e.g. "45 min" or "2 hr"'),
  note: str(),
  ll,
  stay: str('Only for an overnight / drop-off stop: the id of the stay it opens'),
  mode: { type: 'string', enum: LEG_MODES, description: 'Legs only' },
  text: str('Legs only: what the journey is'),
  via: { type: 'array', items: ll, description: 'Legs only: optional waypoints' },
};
const ITEM = { type: 'object', properties: itemProps, required: ['kind'], additionalProperties: false };
// Partial updates: any subset of the fields. A null clears a field.
const nullable = (s: object) => ({ anyOf: [s, { type: 'null' }] });
const ITEM_FIELDS = {
  type: 'object',
  properties: { ...itemProps, note: nullable(str()), stay: nullable(str()) },
  description: 'Only the fields to change. null clears note or stay.',
  additionalProperties: false,
};

const dayProps = {
  num: int('Day number, 1-based; day 1 is the trip start date'),
  d: int('Day of the month'),
  wd: { type: 'string', enum: WEEKDAYS },
  title: str(),
  mode: { type: 'string', enum: ['Guided', 'Self-planned'] },
  stay: nullable(str('Id of the stay for the night, or null')),
  summary: str('One line'),
  theme: str('Short evocative theme of the day'),
  blurb: str('One line'),
  story: str('Two sentences'),
  bring: strList,
  items: { type: 'array', items: ITEM, description: 'Stops and the legs between them, in order' },
};
const DAY = { type: 'object', properties: dayProps, required: ['num', 'title'], additionalProperties: false };
const DAY_FIELDS = { type: 'object', properties: { ...dayProps }, description: 'Only the fields to change.', additionalProperties: false };

const stayProps = {
  id: str('Short unique id'),
  city: str(),
  name: str(),
  area: str(),
  inShort: str('e.g. "Wed 23 Dec, on arrival"'),
  outShort: str('e.g. "Thu 24 Dec, morning"'),
  nights: { type: 'array', items: { type: 'integer' }, description: '0-based day indexes of the nights spent here' },
  conf: str('Confirmation number, or "Add confirmation"'),
  phone: str('Phone number, or "Add phone"'),
  by: str(),
  notes: str(),
  address: str('Street address exactly as on the booking, e.g. "Rua Augusta 1, 1100-053 Lisboa". Omit unless the text states it.'),
  ll,
  day: int('0-based index of a representative day'),
};
const STAY = { type: 'object', properties: stayProps, required: ['id', 'city', 'name'], additionalProperties: false };
const STAY_FIELDS = { type: 'object', properties: { ...stayProps }, description: 'Only the fields to change.', additionalProperties: false };

const journeyProps = {
  day: int('0-based day index'),
  mode: { type: 'string', enum: ['Flight', 'Car', 'Train'] },
  by: str('Flights: the airline name, e.g. Lufthansa. Otherwise the operator or vehicle.'),
  from: str(),
  to: str(),
  dur: str('Duration, e.g. "2 hr 30 min"'),
  number: str('Flights only: the flight number exactly as on the booking, e.g. "LH 1234". Omit unless the text states it.'),
  time: str('Departure time, "HH:MM" (24 hour). Omit unless the text states it.'),
};
const JOURNEY = { type: 'object', properties: journeyProps, required: ['day', 'mode', 'from', 'to'], additionalProperties: false };
const JOURNEY_FIELDS = { type: 'object', properties: { ...journeyProps }, description: 'Only the fields to change.', additionalProperties: false };

const op = (name: string, properties: Record<string, object>, required: string[]) => ({
  type: 'object',
  properties: { op: { type: 'string', enum: [name] }, ...properties },
  required: ['op', ...required],
  additionalProperties: false,
});

const ALL_OPS = [
  op('update_item', { id: str('Id of the stop or leg'), fields: ITEM_FIELDS }, ['id', 'fields']),
  op('add_item', { day: int('Day number'), after_id: nullable(str('Insert after this item id; null for the start of the day')), item: ITEM }, ['day', 'item']),
  op('remove_item', { id: str() }, ['id']),
  op('update_day', { day: int('Day number'), fields: DAY_FIELDS }, ['day', 'fields']),
  op('add_day', { day: DAY }, ['day']),
  op('remove_day', { day: int('Day number') }, ['day']),
  op('update_stay', { id: str(), fields: STAY_FIELDS }, ['id', 'fields']),
  op('add_stay', { stay: STAY }, ['stay']),
  op('remove_stay', { id: str() }, ['id']),
  op('add_journey', { journey: JOURNEY }, ['journey']),
  op('update_journey', { index: int('0-based position in the journeys list'), fields: JOURNEY_FIELDS }, ['index', 'fields']),
  op('remove_journey', { index: int('0-based position in the journeys list') }, ['index']),
];
// Building a trip from scratch needs only these.
const BUILD_OPS = ALL_OPS.filter((o) => ['add_stay', 'add_day', 'add_journey', 'add_item', 'update_day', 'update_stay'].includes((o.properties.op as { enum: string[] }).enum[0]));

const opsArray = (ops: object[], what: string) => ({
  type: 'array',
  description: `${what} This MUST be a JSON array of objects, never a string of JSON text. Nested objects (item, day, stay, journey, fields) must be objects too.`,
  items: { anyOf: ops },
});

export const EDIT_TOOL: Anthropic.Beta.BetaTool = {
  name: 'apply_trip_ops',
  description: 'Apply a patch to the trip. summary: one short sentence per change. ops: the operations, in order.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'array', items: { type: 'string' }, description: 'One short human-readable sentence per change' },
      ops: opsArray(ALL_OPS, 'The operations, in order.'),
    },
    required: ['summary', 'ops'],
    additionalProperties: false,
  } as Anthropic.Beta.BetaTool.InputSchema,
};

export const NEW_TRIP_TOOL: Anthropic.Beta.BetaTool = {
  name: 'create_trip',
  description:
    'Create a new trip from the pasted text. missing: null, or one sentence saying what is needed if the trip cannot be made. name, start and end (YYYY-MM-DD), summary, changes (one short sentence per thing created) and ops (building the trip from empty, in order).',
  input_schema: {
    type: 'object',
    properties: {
      missing: { type: ['string', 'null'], description: 'null normally; otherwise one sentence on what is missing' },
      name: str('Short trip title'),
      start: str('First day, YYYY-MM-DD'),
      end: str('Last day, YYYY-MM-DD'),
      summary: str('One line on where'),
      changes: { type: 'array', items: { type: 'string' } },
      ops: opsArray(BUILD_OPS, 'The operations that build the trip from empty, in order.'),
    },
    required: ['missing', 'name', 'start', 'end', 'summary', 'changes', 'ops'],
    additionalProperties: false,
  } as Anthropic.Beta.BetaTool.InputSchema,
};
