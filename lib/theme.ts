export const C = {
  paper: '#F3EEE4',
  sheet: '#F7F3EB',
  card: '#FBF8F2',
  cardHover: '#FFFDF8',
  sand: '#EFE8DC',
  draftBg: '#EADFCB',
  draftFg: '#6B4E1F',
  ink: '#1F1B16',
  ink2: '#4A443B',
  muted: '#6E665B',
  muted2: '#8A8174',
  dark: '#26211B',
  darkText: '#F3EEE4',
  darkMuted: '#C9BFAF',
  darkBody: '#D8CFC1',
  darkLabel: '#A89E8F',
  accent: '#A8492A',
  nile: '#2F6F73',
  flight: '#4A5B8C',
  meal: '#8A6A2F',
  now: '#D23B2E',
  error: '#B03A2E',
  scrim: 'rgba(31,27,22,.38)',
};

export const ACCENTS = ['#A8492A', '#2F6F73', '#4A5B8C', '#8A6A2F'];

export const TAGC: Record<string, string> = {
  'Pick-up': '#4A443B',
  Visit: '#A8492A',
  Meal: '#8A6A2F',
  Stay: '#2F6F73',
  Flight: '#4A5B8C',
  Arrival: '#4A5B8C',
};

export const rule = (a: number) => `rgba(31,27,22,${a})`;

// One family across the whole app: Liberation Sans (bundled, see globals.css), with Arial-metric fallbacks.
const FAMILY = "'Liberation Sans', Arimo, Arial, Helvetica, sans-serif";
export const F = { serif: FAMILY, sans: FAMILY, mono: FAMILY };
/** CSS `font` shorthand helpers. */
export const mono = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.mono}`;
export const sans = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.sans}`;
export const serif = (size: number, lh: number | string = 1, italic = false) => `${italic ? 'italic ' : ''}400 ${size}px/${lh} ${F.serif}`;
