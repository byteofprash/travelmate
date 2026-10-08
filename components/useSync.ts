import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { normalizeTrip } from '@/lib/ops';
import { sample, type Persisted } from '@/lib/store';
import { hash, pull, push, readCode, readMeta, snapshot, SyncError, writeCode, writeMeta, type RemoteDoc } from '@/lib/sync';

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error';

export interface SyncApi {
  code: string;
  status: SyncStatus;
  message: string;
  syncedAt: number | null;
  setCode: (c: string) => void;
  syncNow: () => void;
  /** Conflict: keep what is saved in the cloud and drop this device's changes. */
  useCloud: () => void;
  /** Conflict: keep this device's trips and overwrite the cloud copy. */
  useDevice: () => void;
}

const PUSH_DELAY = 1200;
let sampleHash: string | null = null;

/**
 * Keeps the trips in sync with the server (see /api/state). localStorage stays the offline copy: the app always
 * reads and writes that, and this hook pushes changes in the background and pulls changes from other devices.
 * If both this device and the cloud changed, nothing is overwritten: status becomes 'conflict' and the user picks.
 */
export function useSync(data: Persisted, setData: Dispatch<SetStateAction<Persisted>>, notify: (m: string) => void): SyncApi {
  const [code, setCodeState] = useState(() => (typeof window === 'undefined' ? '' : readCode()));
  const [status, setStatus] = useState<SyncStatus>(() => (typeof window !== 'undefined' && readCode() ? 'syncing' : 'off'));
  const [message, setMessage] = useState('');
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const codeRef = useRef(code);
  codeRef.current = code;
  const statusRef = useRef(status);
  statusRef.current = status;
  const busy = useRef(false);
  const again = useRef(false);
  const conflict = useRef<RemoteDoc | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const finish = (s: SyncStatus, msg = '') => {
    setStatus(s);
    setMessage(msg);
    if (s === 'synced') setSyncedAt(Date.now());
  };

  /** Replace the local trips with the server's, keeping this device's undo history. */
  const adopt = (doc: RemoteDoc) => {
    if (!doc.data) return;
    const trips = Object.fromEntries(Object.entries(doc.data.trips).map(([id, t]) => [id, normalizeTrip(t as never)]));
    const next: Persisted = { index: doc.data.index, trips, history: dataRef.current.history };
    dataRef.current = next;
    setData(next);
    writeMeta({ rev: doc.rev, hash: hash(snapshot(next)) });
  };

  const isDirty = () => {
    const h = hash(snapshot(dataRef.current));
    const m = readMeta();
    if (m) return h !== m.hash;
    sampleHash ??= hash(snapshot(sample()));
    return h !== sampleHash; // never synced: only "changed" if it differs from the built-in sample trips
  };

  const run = useCallback(async () => {
    const c = codeRef.current;
    if (!c || statusRef.current === 'conflict') return;
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    setStatus('syncing');
    try {
      const meta = readMeta();
      if (meta && !isDirty()) {
        // Nothing to send: just look for changes made on another device.
        const remote = await pull(c);
        if (remote.data && remote.rev > meta.rev) {
          adopt(remote);
          notify('Updated from another device');
        }
        finish('synced');
        return;
      }
      let baseRev = meta?.rev;
      if (baseRev == null) {
        // First sync on this device: look before overwriting anything.
        const remote = await pull(c);
        if (remote.data) {
          if (!isDirty()) {
            adopt(remote);
            finish('synced');
            return;
          }
          conflict.current = remote;
          finish('conflict', 'This device and the cloud both have trips.');
          notify('Trips already in the cloud. Open Settings to choose.');
          return;
        }
        baseRev = remote.rev;
      }
      const sent = dataRef.current;
      const res = await push(c, baseRev, sent);
      if (!res.ok) {
        conflict.current = res.remote;
        finish('conflict', 'Trips changed on another device while you were editing.');
        notify('Trips changed on another device. Open Settings to choose.');
        return;
      }
      writeMeta({ rev: res.rev, hash: hash(snapshot(sent)) });
      finish('synced');
    } catch (e) {
      const err = e instanceof SyncError ? e : new SyncError('Sync failed.', 'server');
      finish(err.kind === 'offline' ? 'offline' : 'error', err.message);
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        void run();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync on start-up, when the access code changes, and when the app comes back to the foreground or online.
  useEffect(() => {
    if (!code) {
      setStatus('off');
      return;
    }
    void run();
    const wake = () => document.visibilityState !== 'hidden' && statusRef.current !== 'error' && void run();
    const online = () => void run();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', online);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', online);
    };
  }, [code, run]);

  // Push shortly after the trips change.
  const snap = snapshot(data);
  useEffect(() => {
    if (!codeRef.current || statusRef.current === 'conflict' || statusRef.current === 'error') return;
    const m = readMeta();
    if (m && m.hash === hash(snap)) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => isDirty() && void run(), PUSH_DELAY);
    return () => clearTimeout(timer.current);
  }, [snap, run]);

  return {
    code,
    status,
    message,
    syncedAt,
    setCode(c) {
      const v = c.trim();
      writeCode(v);
      conflict.current = null;
      setCodeState(v);
      setStatus(v ? 'syncing' : 'off');
      setMessage('');
    },
    syncNow() {
      if (statusRef.current === 'error') setStatus('syncing');
      void run();
    },
    useCloud() {
      if (!conflict.current) return;
      adopt(conflict.current);
      conflict.current = null;
      finish('synced');
    },
    useDevice() {
      const remote = conflict.current;
      if (!remote) return;
      conflict.current = null;
      writeMeta({ rev: remote.rev, hash: '' }); // match the server's revision, but mark this device's trips as unsent
      statusRef.current = 'syncing';
      setStatus('syncing');
      void run();
    },
  };
}
