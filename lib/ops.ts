import { z } from 'zod';
import type { Day, Item, Journey, Stay, Trip } from './types';

// Loose record for partial updates; the model may send any subset of fields.
const Fields = z.record(z.string(), z.unknown());
const LL = z.tuple([z.number(), z.number()]);

const ItemSchema = z
  .object({
    kind: z.enum(['stop', 'leg']).optional(),
    id: z.string().optional(),
    time: z.string().optional(),
    title: z.string().optional(),
    sub: z.string().optional(),
    tag: z.string().optional(),
    dur: z.string().optional(),
    note: z.string().optional(),
    ll: LL.optional(),
    stay: z.string().nullable().optional(),
    mode: z.string().optional(),
    text: z.string().optional(),
    via: z.array(LL).optional(),
  })
  .passthrough();

const DaySchema = z
  .object({
    num: z.number().int().positive(),
    d: z.number().int().optional(),
    wd: z.string().optional(),
    title: z.string(),
    mode: z.string().optional(),
    stay: z.string().nullable().optional(),
    summary: z.string().optional(),
    theme: z.string().optional(),
    blurb: z.string().optional(),
    story: z.string().optional(),
    bring: z.array(z.string()).optional(),
    items: z.array(ItemSchema).optional(),
  })
  .passthrough();

const StaySchema = z
  .object({
    id: z.string(),
    city: z.string(),
    name: z.string(),
    area: z.string().optional(),
    inShort: z.string().optional(),
    outShort: z.string().optional(),
    nights: z.array(z.number().int()).optional(),
    conf: z.string().optional(),
    phone: z.string().optional(),
    by: z.string().optional(),
    notes: z.string().optional(),
    ll: LL.optional(),
    day: z.number().int().optional(),
  })
  .passthrough();

const JourneySchema = z
  .object({
    day: z.number().int().nonnegative(),
    mode: z.string(),
    by: z.string().optional(),
    from: z.string(),
    to: z.string(),
    dur: z.string().optional(),
  })
  .passthrough();

export const OpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('update_item'), id: z.string(), fields: Fields }),
  z.object({ op: z.literal('add_item'), day: z.number().int(), after_id: z.string().nullable().optional(), item: ItemSchema }),
  z.object({ op: z.literal('remove_item'), id: z.string() }),
  z.object({ op: z.literal('update_day'), day: z.number().int(), fields: Fields }),
  z.object({ op: z.literal('add_day'), day: DaySchema }),
  z.object({ op: z.literal('remove_day'), day: z.number().int() }),
  z.object({ op: z.literal('update_stay'), id: z.string(), fields: Fields }),
  z.object({ op: z.literal('add_stay'), stay: StaySchema }),
  z.object({ op: z.literal('remove_stay'), id: z.string() }),
  z.object({ op: z.literal('add_journey'), journey: JourneySchema }),
  z.object({ op: z.literal('update_journey'), index: z.number().int(), fields: Fields }),
  z.object({ op: z.literal('remove_journey'), index: z.number().int() }),
]);
export type Op = z.infer<typeof OpSchema>;

export const EditResultSchema = z.object({
  summary: z.array(z.string()),
  ops: z.array(OpSchema),
});
export type EditResult = z.infer<typeof EditResultSchema>;

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const rid = (p: string) => p + Math.random().toString(36).slice(2, 7);

/** Apply a patch to a copy of the trip. Port of the prototype's applyOps(). */
export function applyOps(trip: Trip, ops: Op[]): Trip {
  const t = clone(trip);
  const findItem = (id: string): [Day | null, number] => {
    for (const d of t.days) {
      const i = d.items.findIndex((x) => (x as { id?: string }).id === id);
      if (i >= 0) return [d, i];
    }
    return [null, -1];
  };
  const dayBy = (n: number) => t.days.find((d) => d.num === n);
  for (const o of ops) {
    switch (o.op) {
      case 'update_item': {
        const [d, i] = findItem(o.id);
        if (d) Object.assign(d.items[i], o.fields);
        break;
      }
      case 'add_item': {
        const d = dayBy(o.day);
        if (!d) break;
        const it = { kind: 'stop', ...o.item } as Item & { id?: string };
        it.id = it.id || rid('n');
        const i = o.after_id ? d.items.findIndex((x) => (x as { id?: string }).id === o.after_id) : -1;
        d.items.splice(o.after_id ? (i >= 0 ? i + 1 : d.items.length) : 0, 0, it as Item);
        break;
      }
      case 'remove_item': {
        const [d, i] = findItem(o.id);
        if (d) d.items.splice(i, 1);
        break;
      }
      case 'update_day': {
        const d = dayBy(o.day);
        if (d) Object.assign(d, o.fields);
        break;
      }
      case 'add_day':
        t.days = t.days.filter((d) => d.num !== o.day.num);
        t.days.push(o.day as unknown as Day);
        break;
      case 'remove_day':
        t.days = t.days.filter((d) => d.num !== o.day);
        break;
      case 'update_stay':
        if (t.stays[o.id]) Object.assign(t.stays[o.id], o.fields);
        break;
      case 'add_stay':
        t.stays[o.stay.id] = o.stay as unknown as Stay;
        break;
      case 'remove_stay':
        delete t.stays[o.id];
        t.days.forEach((d) => {
          if (d.stay === o.id) d.stay = null;
        });
        break;
      case 'add_journey':
        t.journeys.push(o.journey as unknown as Journey);
        t.journeys.sort((a, b) => a.day - b.day);
        break;
      case 'update_journey':
        if (t.journeys[o.index]) Object.assign(t.journeys[o.index], o.fields);
        break;
      case 'remove_journey':
        t.journeys.splice(o.index, 1);
        break;
    }
  }
  return normalizeTrip(t);
}

/** Fill defaults so the UI never trips over partial data from the model. */
export function normalizeTrip(t: Trip): Trip {
  t.days = (t.days || []).sort((a, b) => a.num - b.num);
  t.stays = t.stays || {};
  for (const s of Object.values(t.stays)) {
    s.nights = s.nights || [];
    s.area = s.area ?? s.city;
    s.inShort = s.inShort ?? '—';
    s.outShort = s.outShort ?? '—';
    s.conf = s.conf || 'Add confirmation';
    s.phone = s.phone || 'Add phone';
    s.by = s.by || 'Booked yourself';
    s.notes = s.notes ?? '';
    if (s.day == null) s.day = s.nights[0] ?? 0;
  }
  t.days.forEach((d, k) => {
    d.items = (d.items || []).map((it, j) => {
      const x = it as Item & { id?: string };
      if (!x.kind) (x as Item).kind = 'stop';
      if (x.kind === 'stop') {
        x.id = x.id || `x${d.num}_${j}_${Math.random().toString(36).slice(2, 6)}`;
        x.time = x.time || '—';
        x.sub = x.sub ?? '';
      } else {
        x.dur = x.dur || '—';
        x.text = x.text ?? '';
        x.mode = x.mode || 'car';
      }
      return x as Item;
    });
    d.mode = d.mode || 'Self-planned';
    d.stay = d.stay && t.stays[d.stay] ? d.stay : null;
    d.summary = d.summary ?? '';
    d.bring = d.bring || [];
    d.title = d.title || `Day ${k + 1}`;
  });
  t.journeys = (t.journeys || []).filter((j) => j.day < t.days.length);
  return t;
}
