export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON = MONTHS.map((m) => m.slice(0, 3));

/** Parse 'YYYY-MM-DD' as a local calendar date (no timezone shift). */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const toMin = (t?: string | null): number | null => {
  const m = /^(\d\d):(\d\d)$/.exec(t || '');
  return m ? +m[1] * 60 + +m[2] : null;
};
export const durMin = (s?: string): number => {
  const h = /(\d+)\s*hr/.exec(s || '');
  const m = /(\d+)\s*min/.exec(s || '');
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
};
export const fmtDur = (n: number): string =>
  n >= 60 ? Math.floor(n / 60) + ' hr' + (n % 60 ? ' ' + (n % 60) + ' min' : '') : n + ' min';
export const fmtClock = (n: number): string =>
  String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');

/** '23–31 December' or '27 Oct – 2 Nov' */
export function rangeLong(start: string, end: string): string {
  const a = parseISO(start), b = parseISO(end);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]}`;
  return `${a.getDate()} ${MON[a.getMonth()]} – ${b.getDate()} ${MON[b.getMonth()]}`;
}
/** '23–31 Dec' or '30 Oct–2 Nov' */
export function rangeShort(start: string, end: string): string {
  const a = parseISO(start), b = parseISO(end);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MON[a.getMonth()]}`;
  return `${a.getDate()} ${MON[a.getMonth()]}–${b.getDate()} ${MON[b.getMonth()]}`;
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Placeholder values in the data ('—', 'Add confirmation', 'Add phone', 'Add time'). */
export const isPlaceholder = (v?: string) => !v || v === '—' || /^Add\b/.test(v);
