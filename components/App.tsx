'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Sidebar } from './Sidebar';
import { CalendarDays, Map as MapIcon, Route, type LucideIcon } from 'lucide-react';
import { Home } from './screens/Home';
import { Today } from './screens/Today';
import { TripView } from './screens/TripView';
import { MapView } from './screens/MapView';
import { DaySheet, EditSheet, JourneysSheet, SettingsSheet, SheetFrame, StaySheet, StaysSheet, StopSheet } from './Sheets';
import { applyOps, type EditResult } from '@/lib/ops';
import { DEFAULT_SETTINGS, load, loadSettings, sampleTrip, save, saveSettings, type Persisted } from '@/lib/store';
import { todayIndex } from '@/lib/derive';
import { toISO, toMin } from '@/lib/format';
import { C, rule, sans } from '@/lib/theme';
import type { Settings, Sheet, Stop, Trip } from '@/lib/types';

type Tab = 'home' | 'today' | 'trip' | 'map';

const EG_EXAMPLES = [
  'Move the Abu Simbel pick-up to 03:30',
  'Add a felucca ride in Aswan at 17:00 on the 27th',
  'Cairo hotel confirmation is LPV-2231, phone +20 2 3383 0000',
];
const examplesFor = (id: string, name: string, empty: boolean) =>
  id === 'eg'
    ? EG_EXAMPLES
    : empty
      ? [`Flying in on the first morning, home on the last evening`, `Staying at one hotel in ${name.split(' ')[0]} for every night`, `Add a free day to explore on day 2`]
      : ['Add dinner at 19:30 on day 2', 'Move the first pick-up 30 minutes later', 'Add my hotel confirmation number'];

const SIDEBAR_KEY = 'tc-sidebar-v1';
// Keep in sync with the desktop breakpoint in globals.css.
const DESKTOP_QUERY = '(min-width: 900px)';
function useDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(DESKTOP_QUERY);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

const ERR ='Couldn’t update the trip. Try rephrasing, or try again in a moment.';

/** `?today=2026-12-25&time=10:30` pins the clock, for checking the now line before the trip. */
function readClockOverride() {
  if (typeof window === 'undefined') return { today: null as string | null, time: null as number | null };
  const q = new URLSearchParams(window.location.search);
  const today = /^\d{4}-\d\d-\d\d$/.test(q.get('today') || '') ? q.get('today') : null;
  return { today, time: toMin(q.get('time')) };
}

