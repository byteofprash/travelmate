import { EXTRAS } from './extras';
import { isStop } from './derive';
import { plural } from './format';
import type { Day, LatLon, Stop, Trip } from './types';

/** Everything the map needs, in real coordinates. Rendering (Leaflet) lives in MapView. */
export interface MapMarker {
  ll: LatLon;
  n: string;
  label: string;
  fill: string;
  /** Force the label to the left ('end') or right ('start') of the marker. */
  anchor?: 'start' | 'end';
  stop?: Stop; // clicking opens this stop
  day?: number; // or jumps to this day index (whole-trip mode)
}
export interface MapCard {
  n: string;
  time: string;
  title: string;
  sub: string;
  fill: string;
  stop?: Stop;
  day?: number;
}
export interface MapModel {
  title: string;
  routes: { pts: LatLon[]; dash?: string }[];
  markers: MapMarker[];
  cards: MapCard[];
  /** Points the view should fit. Empty means there is nothing to show. */
  bounds: LatLon[];
}

const STAY = '#408335';
const DARK = '#222428';

export function buildTripMap(trip: Trip, title: string): MapModel {
  const ex = EXTRAS[trip.id] || {};
  const cities =
    ex.mapCities ||
    Object.values(trip.stays)
      .filter((s) => s.ll)
      .sort((a, b) => (a.nights[0] ?? 0) - (b.nights[0] ?? 0))
      .map((s, i) => ({
        label: s.city,
        ll: s.ll as LatLon,
        sub: `${plural(s.nights.length, 'night')} · ${s.name}`,
        time: s.inShort.split(',')[0],
        day: s.nights[0] ?? 0,
        anchor: (i % 2 ? 'end' : 'start') as 'start' | 'end',
      }));
  if (!cities.length) return { title, routes: [], markers: [], cards: [], bounds: [] };

  // The prototype draws road legs solid and flights dotted ('2 7').
  const routes = ex.tripRoutes
    ? ex.tripRoutes.map((r) => ({ pts: r.pts, dash: r.dash === '0' ? undefined : r.dash }))
    : [{ pts: cities.map((c) => c.ll) }];
  return {
    title,
    routes,
    markers: cities.map((c, i) => ({ ll: c.ll, n: String(i + 1), label: c.label, anchor: c.anchor, fill: DARK, day: c.day })),
    cards: cities.map((c, i) => ({ n: String(i + 1), time: c.time, title: c.label, sub: c.sub, fill: DARK, day: c.day })),
    bounds: [...cities.map((c) => c.ll), ...routes.flatMap((r) => r.pts)],
  };
}

export function buildDayMap(trip: Trip, day: Day, accent: string): MapModel {
  const title = 'Day ' + day.num + ' · ' + day.title;
  const stops = day.items.filter((i): i is Stop => isStop(i) && !!i.ll);

  // Stops at the same coordinates share one marker.
  const uniq: { ll: LatLon; stops: Stop[] }[] = [];
  stops.forEach((s) => {
    const u = uniq.find((q) => q.ll[0] === s.ll![0] && q.ll[1] === s.ll![1]);
    if (u) u.stops.push(s);
    else uniq.push({ ll: s.ll!, stops: [s] });
  });

  // The route runs through the stops plus any `via` waypoints on legs.
  const route: LatLon[] = [];
  day.items.forEach((it) => {
    if (isStop(it) && it.ll) route.push(it.ll);
    else if (!isStop(it) && it.via) route.push(...it.via);
  });
  if (!route.length) return { title, routes: [], markers: [], cards: [], bounds: [] };

  const fillOf = (s: Stop) => (s.tag === 'Stay' || s.stay ? STAY : accent);
  return {
    title,
    routes: [{ pts: route, dash: '5 6' }],
    markers: uniq.map((u, i) => {
      const s0 = u.stops[0];
      const label = u.stops.length > 1 ? (s0.stay ? trip.stays[s0.stay]?.name ?? s0.sub : s0.sub) : s0.title;
      return { ll: u.ll, n: String(i + 1), label, fill: fillOf(s0), stop: s0 };
    }),
    cards: stops.map((s) => ({
      n: String(uniq.findIndex((u) => u.stops.includes(s)) + 1),
      time: s.time,
      title: s.title,
      sub: s.sub,
      fill: fillOf(s),
      stop: s,
    })),
    bounds: route,
  };
}
