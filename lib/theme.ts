// Claymorphism: a warm cream base with soft pastel objects. Surfaces are puffy, borderless and lit from the
// top-left (see CLAY below and the .clay classes in app/globals.css). Text stays dark warm brown for contrast.
export const C = {
  paper: '#F4EBDD', // page background
  sheet: '#F7EFE3',
  card: '#FCF7EE',
  cardHover: '#FFFBF4',
  sand: '#EADDCB', // info boxes, map background
  draftBg: '#F8D3B0',
  draftFg: '#6B3A08',
  ink: '#3A2F2A',
  ink2: '#52443C',
  muted: '#6F6058',
  muted2: '#85766D',
  // "Dark" surfaces (hero cards, primary buttons, active chips and tabs) follow the accent colour, set as
  // the --accent CSS variable on the app root. Text on them is white.
  dark: 'var(--accent)',
  darkText: '#FFFFFF',
  darkMuted: 'rgba(255,255,255,.9)',
  darkBody: '#FFFFFF',
  darkLabel: 'rgba(255,255,255,.85)',
  onDarkRule: 'rgba(255,255,255,.3)',
  charcoal: '#2E2521', // toast and the JSON viewer
  accent: 'var(--accent)',
  accent2: 'var(--accent2)', // secondary: light pastel fills, always paired with dark ink text
  nile: '#2F6B3A', // stays (green)
  flight: '#1F4E8C', // flights and arrivals (blue)
  meal: '#8A4B0B', // meals (orange)
  now: 'var(--accent2)',
  error: '#B3261E',
  scrim: 'rgba(58,40,30,.4)',
};

/** Primary (white text on it) + secondary (pastel, dark text on it) presets offered in Settings. First is the default. */
export const PRESETS = [
  { id: 'teal-coral', name: 'Teal & coral', primary: '#1F8A7D', secondary: '#F4A58A' },
  { id: 'indigo-peach', name: 'Indigo & peach', primary: '#5B5FD6', secondary: '#F7BE96' },
  { id: 'terracotta-sage', name: 'Terracotta & sage', primary: '#C4512F', secondary: '#BBD2B8' },
  { id: 'violet-mint', name: 'Violet & mint', primary: '#7A5FD0', secondary: '#BFE8D2' },
] as const;
export const DEFAULT_PRESET = PRESETS[0];

/** Deep text colours for tags (AA on cream) and the matching pastel pill fills. */
export const TAGC: Record<string, string> = {
  'Pick-up': '#52443C',
  Visit: '#B3261E',
  Meal: '#8A4B0B',
  Stay: '#2F6B3A',
  Flight: '#1F4E8C',
  Arrival: '#1F4E8C',
};
export const TAGBG: Record<string, string> = {
  'Pick-up': '#E6DACA',
  Visit: '#F7CFC8',
  Meal: '#F8D3B0',
  Stay: '#CBE7CC',
  Flight: '#C3DBF3',
  Arrival: '#C3DBF3',
};

export const rule = (a: number) => `rgba(90,60,40,${a})`;

/** Clay shadows: outer drop + top-left highlight + bottom-right shade. */
export const CLAY = {
  raised: '0 10px 22px rgba(120,84,52,.20), inset 4px 4px 9px rgba(255,255,255,.85), inset -4px -5px 10px rgba(168,128,92,.22)',
  soft: '0 5px 12px rgba(120,84,52,.16), inset 3px 3px 6px rgba(255,255,255,.8), inset -3px -3px 7px rgba(168,128,92,.2)',
  inset: 'inset 4px 4px 9px rgba(150,110,76,.28), inset -3px -3px 7px rgba(255,255,255,.8)',
  /** Accent-tinted raised surface (primary buttons, selected chips, hero card). */
  accent: '0 10px 22px color-mix(in srgb, var(--accent) 38%, transparent), inset 4px 4px 9px rgba(255,255,255,.38), inset -4px -5px 10px rgba(0,0,0,.2)',
};
export const R = { card: 24, ctl: 16, pill: 999, tag: 999, sheet: 32 };

// One family across the whole app: Nunito Sans (from @fontsource-variable/nunito-sans), falling back to the
// bundled Liberation Sans and then Arial-metric fonts (for glyphs Nunito Sans lacks, such as the → arrow).
const FAMILY = "'Nunito Sans Variable', 'Liberation Sans', Arimo, Arial, Helvetica, sans-serif";
export const F = { serif: FAMILY, sans: FAMILY, mono: FAMILY };
/** CSS `font` shorthand helpers. */
export const mono = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.mono}`;
export const sans = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.sans}`;
export const serif = (size: number, lh: number | string = 1, italic = false) => `${italic ? 'italic ' : ''}400 ${size}px/${lh} ${F.serif}`;
