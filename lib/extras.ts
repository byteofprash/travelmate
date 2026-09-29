import type { LatLon } from './types';

/**
 * Presentation-only data that the prototype hard-coded for the Egypt trip:
 * the route box, the whole-trip map and the "going home" copy.
 * Trips without an entry here derive the same things from their stays and journeys.
 */
export interface TripExtras {
  home?: { city: string; name: string; meta: string };
  operator?: string;
  routeRows?: { city: string; nights: string; leg?: string }[];
  mapCities?: { label: string; ll: LatLon; sub: string; time: string; day: number; anchor: 'start' | 'end' }[];
  tripRoutes?: { pts: LatLon[]; dash: string }[];
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
  },
};
