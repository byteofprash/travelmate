import { EXTRAS } from './extras';
import { isStop } from './derive';
import { plural } from './format';
import type { Day, LatLon, Stop, Trip } from './types';

interface Box { x: number; y: number; w: number; h: number }
interface Proj { f: (p: LatLon) => [number, number]; s: number; k: number }

function project(pts: LatLon[], box: Box): Proj {
  const lat = pts.map((p) => p[0]), lon = pts.map((p) => p[1]);
  const a = Math.min(...lat), b = Math.max(...lat), c = Math.min(...lon), d = Math.max(...lon);
  const mid = (a + b) / 2, k = Math.cos((mid * Math.PI) / 180);
  const sx = Math.max((d - c) * k, 0.03), sy = Math.max(b - a, 0.03);
  const s = Math.min(box.w / sx, box.h / sy);
  const cx = ((c + d) / 2) * k, cy = (a + b) / 2;
  return { f: (p) => [+(box.x + box.w / 2 + (p[1] * k - cx) * s).toFixed(1), +(box.y + box.h / 2 - (p[0] - cy) * s).toFixed(1)], s, k };
}

export interface Marker {
  x: number; y: number; n: string; label: string; fill: string;
  labelLeft: boolean; labelHidden: boolean; onClick: () => void;
}
export interface MapCard { n: string; time: string; title: string; sub: string; fill: string; onClick: () => void }
export interface MapModel {
  sea: string; river: string; riverW: number; scale: string; title: string;
  routes: { pts: string; dash: string }[];
  labels: { t: string; x: number; y: number }[];
  markers: Marker[]; cards: MapCard[];
}

type RawMarker = Omit<Marker, 'labelLeft' | 'labelHidden'> & { anchor?: 'start' | 'end' };

function finish(m: Omit<MapModel, 'markers'> & { markers: RawMarker[] }, W: number): MapModel {
  return {
    ...m,
    markers: m.markers.map((k, i, arr) => ({
      ...k,
      labelLeft: k.anchor === 'end' || k.x > W / 2,
      labelHidden: arr.slice(0, i).some((o) => Math.hypot(o.x - k.x, o.y - k.y) < 30),
    })),
  };
}

const STAY = '#2F6F73';
const DARK = '#26211B';

export function buildTripMap(trip: Trip, tripTitle: string, W: number, H: number, onCity: (day: number) => void): MapModel {
  const box = { x: 50, y: 170, w: W - 100, h: Math.max(150, H - 430) };
  const ex = EXTRAS[trip.id] || {};
  const cities =
    ex.mapCities ||
    Object.values(trip.stays)
      .filter((s) => s.ll)
      .sort((a, b) => (a.nights[0] ?? 0) - (b.nights[0] ?? 0))
      .map((s, i) => ({ label: s.city, ll: s.ll as LatLon, sub: `${plural(s.nights.length, 'night')} · ${s.name}`, time: s.inShort.split(',')[0], day: s.nights[0] ?? 0, anchor: (i % 2 ? 'end' : 'start') as 'start' | 'end' }));
  if (!cities.length) return { sea: '', river: '', riverW: 4, scale: '', title: tripTitle, routes: [], labels: [], markers: [], cards: [] };
  const pr = project(cities.map((c) => c.ll), box);
  const str = (arr: LatLon[]) => arr.map((p) => pr.f(p).join(',')).join(' ');
  const routes = ex.tripRoutes ? ex.tripRoutes.map((r) => ({ pts: str(r.pts), dash: r.dash })) : [{ pts: str(cities.map((c) => c.ll)), dash: '0' }];
  return finish(
    {
      sea: ex.sea ? str(ex.sea) : '',
      river: ex.river ? str(ex.river) : '',
      riverW: 4,
      scale: ex.tripScale || '',
      title: tripTitle,
      routes,
      labels: (ex.tripLabels || []).map((l) => { const [x, y] = pr.f(l.ll); return { t: l.t, x: x + (l.dx || 0), y }; }),
      markers: cities.map((c, i) => {
        const [x, y] = pr.f(c.ll);
        return { x, y, n: String(i + 1), label: c.label, anchor: c.anchor, fill: DARK, onClick: () => onCity(c.day) };
      }),
      cards: cities.map((c, i) => ({ n: String(i + 1), time: c.time, title: c.label, sub: c.sub, fill: DARK, onClick: () => onCity(c.day) })),
    },
    W,
  );
}

export function buildDayMap(trip: Trip, day: Day, accent: string, W: number, H: number, onStop: (s: Stop) => void): MapModel {
  const box = { x: 50, y: 170, w: W - 100, h: Math.max(150, H - 430) };
  const ex = EXTRAS[trip.id] || {};
  const title = 'Day ' + day.num + ' · ' + day.title;
  const stops = day.items.filter((i): i is Stop => isStop(i) && !!i.ll);
  const uniq: { ll: LatLon; stops: Stop[] }[] = [];
  stops.forEach((s) => {
    const u = uniq.find((q) => q.ll[0] === s.ll![0] && q.ll[1] === s.ll![1]);
    if (u) u.stops.push(s);
    else uniq.push({ ll: s.ll!, stops: [s] });
  });
  const route: LatLon[] = [];
  day.items.forEach((it) => {
    if (isStop(it) && it.ll) route.push(it.ll);
    else if (!isStop(it) && it.via) route.push(...it.via);
  });
  if (!route.length) return { sea: '', river: '', riverW: 4, scale: '', title, routes: [], labels: [], markers: [], cards: [] };
  const pr = project(route, box);
  const str = (arr: LatLon[]) => arr.map((p) => pr.f(p).join(',')).join(' ');
  const spanKm = Math.round((box.w / pr.s / pr.k) * 111 * 0.25);
  const fillOf = (s: Stop) => (s.tag === 'Stay' || s.stay ? STAY : accent);
  const lab = pr.s > 2000 ? ex.dayLabelNear : ex.dayLabelFar;
  return finish(
    {
      sea: ex.sea ? str(ex.sea) : '',
      river: ex.river ? str(ex.river) : '',
      riverW: pr.s > 2000 ? 22 : pr.s > 400 ? 8 : 4,
      scale: spanKm < 2 ? '~' + Math.round((spanKm * 1000) / 100) * 100 + ' m' : '~' + spanKm + ' km',
      title,
      routes: [{ pts: str(route), dash: '5 6' }],
      labels: lab ? [(() => { const [x, y] = pr.f(lab.ll); return { t: lab.t, x: x + (lab.dx || 0), y }; })()] : [],
      markers: uniq.map((u, i) => {
        const [x, y] = pr.f(u.ll);
        const s0 = u.stops[0];
        const label = u.stops.length > 1 ? (s0.stay ? trip.stays[s0.stay]?.name ?? s0.sub : s0.sub) : s0.title;
        return { x, y, n: String(i + 1), label, fill: fillOf(s0), onClick: () => onStop(s0) };
      }),
      cards: stops.map((s) => ({
        n: String(uniq.findIndex((u) => u.stops.includes(s)) + 1),
        time: s.time,
        title: s.title,
        sub: s.sub,
        fill: fillOf(s),
        onClick: () => onStop(s),
      })),
    },
    W,
  );
}
