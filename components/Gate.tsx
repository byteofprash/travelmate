'use client';

import { useEffect, useState } from 'react';
import { PixelIcon } from './PixelIcon';
import App from './App';
import { clearCode, LOCK_EVENT, readCode, verifyCode, writeCode } from '@/lib/access';
import { loadSettings } from '@/lib/store';
import { C, CLAY, INK, R, mono, sans, serif } from '@/lib/theme';

type State = { s: 'checking' } | { s: 'locked'; msg?: string } | { s: 'open' };

/**
 * Nothing in the app is shown or loaded until the server has accepted an access code. A code that was accepted
 * before is kept on this device and used again; if the server then says no (the code was changed), the app locks.
 * Offline, a stored code is trusted for the stored trips: the server still checks it on every request.
 */
export default function Gate() {
  const [st, setSt] = useState<State>({ s: 'checking' });
  const [settings] = useState(() => loadSettings());

  useEffect(() => {
    let alive = true;
    const code = readCode();
    if (!code) {
      setSt({ s: 'locked' });
    } else {
      void verifyCode(code).then((v) => {
        if (!alive) return;
        if (v.ok || v.kind === 'offline') setSt({ s: 'open' });
        else {
          clearCode();
          setSt({ s: 'locked', msg: v.kind === 'bad-code' ? 'Your access code is no longer valid. Enter it again.' : v.message });
        }
      });
    }
    const onLock = (e: Event) => {
      clearCode();
      setSt({ s: 'locked', msg: (e as CustomEvent<string>).detail });
    };
    window.addEventListener(LOCK_EVENT, onLock);
    return () => {
      alive = false;
      window.removeEventListener(LOCK_EVENT, onLock);
    };
  }, []);

  if (st.s === 'open') {
    return (
      <App
        onLock={() => {
          clearCode();
          setSt({ s: 'locked' });
        }}
      />
    );
  }
  return (
    <div className="stage">
      <div className="phone" style={{ color: C.light, ['--accent' as string]: settings.accent, ['--accent2' as string]: settings.accent2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {st.s === 'locked' && <LockScreen msg={st.msg} onUnlock={() => setSt({ s: 'open' })} />}
      </div>
    </div>
  );
}

function LockScreen({ msg, onUnlock }: { msg?: string; onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(msg ?? '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    setErr('');
    const v = await verifyCode(c);
    setBusy(false);
    if (v.ok) {
      writeCode(c);
      onUnlock();
    } else {
      setErr(v.message);
    }
  };

  return (
    <form onSubmit={submit} style={{ width: 'min(340px, calc(100% - 48px))', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
      <div style={{ alignSelf: 'center', width: 72, height: 72, margin: 6, background: 'var(--accent)', boxShadow: CLAY.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PixelIcon name="plane" size={42} />
      </div>
      <div style={{ font: serif(30, 1.5), textTransform: 'uppercase', color: C.light, textShadow: `4px 4px 0 ${INK}` }}>Travel Companion</div>
      <div style={{ font: sans(400, 14, 1.1), color: C.lightMuted }}>Enter your access code to open your trips.</div>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Access code"
        aria-label="Access code"
        autoComplete="current-password"
        autoFocus
        style={{ border: 0, margin: 4, padding: '14px 18px', borderRadius: R.pill, background: C.card, boxShadow: CLAY.inset, font: sans(400, 16), color: C.ink, outline: 'none', textAlign: 'center' }}
      />
      {err && (
        <div role="alert" style={{ font: sans(500, 13, 1.1), color: '#ef7d57' }}>
          {err}
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !code.trim()}
        style={{ border: 0, margin: 4, padding: '15px 18px 13px', borderRadius: R.pill, background: 'var(--accent)', color: C.darkText, boxShadow: CLAY.accent, font: mono(700, 14), textTransform: 'uppercase', cursor: busy || !code.trim() ? 'default' : 'pointer', opacity: busy || !code.trim() ? 0.55 : 1 }}
      >
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  );
}