export default function App() {
  const [data, setData] = useState<Persisted>(() => load());
  const [settings, setSettings] = useState<Settings>(() => (typeof window === 'undefined' ? DEFAULT_SETTINGS : loadSettings()));
  const [override] = useState(readClockOverride);
  const desktop = useDesktop();
  const [sideCollapsed, setSideCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [now, setNow] = useState(() => new Date());

  const [tab, setTab] = useState<Tab>('home');
  const [tripId, setTripId] = useState<string>('eg');
  const [dayIdx, setDayIdx] = useState(0);
  const [mapMode, setMapMode] = useState<'day' | 'trip'>('day');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const lastSheet = useRef<Sheet | null>(null);
  if (sheet) lastSheet.current = sheet;
  const shown = sheet ?? lastSheet.current;

  const [draftTime, setDraftTime] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [editText, setEditText] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editResult, setEditResult] = useState<{ summary: string[]; n: number } | null>(null);
  const [showData, setShowData] = useState(false);
  const [toast, setToast] = useState('');
  const [toastText, setToastText] = useState(' '); // kept while the toast fades out
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => save(data), [data]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sideCollapsed ? '1' : '0');
    } catch {}
  }, [sideCollapsed]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const todayISO = override.today ?? toISO(now);
  const nowMin = override.time ?? now.getHours() * 60 + now.getMinutes();

  const meta = data.index.find((m) => m.id === tripId) ?? data.index[0];
  const trip = data.trips[meta.id];
  const planned = trip.days.length > 0;
  const di = Math.max(0, Math.min(dayIdx, trip.days.length - 1));
  const day = trip.days[di];
  const tIdx = todayIndex(meta, trip, todayISO);

  const flash = useCallback((t: string) => {
    setToast(t);
    setToastText(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const setTrip = (id: string, next: Trip, pushHistory?: Trip) =>
    setData((d) => ({
      ...d,
      trips: { ...d.trips, [id]: next },
      index: d.index.map((m) => (m.id === id ? { ...m, status: next.days.length ? 'planned' : 'empty' } : m)),
      history: pushHistory ? { ...d.history, [id]: [...(d.history[id] || []), pushHistory] } : d.history,
    }));

  const go = (t: Tab, extra?: { dayIdx?: number; mapMode?: 'day' | 'trip' }) => {
    setTab(t);
    setSheet(null);
    if (extra?.dayIdx != null) setDayIdx(extra.dayIdx);
    if (extra?.mapMode) setMapMode(extra.mapMode);
  };
  const pickDay = (i: number) => {
    setDayIdx(i);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  const resetEditUi = () => {
    setEditErr('');
    setEditResult(null);
    setShowData(false);
  };

  const openTrip = (id: string) => {
    const m = data.index.find((x) => x.id === id)!;
    const t = data.trips[id];
    setTripId(id);
    resetEditUi();
    if (t.days.length) {
      const ti = todayIndex(m, t, todayISO);
      go('today', { dayIdx: ti >= 0 ? ti : 0 });
    } else {
      setEditText('');
      setSheet({ type: 'add', tripId: id });
    }
  };

  const openStop = (s: Stop) => {
    if (s.stay && trip.stays[s.stay]) return setSheet({ type: 'stay', id: s.stay });
    setDraftTime(toMin(s.time) != null ? s.time : '');
    setDraftNote(s.note ?? '');
    setSheet({ type: 'stop', id: s.id });
  };

  const findStop = (id?: string) => {
    for (const [i, d] of trip.days.entries())
      for (const it of d.items) if (it.kind === 'stop' && it.id === id) return { dayIndex: i, day: d, stop: it };
    return null;
  };

  const saveStop = () => {
    const f = findStop(sheet?.id);
    if (!f) return;
    const next: Trip = JSON.parse(JSON.stringify(trip));
    const it = next.days[f.dayIndex].items.find((x) => x.kind === 'stop' && x.id === f.stop.id) as Stop;
    // Accept '9:30', '0930' or '09:30'; anything else keeps the original time.
    const m = /^(\d{1,2}):?(\d{2})$/.exec(draftTime.trim());
    if (m && +m[1] < 24 && +m[2] < 60) it.time = m[1].padStart(2, '0') + ':' + m[2];
    else if (!draftTime.trim()) it.time = '—';
    it.note = draftNote.trim() || undefined;
    setTrip(trip.id, next);
    setSheet(null);
    flash('Saved');
  };

  const runEdit = async () => {
    const text = editText.trim();
    if (!text || editBusy) return;
    const id = trip.id;
    const before = trip;
    setEditBusy(true);
    setEditErr('');
    setEditResult(null);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ request: text, trip: before, meta: { name: meta.name, start: meta.start, end: meta.end, nights: meta.nights } }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = (await res.json()) as EditResult;
      const n = out.ops.length;
      if (n) {
        setTrip(id, applyOps(before, out.ops), before);
        flash('Trip updated');
      }
      setEditResult({ summary: out.summary, n });
      setEditText(n ? '' : text);
    } catch {
      setEditErr(ERR);
    } finally {
      setEditBusy(false);
    }
  };

  const undoEdit = () => {
    const h = data.history[trip.id] || [];
    const prev = h[h.length - 1];
    if (!prev) return;
    setData((d) => ({
      ...d,
      trips: { ...d.trips, [trip.id]: prev },
      index: d.index.map((m) => (m.id === trip.id ? { ...m, status: prev.days.length ? 'planned' : 'empty' } : m)),
      history: { ...d.history, [trip.id]: h.slice(0, -1) },
    }));
    setEditResult(null);
    flash('Change undone');
  };

  const resetTrip = () => {
    setData((d) => ({ ...d, trips: { ...d.trips, [trip.id]: sampleTrip(trip.id) }, history: { ...d.history, [trip.id]: [] } }));
    setEditResult(null);
    const ti = todayIndex(meta, sampleTrip(trip.id), todayISO);
    setDayIdx(ti >= 0 ? ti : 0);
    flash('Reset to original trip');
  };

  const onTonight = () => {
    if (day.stay && trip.stays[day.stay]) setSheet({ type: 'stay', id: day.stay });
    else {
      const lastStop = [...day.items].reverse().find((i): i is Stop => i.kind === 'stop');
      if (lastStop) openStop(lastStop);
    }
  };

  // After an edit empties a trip, fall back to the Trips screen.
  const onTripScreen = tab !== 'home' && planned;
  const effTab: Tab = onTripScreen ? tab : 'home';

  const sheetBody = () => {
    if (!shown) return null;
    switch (shown.type) {
      case 'stop': {
        const f = findStop(shown.id);
        if (!f) return null;
        return (
          <StopSheet
            meta={meta}
            trip={trip}
            day={f.day}
            stop={f.stop}
            draftTime={draftTime}
            draftNote={draftNote}
            onTime={setDraftTime}
            onNote={setDraftNote}
            onMap={() => go('map', { mapMode: 'day', dayIdx: f.dayIndex })}
            onSave={saveStop}
          />
        );
      }
      case 'stay':
        return (
          <StaySheet
            meta={meta}
            trip={trip}
            id={shown.id!}
            accent={settings.accent}
            onMap={() => go('map', { mapMode: 'day', dayIdx: trip.stays[shown.id!]?.day ?? 0 })}
            onDone={() => setSheet(null)}
          />
        );
      case 'day':
        return day ? <DaySheet meta={meta} trip={trip} day={day} dayIdx={di} accent={settings.accent} onTonight={onTonight} /> : null;
      case 'journeys':
        return <JourneysSheet meta={meta} trip={trip} dayIdx={di} onOpen={(d) => go('today', { dayIdx: d })} />;
      case 'stays':
        return <StaysSheet trip={trip} dayIdx={di} accent={settings.accent} onOpen={(id) => setSheet({ type: 'stay', id })} />;
      case 'add':
        return (
          <EditSheet
            meta={meta}
            trip={trip}
            text={editText}
            busy={editBusy}
            err={editErr}
            result={editResult}
            canUndo={(data.history[trip.id] || []).length > 0}
            showData={showData}
            examples={examplesFor(trip.id, meta.name, !planned)}
            onText={setEditText}
            onApply={runEdit}
            onUndo={undoEdit}
            onToggleData={() => setShowData((s) => !s)}
            onReset={resetTrip}
          />
        );
      case 'settings':
        return <SettingsSheet settings={settings} onChange={setSettings} />;
    }
  };

  const tabs: [Tab, string, LucideIcon][] = [
    ['today', 'Today', CalendarDays],
    ['trip', 'Trip', Route],
    ['map', 'Map', MapIcon],
  ];

  return (
    <div className="stage">
      <div className="phone" style={{ background: C.paper, color: C.ink, ['--accent' as string]: settings.accent }}>
        {desktop && (
          <Sidebar
            tab={effTab}
            collapsed={sideCollapsed}
            tripName={meta.name}
            showTrip={planned}
            accent={settings.accent}
            onToggle={() => setSideCollapsed((c) => !c)}
            onGo={(t) => go(t)}
            onSettings={() => setSheet({ type: 'settings' })}
          />
        )}
        <div className="main">
        {effTab === 'home' && (
          <Home
            index={data.index}
            trips={data.trips}
            todayISO={todayISO}
            accent={settings.accent}
            onOpen={openTrip}
            onSettings={() => setSheet({ type: 'settings' })}
          />
        )}
        {effTab === 'today' && day && (
          <Today
            ref={scrollRef}
            meta={meta}
            trip={trip}
            day={day}
            dayIdx={di}
            todayIdx={tIdx}
            todayISO={todayISO}
            nowMin={nowMin}
            settings={settings}
            onHome={() => go('home')}
            onJourneys={() => setSheet({ type: 'journeys' })}
            onStays={() => setSheet({ type: 'stays' })}
            onPickDay={pickDay}
            onDaySheet={() => setSheet({ type: 'day' })}
            onStop={openStop}
          />
        )}
        {effTab === 'trip' && (
          <TripView
            meta={meta}
            trip={trip}
            todayIdx={tIdx}
            settings={settings}
            onHome={() => go('home')}
            onEdit={() => {
              resetEditUi();
              setSheet({ type: 'add', tripId: trip.id });
            }}
            onDay={(i) => go('today', { dayIdx: i })}
          />
        )}
        {effTab === 'map' && day && (
          <MapView
            meta={meta}
            trip={trip}
            dayIdx={di}
            mode={mapMode}
            settings={settings}
            onMode={setMapMode}
            onPickDay={setDayIdx}
            onCity={(d) => {
              setMapMode('day');
              setDayIdx(d);
            }}
            onStop={openStop}
          />
        )}
        </div>

        <nav
          aria-label="Trip sections"
          style={{
            display: effTab === 'home' || desktop ? 'none' : 'grid',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            height: 'var(--tabbar)',
            background: 'rgba(255,255,255,.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: `1px solid ${rule(0.1)}`,
            gridTemplateColumns: 'repeat(3,1fr)',
            padding: '0 8px var(--safe-bottom)',
          }}
        >
          {tabs.map(([k, l, Icon]) => {
            const active = effTab === k;
            return (
              <div
                key={k}
                onClick={() => go(k)}
                role="button"
                tabIndex={0}
                aria-label={l}
                title={l}
                aria-current={active ? 'page' : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: active ? C.ink : C.muted2 }}
              >
                <Icon size={22} strokeWidth={active ? 1.9 : 1.6} />
                <div style={{ width: 4, height: 4, borderRadius: 2, background: active ? settings.accent : 'transparent' }} />
              </div>
            );
          })}
        </nav>

        <SheetFrame open={!!sheet} onClose={() => setSheet(null)}>
          {sheetBody()}
        </SheetFrame>

        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 'calc(var(--top) - 2px)',
            left: '50%',
            zIndex: 40,
            transform: `translateX(-50%) translateY(${toast ? '0' : '-10px'})`,
            opacity: toast ? 1 : 0,
            transition: 'all .3s',
            padding: '10px 16px',
            borderRadius: 8,
            background: C.charcoal,
            color: C.darkText,
            font: sans(500, 12.5),
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {toastText}
        </div>
      </div>
    </div>
  );
}

