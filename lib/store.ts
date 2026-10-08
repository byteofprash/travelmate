import egypt from '@/data/egypt-trip.json';
import tripsIndex from '@/data/trips-index.json';
import { normalizeTrip } from './ops';
import type { Settings, Trip, TripMeta } from './types';

const KEY = 'tc-trips-v1';
const SETTINGS_KEY = 'tc-settings-v1';
const HISTORY_LIMIT = 20;

export interface Persisted {
  index: TripMeta[];
  trips: Record<string, Trip>;
  history: Record<string, Trip[]>; // newest last; used for Undo
}

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

export function emptyTrip(meta: TripMeta): Trip {
  const s = meta.start.split('-').map(Number);
  return { id: meta.id, year: s[0], month: s[1], days: [], stays: {}, journeys: [] };
}

export function sample(): Persisted {
  const index = clone(tripsIndex) as TripMeta[];
  const trips: Record<string, Trip> = {};
  for (const m of index) trips[m.id] = m.id === 'eg' ? normalizeTrip(clone(egypt) as unknown as Trip) : emptyTrip(m);
  return { index, trips, history: {} };
}

export function sampleTrip(id: string): Trip {
  return sample().trips[id];
}

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      for (const id of Object.keys(p.trips)) p.trips[id] = normalizeTrip(p.trips[id]);
      p.history = p.history || {};
      return p;
    }
  } catch {}
  return sample();
}

export function save(p: Persisted) {
  try {
    const history = Object.fromEntries(Object.entries(p.history).map(([k, v]) => [k, v.slice(-HISTORY_LIMIT)]));
    localStorage.setItem(KEY, JSON.stringify({ ...p, history }));
  } catch {}
}

export const DEFAULT_SETTINGS: Settings = { accent: '#D8352A', cardStyle: 'cards', showTransport: true };

const LEGACY_ACCENTS: Record<string, string> = { '#A8492A': '#D8352A', '#2F6F73': '#3E8A4F', '#4A5B8C': '#2F6FBF', '#8A6A2F': '#8A56B0', '#EC0016': '#D8352A', '#408335': '#3E8A4F', '#1455C0': '#2F6FBF', '#814997': '#8A56B0' };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
      s.accent = LEGACY_ACCENTS[s.accent.toUpperCase()] ?? s.accent; // accents saved before the clay palette
      return s;
    }
  } catch {}
  return DEFAULT_SETTINGS;
}
export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}
