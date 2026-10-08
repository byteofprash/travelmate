import type { Persisted } from './store';

/** What is synced: the trips and their index. Undo history and settings stay on each device. */
export const snapshot = (p: Pick<Persisted, 'index' | 'trips'>) => JSON.stringify({ index: p.index, trips: p.trips });

/** Small non-cryptographic hash (FNV-1a), used to tell whether the trips changed since the last sync. */
export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ':' + s.length;
}

const CODE_KEY = 'tc-access-v1';
const META_KEY = 'tc-sync-v1';

export interface SyncMeta {
  rev: number; // the server revision this device last matched
  hash: string; // hash of the trips as they were at that moment
}

export const readCode = () => {
  try {
    return localStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
};
export const writeCode = (c: string) => {
  try {
    if (c) localStorage.setItem(CODE_KEY, c);
    else localStorage.removeItem(CODE_KEY);
  } catch {}
};
export const readMeta = (): SyncMeta | null => {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as SyncMeta) : null;
  } catch {
    return null;
  }
};
export const writeMeta = (m: SyncMeta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
};

export interface RemoteDoc {
  rev: number;
  updatedAt: string | null;
  data: { index: Persisted['index']; trips: Persisted['trips'] } | null;
}

export class SyncError extends Error {
  constructor(message: string, public kind: 'bad-code' | 'config' | 'offline' | 'server' | 'too-large') {
    super(message);
  }
}

async function call(code: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch('/api/state', { ...init, cache: 'no-store', headers: { 'content-type': 'application/json', 'x-access-code': code } });
  } catch {
    throw new SyncError('No connection.', 'offline');
  }
}
async function fail(res: Response): Promise<never> {
  let body: { error?: string; code?: string } = {};
  try {
    body = await res.json();
  } catch {}
  const msg = body.error || `Sync failed (${res.status}).`;
  if (res.status === 401) throw new SyncError(msg, 'bad-code');
  if (res.status === 413) throw new SyncError(msg, 'too-large');
  if (res.status === 503) throw new SyncError(msg, 'config');
  throw new SyncError(msg, 'server');
}

export async function pull(code: string): Promise<RemoteDoc> {
  const res = await call(code, { method: 'GET' });
  if (!res.ok) await fail(res);
  return res.json();
}

/** Save. Resolves `{ ok: true, rev }`, or `{ ok: false, remote }` if the server moved on since `baseRev`. */
export async function push(code: string, baseRev: number, p: Pick<Persisted, 'index' | 'trips'>) {
  const res = await call(code, { method: 'PUT', body: JSON.stringify({ baseRev, data: { index: p.index, trips: p.trips } }) });
  if (res.status === 409) return { ok: false as const, remote: (await res.json()) as RemoteDoc };
  if (!res.ok) await fail(res);
  const j = (await res.json()) as { rev: number };
  return { ok: true as const, rev: j.rev };
}
