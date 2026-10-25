// 8-bit pixel art. Everything is drawn from one 16-colour palette (Sweetie 16): a dithered night-sky page, light
// panels with hard 4px outlines and notched corners, a lit top-left edge, a shaded bottom-right edge and a hard drop
// shadow. Text on panels is ink; text straight on the page is light (the `light*` tokens).
export const INK = '#1a1c2c';

export const C = {
  paper: '#29366f', // the page behind everything (night navy)
  sheet: '#f4f4f4',
  card: '#f4f4f4',
  cardHover: '#ffffff',
  sand: '#cfdbe3', // pressed wells: inputs, info boxes
  draftBg: '#ffcd75',
  draftFg: INK,
  ink: INK,
  ink2: '#333c57',
  muted: '#566c86',
  muted2: '#566c86',
  // Text that sits directly on the night-blue page rather than on a panel.
  light: '#f4f4f4',
  lightMuted: '#94b0c2',
  lightAccent: '#ffcd75',
  // "Dark" surfaces (hero cards, primary buttons, active chips and tabs) follow the accent colour, set as the
  // --accent CSS variable on the app root. Every preset colour is bright, so text on them is ink.
  dark: 'var(--accent)',
  darkText: INK,
  darkMuted: 'rgba(26,28,44,.85)',
  darkBody: INK,
  darkLabel: 'rgba(26,28,44,.75)',
  onDarkRule: 'rgba(26,28,44,.3)',
  charcoal: INK, // toast and the JSON viewer
  accent: 'var(--accent)',
  accent2: 'var(--accent2)', // secondary: highlights, always paired with ink text
  nile: '#257179', // stays
  flight: '#3b5dc9', // flights and arrivals
  meal: '#b13e53', // meals
  now: 'var(--accent2)',
  error: '#b13e53',
  scrim: 'rgba(10,11,26,.6)',
};

/** Primary + secondary presets offered in Settings. Text on the primary is ink. First is the default. */
export const PRESETS = [
  { id: 'green-yellow', name: 'Green & yellow', primary: '#38b764', secondary: '#ffcd75' },
  { id: 'sky-lime', name: 'Sky & lime', primary: '#41a6f6', secondary: '#a7f070' },
  { id: 'orange-cyan', name: 'Orange & cyan', primary: '#ef7d57', secondary: '#73eff7' },
  { id: 'yellow-sky', name: 'Yellow & sky', primary: '#ffcd75', secondary: '#41a6f6' },
] as const;
export const DEFAULT_PRESET = PRESETS[0];

/** Tag pills: a palette colour with its readable text colour. TAGBG is the fill, TAGC the text on it. */
export const TAGBG: Record<string, string> = {
  'Pick-up': '#94b0c2',
  Visit: '#b13e53',
  Meal: '#ef7d57',
  Stay: '#38b764',
  Flight: '#41a6f6',
  Arrival: '#41a6f6',
};
export const TAGC: Record<string, string> = {
  'Pick-up': INK,
  Visit: '#f4f4f4',
  Meal: INK,
  Stay: INK,
  Flight: INK,
  Arrival: INK,
};

/** A hairline on a light panel. */
export const rule = (a: number) => `rgba(26,28,44,${a})`;

// The outline: four 4px shadows, one per side. They leave the corners empty, which is what notches them.
const EDGE = `0 -4px 0 0 ${INK}, 0 4px 0 0 ${INK}, -4px 0 0 0 ${INK}, 4px 0 0 0 ${INK}`;
const LIT = 'inset 4px 4px 0 0 rgba(255,255,255,.9), inset -4px -4px 0 0 rgba(26,28,44,.2)';
const DROP = '4px 8px 0 0 rgba(10,11,26,.55), 8px 4px 0 0 rgba(10,11,26,.55)';

/** Pixel panel shadows (the names are kept from the earlier design so every surface picks them up). */
export const CLAY = {
  /** Cards and buttons: outline, lit edges, hard drop shadow. */
  raised: `${EDGE}, ${LIT}, ${DROP}`,
  /** List rows: outline, lit edges and a short block shadow underneath. */
  soft: `${EDGE}, ${LIT}, 0 8px 0 0 rgba(10,11,26,.45)`,
  /** Pressed in: inputs and wells. */
  inset: `${EDGE}, inset 4px 4px 0 0 rgba(26,28,44,.3), inset -4px -4px 0 0 rgba(255,255,255,.6)`,
  /** Outline and lit edges only, no drop shadow: for things that sit inside another panel. */
  flat: `${EDGE}, ${LIT}`,
  /** A dark panel (the tab bar). */
  dark: `${EDGE}, inset 4px 4px 0 0 rgba(255,255,255,.18), inset -4px -4px 0 0 rgba(0,0,0,.25), ${DROP}`,
  /** On an accent-coloured surface (primary buttons, hero card): a softer lit edge so the colour stays clean. */
  accent: `${EDGE}, inset 4px 4px 0 0 rgba(255,255,255,.45), inset -4px -4px 0 0 rgba(26,28,44,.25), ${DROP}`,
};
/** Nothing is round in 8-bit. */
export const R = { card: 0, ctl: 0, pill: 0, tag: 0, sheet: 0 };

// Two pixel fonts: Press Start 2P for titles and labels, VT323 for text you actually read.
// Falls back to the bundled Liberation Sans for glyphs they lack (arrows and some symbols).
const PS = "'Press Start 2P', 'Liberation Sans', monospace";
const VT = "'VT323', 'Liberation Sans', monospace";
export const F = { serif: PS, sans: VT, mono: PS };

// Press Start 2P is drawn on an 8px grid and only stays crisp when each font pixel lands on whole screen pixels, so its
// sizes snap to multiples of 4. Line heights are kept loose enough for its tall glyphs.
const snap = (n: number) => Math.max(8, Math.round(n / 4) * 4);
const lhOf = (lh: number | string, min: number) => (typeof lh === 'number' ? Math.max(lh, min) : lh);

/** Labels, numbers and times: Press Start 2P, small. */
export const mono = (_w: number, size: number, lh: number | string = 1) => `400 ${snap(size * 0.85)}px/${lhOf(lh, 1.5)} ${F.mono}`;
/** Running text: VT323, sized up because it has a small x-height. */
export const sans = (_w: number, size: number, lh: number | string = 1) => `400 ${Math.round(size * 1.5)}px/${lhOf(lh, 1.1)} ${F.sans}`;
/** Titles: Press Start 2P for big sizes; small "serif" text is body copy, so it uses VT323. Pixel fonts have no italics. */
export const serif = (size: number, lh: number | string = 1, _italic = false) =>
  size <= 17 ? `400 ${Math.round(size * 1.5)}px/${lhOf(lh, 1.1)} ${F.sans}` : `400 ${Math.max(12, snap(size * 0.5))}px/${lhOf(lh, 1.45)} ${F.serif}`; // titles never go below 12px
