import { EXTRAS } from './extras';
import { MON, MONTHS, WD, addDays, durMin, fmtDur, isPlaceholder, parseISO, plural, toISO, toMin } from './format';
import type { Day, Journey, Leg, Stop, Trip, TripMeta } from './types';

export const isStop = (i: { kind: string }): i is Stop => i.kind === 'stop';
export const isLeg = (i: { kind: string }): i is Leg => i.kind === 'leg';

/** Calendar date of a day, from the trip's ISO start date and the day number. */
export function dayDate(meta: TripMeta, day: Day): Date {
  return addDays(parseISO(meta.start), day.num - 1);
}
export function dayBits(meta: TripMeta, day: Day) {
  const dt = dayDate(meta, day);
  return { wd: WD[dt.getDay()], d: dt.getDate(), month: MONTHS[dt.getMonth()], mon: MON[dt.getMonth()], iso: toISO(dt) };
}

export function todayIndex(meta: TripMeta, trip: Trip, todayISO: string): number {
  return trip.days.findIndex((d) => toISO(dayDate(meta, d)) === todayISO);
}

export function daySummary(day: Day) {
  const sights = day.items.filter((i) => isStop(i) && i.tag === 'Visit').length;
  const road = day.items.filter((i): i is Leg => isLeg(i) && i.mode !== 'flight').reduce((a, l) => a + durMin(l.dur), 0);
  const first = day.items.map((i) => (i as Stop | Leg).time).find((t) => toMin(t) != null);
  return {
    theme: day.theme || day.title,
    blurb: day.blurb || day.summary || '',
    story: day.story || day.summary || '',
    bring: day.bring || [],
    stats: [
      { k: 'SIGHTS', v: String(sights || '—') },
      { k: 'ON THE ROAD', v: road ? fmtDur(road) : '—' },
      { k: 'STARTS', v: first || 'Add times' },
    ],
  };
}

export function cityCount(trip: Trip) {
  return new Set(Object.values(trip.stays).map((s) => s.city)).size;
}
export function nightCount(trip: Trip) {
  return Object.values(trip.stays).reduce((a, s) => a + s.nights.length, 0);
}

export function staysInOrder(trip: Trip) {
  return Object.values(trip.stays).sort((a, b) => (a.nights[0] ?? 99) - (b.nights[0] ?? 99));
}

/** Rows for the Trip overview route box. */
export function routeRows(meta: TripMeta, trip: Trip): { city: string; nights: string; leg?: string }[] {
  const ex = EXTRAS[trip.id];
  if (ex?.routeRows) return ex.routeRows;
  const stays = staysInOrder(trip);
  return stays.map((s, i) => {
    const next = stays[i + 1];
    const j = next && trip.journeys.find((x) => x.to.includes(next.city) || next.city.includes(x.to));
    return {
      city: s.city,
      nights: plural(s.nights.length, 'night'),
      leg: next ? (j ? `${j.mode} · ${j.dur}` : 'Onward') : undefined,
    };
  });
}

export function homeCity(trip: Trip) {
  return EXTRAS[trip.id]?.home;
}

export function operator(trip: Trip) {
  return EXTRAS[trip.id]?.operator ?? 'Tour operator · Driver and guide included';
}

/** 'Autumn & winter 2026' from the trips' start months. */
export function seasonKicker(index: TripMeta[]) {
  const season = (m: number) => (m <= 1 || m === 11 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn');
  const seen: string[] = [];
  const years = new Set<number>();
  for (const t of index) {
    const d = parseISO(t.start);
    years.add(d.getFullYear());
    const s = season(d.getMonth());
    if (!seen.includes(s)) seen.push(s);
  }
  const txt = seen.join(' & ');
  return (txt.charAt(0).toUpperCase() + txt.slice(1) + ' ' + [...years].join('–')).trim();
}

/* ---------- Flights: when are they complete? ---------- */

export const isFlight = (j: Journey) => /^flight$/i.test(j.mode);

export type FlightField = 'flight number' | 'airline' | 'date' | 'departure time';

// IATA codes are two characters plus up to four digits (LH 1234, U2 8803), ICAO three letters (EZY1234). At least one
// letter is required so that a bare number such as "1234" does not pass.
const FLIGHT_NUMBER = /^(?=.*[A-Z])[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;
const CLOCK = /^([01]?\d|2[0-3]):[0-5]\d$/;

/**
 * What a flight still lacks before it counts as complete: the flight number, the airline, the date and the departure
 * time. Each is checked on the journey itself; nothing is inferred from the itinerary text or guessed. An airline is
 * a name, not a route ("ASW → CAI") or a placeholder, and a time must be a real clock time.
 */
export function flightGaps(trip: Trip, j: Journey): FlightField[] {
  const gaps: FlightField[] = [];
  if (isPlaceholder(j.number) || !FLIGHT_NUMBER.test((j.number ?? '').trim())) gaps.push('flight number');
  const by = (j.by ?? '').trim();
  if (isPlaceholder(by) || /[→>]/.test(by) || !/[A-Za-z]{2,}/.test(by)) gaps.push('airline');
  if (!trip.days[j.day]) gaps.push('date');
  if (isPlaceholder(j.time) || !CLOCK.test((j.time ?? '').trim())) gaps.push('departure time');
  return gaps;
}

export interface FlightStatus {
  /** none: no flights at all; partial: some are missing details; complete: every flight has all four. */
  state: 'none' | 'partial' | 'complete';
  total: number;
  complete: number;
  /** Every distinct detail still missing across the incomplete flights, in a fixed order. */
  missing: FlightField[];
  /** Each flight with what it lacks. */
  flights: { index: number; journey: Journey; missing: FlightField[] }[];
}

export function flightStatus(trip: Trip): FlightStatus {
  const flights = trip.journeys
    .map((journey, index) => ({ index, journey, missing: flightGaps(trip, journey) }))
    .filter((f) => isFlight(f.journey));
  const complete = flights.filter((f) => f.missing.length === 0).length;
  const order: FlightField[] = ['flight number', 'airline', 'date', 'departure time'];
  const missing = order.filter((m) => flights.some((f) => f.missing.includes(m)));
  const state = flights.length === 0 ? 'none' : complete === flights.length ? 'complete' : 'partial';
  return { state, total: flights.length, complete, missing, flights };
}
