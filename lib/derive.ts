import { EXTRAS } from './extras';
import { MON, MONTHS, WD, addDays, durMin, fmtDur, parseISO, plural, toISO, toMin } from './format';
import type { Day, Leg, Stop, Trip, TripMeta } from './types';

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
