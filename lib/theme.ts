// Colour palette in the style of Deutsche Bahn's design system: signature red on cool neutrals,
// with blue, green and orange signal colours. (Inspired by DB's public colour values; no DB assets used.)
export const C = {
  paper: '#EDEEF0', // page background
  sheet: '#F3F3F5',
  card: '#FFFFFF',
  cardHover: '#F8F8FA',
  sand: '#E1E2E6', // info boxes, map background
  draftBg: '#FFEADF',
  draftFg: '#6F4000',
  ink: '#16181B',
  ink2: '#3B3E44',
  muted: '#5A5E68',
  muted2: '#727782',
  dark: '#222428',
  darkText: '#FFFFFF',
  darkMuted: '#C3C7CE',
  darkBody: '#E1E2E6',
  darkLabel: '#A6ABB6',
  accent: '#EC0016', // DB red
  nile: '#408335', // stays (green)
  flight: '#1455C0', // flights and arrivals (blue)
  meal: '#AD6600', // meals (orange)
  now: '#EC0016',
  error: '#C00010',
  scrim: 'rgba(13,14,17,.45)',
};

export const ACCENTS = ['#EC0016', '#1455C0', '#408335', '#814997'];

export const TAGC: Record<string, string> = {
  'Pick-up': '#3B3E44',
  Visit: '#EC0016',
  Meal: '#AD6600',
  Stay: '#408335',
  Flight: '#1455C0',
  Arrival: '#1455C0',
};

export const rule = (a: number) => `rgba(34,36,40,${a})`;

// One family across the whole app: Nunito Sans (from @fontsource-variable/nunito-sans), falling back to the
// bundled Liberation Sans and then Arial-metric fonts (for glyphs Nunito Sans lacks, such as the → arrow).
const FAMILY = "'Nunito Sans Variable', 'Liberation Sans', Arimo, Arial, Helvetica, sans-serif";
export const F = { serif: FAMILY, sans: FAMILY, mono: FAMILY };
/** CSS `font` shorthand helpers. */
export const mono = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.mono}`;
export const sans = (w: number, size: number, lh: number | string = 1) => `${w} ${size}px/${lh} ${F.sans}`;
export const serif = (size: number, lh: number | string = 1, italic = false) => `${italic ? 'italic ' : ''}400 ${size}px/${lh} ${F.serif}`;
