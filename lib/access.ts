/**
 * The access code, on the client. The app is locked until a valid code has been entered; every request to the
 * server carries it, and a 401 from any of them locks the app again.
 */
const CODE_KEY = 'tc-access-v1';
export const LOCK_EVENT = 'tc-lock';

export const readCode = (): string => {
  try {
    return localStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
};
export const writeCode = (c: string) => {
  try {
    localStorage.setItem(CODE_KEY, c);
  } catch {}
};
export const clearCode = () => {
  try {
    localStorage.removeItem(CODE_KEY);
  } catch {}
};

/** fetch() with the access code attached. A 401 means the server no longer accepts the code, so lock the app. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const code = readCode();
  if (code) headers.set('x-access-code', code);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) window.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: 'The server did not accept your access code. Enter it again.' }));
  return res;
}

export type Verdict = { ok: true } | { ok: false; kind: 'bad-code' | 'config' | 'offline'; message: string };

/** Ask the server whether `code` is valid. Used by the lock screen and at start-up. */
export async function verifyCode(code: string): Promise<Verdict> {
  let res: Response;
  try {
    res = await fetch('/api/auth', { headers: { 'x-access-code': code }, cache: 'no-store' });
  } catch {
    return { ok: false, kind: 'offline', message: 'Could not reach the server.' };
  }
  if (res.ok) return { ok: true };
  let msg = '';
  try {
    msg = ((await res.json()) as { error?: string }).error ?? '';
  } catch {}
  if (res.status === 401) return { ok: false, kind: 'bad-code', message: 'That access code is not right.' };
  return { ok: false, kind: 'config', message: msg || `The server answered ${res.status}.` };
}
