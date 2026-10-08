export type LatLon = [number, number];

export type Tag = 'Visit' | 'Meal' | 'Stay' | 'Flight' | 'Arrival' | 'Pick-up';
export type LegMode = 'car' | 'walk' | 'train' | 'metro' | 'flight';

export interface Stop {
  kind: 'stop';
  id: string;
  time: string; // 'HH:MM' or '—'
  title: string;
  sub: string;
  tag?: Tag | string;
  dur?: string;
  note?: string;
  ll?: LatLon;
  stay?: string; // opens the Stay sheet
}

export interface Leg {
  kind: 'leg';
  id?: string;
  mode: LegMode;
  dur: string;
  text: string;
  time?: string;
  via?: LatLon[];
}

export type Item = Stop | Leg;

export interface Day {
  num: number;
  d: number;
  wd: string;
  title: string;
  mode: 'Guided' | 'Self-planned' | string;
  stay: string | null;
  summary: string;
  theme?: string;
  blurb?: string;
  story?: string;
  bring?: string[];
  draft?: boolean;
  items: Item[];
}

export interface Stay {
  id: string;
  city: string;
  name: string;
  area: string;
  inShort: string;
  outShort: string;
  nights: number[]; // 0-based day indexes
  conf: string;
  phone: string;
  by: string;
  notes: string;
  ll?: LatLon;
  day?: number;
}

export interface Journey {
  day: number; // 0-based
  mode: 'Flight' | 'Car' | 'Train' | string;
  by: string;
  from: string;
  to: string;
  dur: string;
}

export interface Trip {
  id: string;
  year: number;
  month: number;
  days: Day[];
  stays: Record<string, Stay>;
  journeys: Journey[];
}

export interface TripMeta {
  id: string;
  name: string;
  start: string; // ISO date
  end: string; // ISO date
  nights: number;
  summary: string;
  status: 'empty' | 'planned';
}

export interface Settings {
  accent: string; // primary
  accent2: string; // secondary
  cardStyle: 'cards' | 'ledger';
  showTransport: boolean;
}

export type SheetType = 'stop' | 'stay' | 'day' | 'journeys' | 'stays' | 'add' | 'settings' | 'inbox';
export interface Sheet {
  type: SheetType;
  id?: string;
  tripId?: string;
}
