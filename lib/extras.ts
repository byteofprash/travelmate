import type { LatLon } from './types';

/**
 * Presentation-only data that the prototype hard-coded for the Egypt trip:
 * the route box, the whole-trip map, the schematic sea/Nile and the "going home" copy.
 * Trips without an entry here derive the same things from their stays and journeys.
 */
export interface TripExtras {
  home?: { city: string; name: string; meta: string };
  operator?: string;
  routeRows?: { city: string; nights: string; leg?: string }[];
  mapCities?: { label: string; ll: LatLon; sub: string; time: string; day: number; anchor: 'start' | 'end' }[];
  tripRoutes?: { pts: LatLon[]; dash: string }[];
  sea?: LatLon[];
  river?: LatLon[];
  tripScale?: string;
  tripLabels?: { t: string; ll: LatLon; dx?: number }[];
  /** Day-mode label when zoomed right in (scale > 2000), otherwise the wide one. */
  dayLabelNear?: { t: string; ll: LatLon; dx?: number };
  dayLabelFar?: { t: string; ll: LatLon; dx?: number };
}

const HOTEL_H: LatLon = [27.215, 33.83], HOTEL_L: LatLon = [25.655, 32.618], HOTEL_A: LatLon = [24.1, 32.878], HOTEL_C: LatLon = [29.9755, 31.1435];

export const EXTRAS: Record<string, TripExtras> = {
  eg: {
    home: { city: 'Munich', name: 'Home in Munich', meta: 'AJet from Cairo via Istanbul (SAW)' },
    operator: 'Nile Tours · Driver and guide included',
    routeRows: [
      { city: 'Munich', nights: 'Depart 23 Dec', leg: 'Lufthansa + easyJet via France' },
      { city: 'Hurghada', nights: '1 night', leg: 'Private car · 4 hr 15 min' },
      { city: 'Luxor', nights: '3 nights', leg: 'Private car via Edfu & Kom Ombo' },
      { city: 'Aswan', nights: '1 night', leg: 'Abu Simbel, then flight · 1 hr 25 min' },
      { city: 'Cairo', nights: '3 nights', leg: 'AJet via Istanbul (SAW)' },
      { city: 'Munich', nights: 'Home 31 Dec' },
    ],
    mapCities: [
      { label: 'Hurghada', ll: HOTEL_H, sub: '1 night · Lily Apartments', time: '23–24 Dec', day: 0, anchor: 'start' },
      { label: 'Luxor', ll: HOTEL_L, sub: '3 nights · Jolie Ville', time: '24–27 Dec', day: 2, anchor: 'end' },
      { label: 'Aswan', ll: HOTEL_A, sub: '1 night · Bakar House', time: '27–28 Dec', day: 4, anchor: 'start' },
      { label: 'Abu Simbel', ll: [22.336, 31.626], sub: 'Day trip', time: '28 Dec', day: 5, anchor: 'start' },
      { label: 'Cairo', ll: HOTEL_C, sub: '3 nights · Locanda Pyramid View', time: '28–31 Dec', day: 6, anchor: 'end' },
    ],
    tripRoutes: [
      { pts: [HOTEL_H, [26.73, 33.93], [26.16, 32.72], HOTEL_L, [24.978, 32.873], [24.452, 32.928], HOTEL_A, [22.336, 31.626]], dash: '0' },
      { pts: [[23.964, 32.82], [27.2, 32.2], HOTEL_C], dash: '2 7' },
    ],
    sea: [[31, 32.55], [29.97, 32.55], [29.6, 32.35], [28.35, 33.1], [27.26, 33.81], [26.73, 33.94], [26.1, 34.28], [25.07, 34.9], [23.5, 35.7], [23.5, 38], [28, 38], [28, 34.6], [27.73, 34.25], [29.2, 33.1], [31, 33]],
    river: [[22.35, 31.65], [22.9, 32.3], [23.5, 32.85], [24.09, 32.9], [24.6, 32.93], [25.29, 32.55], [25.5, 32.52], [25.62, 32.58], [25.66, 32.61], [25.69, 32.632], [25.705, 32.637], [25.72, 32.646], [25.745, 32.655], [25.78, 32.672], [26.16, 32.72], [26.3, 32.2], [26.56, 31.69], [27.18, 31.18], [28.1, 30.75], [29.07, 31.1], [30.04, 31.24], [30.6, 31.05], [31.2, 30.9]],
    tripScale: '~200 km',
    tripLabels: [
      { t: 'Red Sea', ll: [26.6, 34.6] },
      { t: 'Nile', ll: [27.6, 30.95], dx: -30 },
    ],
    dayLabelNear: { t: 'Nile', ll: [25.683, 32.612], dx: -14 },
    dayLabelFar: { t: 'Red Sea', ll: [26.9, 34.3] },
  },
};
