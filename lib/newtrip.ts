import { z } from 'zod';
import { addDays, parseISO, toISO, WD } from './format';
import { applyOps, OpSchema, reviveJson } from './ops';
import type { Trip, TripMeta } from './types';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** What Claude returns when asked to create a trip from text (the create_trip tool's input). */
export const NewTripResultSchema = z.preprocess(
  (v) => reviveJson(v),
  z.object({
    missing: z.string().nullable().optional(),
    name: z.string().default(''),
    start: z.string().default(''),
    end: z.string().default(''),
    summary: z.string().default(''),
    changes: z.array(z.string()).default([]),
    ops: z.array(OpSchema).default([]),
  }),
);
export type NewTripResult = z.infer<typeof NewTripResultSchema>;

const MAX_DAYS = 120;
const validDate = (s: string) => ISO.test(s) && toISO(parseISO(s)) === s;

/** Short unique id from the trip's name, e.g. "copenhagen-malmo-x3k9". */
export function newTripId(name: string, taken: Iterable<string>): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'trip';
  const used = new Set(taken);
  for (;;) {
    const id = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (!used.has(id)) return id;
  }
}

/**
 * Turn a create_trip result (or just a name and dates) into a trip and its index entry. Throws a readable Error if the
 * dates are unusable. Day dates come from the start date, not from the model, so the weekday and date always agree
 * with the calendar; the end date is widened if the model planned past it.
 */
export function buildNewTrip(r: Pick<NewTripResult, 'name' | 'start' | 'end' | 'summary' | 'ops'>, takenIds: Iterable<string>): { meta: TripMeta; trip: Trip } {
  const name = r.name.trim();
  if (!name) throw new Error('The trip needs a name.');
  if (!validDate(r.start) || !validDate(r.end)) throw new Error('The trip needs a start and an end date.');
  const start = parseISO(r.start);
  let end = parseISO(r.end);
  if (end < start) throw new Error('The end date is before the start date.');

  const id = newTripId(name, takenIds);
  const empty: Trip = { id, year: start.getFullYear(), month: start.getMonth() + 1, days: [], stays: {}, journeys: [] };
  const trip = applyOps(empty, r.ops);

  // The calendar decides each day's date and weekday.
  for (const d of trip.days) {
    const dt = addDays(start, d.num - 1);
    d.d = dt.getDate();
    d.wd = WD[dt.getDay()];
  }
  const last = trip.days.length ? addDays(start, Math.max(...trip.days.map((d) => d.num)) - 1) : start;
  if (last > end) end = last;

  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (nights + 1 > MAX_DAYS) throw new Error('That trip is too long to plan here.');

  const meta: TripMeta = {
    id,
    name,
    start: toISO(start),
    end: toISO(end),
    nights,
    summary: r.summary.trim() || name,
    status: trip.days.length ? 'planned' : 'empty',
  };
  return { meta, trip };
}
