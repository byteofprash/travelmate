import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { MODES } from './CommuteLeg';
import { isPlaceholder, plural, rangeShort } from '@/lib/format';
import { dayBits, daySummary, homeCity, nightCount, operator, staysInOrder } from '@/lib/derive';
import { ACCENTS, C, TAGC, mono, rule, sans, serif } from '@/lib/theme';
import type { Day, Leg, Settings, Stop, Trip, TripMeta } from '@/lib/types';

/* ---------- shared bits ---------- */

const kicker = (color: string = C.muted): React.CSSProperties => ({ font: mono(500, 10.5), letterSpacing: '.08em', textTransform: 'uppercase', color });
const h2: React.CSSProperties = { marginTop: 9, font: serif(30, 1.05), letterSpacing: '-.01em' };
const subTxt: React.CSSProperties = { marginTop: 6, font: sans(400, 13, 1.35), color: C.muted };
const label: React.CSSProperties = { font: mono(500, 10.5, 1.4), letterSpacing: '.07em', color: C.muted };
const btnOutline: React.CSSProperties = { padding: 14, borderRadius: 14, border: `1px solid ${rule(0.18)}`, textAlign: 'center', font: sans(500, 14), cursor: 'pointer' };
const btnDark: React.CSSProperties = { padding: 14, borderRadius: 14, background: C.dark, color: C.darkText, textAlign: 'center', font: sans(500, 14), cursor: 'pointer' };

function KV({ k, v, w = 96, size = 13 }: { k: string; v: ReactNode; w?: number; size?: number }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${rule(0.1)}`, display: 'grid', gridTemplateColumns: `${w}px minmax(0,1fr)`, gap: 10 }}>
      <div style={label}>{k}</div>
      <div style={{ font: sans(400, size, 1.4) }}>{v}</div>
    </div>
  );
}

/** Placeholder values ('Add confirmation', 'Add phone', '—') render as prompts, not values. */
const val = (v: string) => (isPlaceholder(v) ? <span style={{ color: C.muted2 }}>{v}</span> : v);

export function SheetFrame({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className={'sheet-scrim' + (open ? ' open' : '')} onClick={onClose} />
      <div className={'scroll sheet' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="sheet-grab" />
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}>
          <X size={18} strokeWidth={1.6} color={C.ink} />
        </button>
        <div className="sheet-body" style={{ padding: '10px 22px 0' }}>{children}</div>
      </div>
    </>
  );
}

/* ---------- Activity ---------- */

export function StopSheet({
  meta, trip, day, stop, draftTime, draftNote, onTime, onNote, onMap, onSave,
}: {
  meta: TripMeta; trip: Trip; day: Day; stop: Stop; draftTime: string; draftNote: string;
  onTime: (v: string) => void; onNote: (v: string) => void; onMap: () => void; onSave: () => void;
}) {
  const b = dayBits(meta, day);
  const idx = day.items.indexOf(stop);
  const pv = day.items[idx - 1], nx = day.items[idx + 1];
  const legTxt = (l?: Day['items'][number]) =>
    l && l.kind === 'leg' ? `${MODES[(l as Leg).mode]?.[0] ?? 'Car'}, ${l.dur}. ${l.text}` : 'Nothing planned';
  const tc = TAGC[stop.tag || ''] || C.muted;
  return (
    <>
      <div style={kicker(tc)}>{stop.tag} · {b.wd} {b.d} {b.mon}</div>
      <div style={h2}>{stop.title}</div>
      <div style={subTxt}>{stop.sub}</div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${rule(0.1)}` }}>
          <span style={{ font: mono(500, 10), letterSpacing: '.07em', color: C.muted }}>START</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            maxLength={5}
            aria-label="Start time, 24-hour"
            value={draftTime}
            onChange={(e) => onTime(e.target.value.replace(/[^\d:]/g, ''))}
            style={{ border: 0, background: 'transparent', font: mono(500, 16), color: C.ink, padding: 0, outline: 'none' }}
          />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${rule(0.1)}` }}>
          <span style={{ font: mono(500, 10), letterSpacing: '.07em', color: C.muted }}>DURATION</span>
          <span style={{ font: mono(500, 16) }}>{stop.dur || '—'}</span>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${rule(0.1)}` }}>
        <KV k="GETTING THERE" v={idx === 0 ? 'Start of the day' : legTxt(pv)} />
        <KV k="AFTERWARDS" v={legTxt(nx)} />
        <KV k="ARRANGED BY" v={day.mode === 'Guided' ? operator(trip) : 'You'} />
      </div>
      <div style={{ marginTop: 16, font: mono(500, 10.5), letterSpacing: '.07em', color: C.muted }}>NOTES</div>
      <textarea
        value={draftNote}
        onChange={(e) => onNote(e.target.value)}
        placeholder="Add a note: tickets, what to bring, who to call"
        rows={3}
        style={{ marginTop: 8, width: '100%', resize: 'none', padding: 12, borderRadius: 12, border: `1px solid ${rule(0.14)}`, background: C.card, font: sans(400, 14, 1.4), color: C.ink, outline: 'none' }}
      />
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
        <div onClick={onMap} role="button" tabIndex={0} style={btnOutline}>Show on map</div>
        <div onClick={onSave} role="button" tabIndex={0} style={btnDark}>Save changes</div>
      </div>
    </>
  );
}

/* ---------- Stay ---------- */

export function StaySheet({ meta, trip, id, accent, onMap, onDone }: { meta: TripMeta; trip: Trip; id: string; accent: string; onMap: () => void; onDone: () => void }) {
  const s = trip.stays[id];
  if (!s) return null;
  return (
    <>
      <div style={kicker(accent)}>Stay · {s.city}</div>
      <div style={h2}>{s.name}</div>
      <div style={subTxt}>{s.area}</div>
      <div style={{ marginTop: 18, display: 'flex', gap: 6 }}>
        {trip.days.map((d, i) => {
          const on = s.nights.includes(i);
          const b = dayBits(meta, d);
          return (
            <div key={d.num} style={{ flex: 1, padding: '9px 0', borderRadius: 10, textAlign: 'center', background: on ? C.dark : C.card, color: on ? C.darkText : C.muted2, border: `1px solid ${rule(0.1)}` }}>
              <div style={{ font: mono(500, 9.5), letterSpacing: '.06em' }}>{b.wd.toUpperCase()}</div>
              <div style={{ marginTop: 4, font: serif(17, 1) }}>{b.d}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, borderTop: `1px solid ${rule(0.1)}` }}>
        <KV w={104} size={13.5} k="CHECK-IN" v={val(s.inShort)} />
        <KV w={104} size={13.5} k="CHECK-OUT" v={val(s.outShort)} />
        <KV w={104} size={13.5} k="NIGHTS" v={String(s.nights.length)} />
        <KV w={104} size={13.5} k="CONFIRMATION" v={val(s.conf)} />
        <KV w={104} size={13.5} k="PHONE" v={isPlaceholder(s.phone) ? val(s.phone) : <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>} />
        <KV w={104} size={13.5} k="BOOKED VIA" v={s.by} />
      </div>
      {s.notes && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: C.sand, font: serif(14.5, 1.45, true), color: C.ink2 }}>{s.notes}</div>
      )}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div onClick={onMap} role="button" tabIndex={0} style={btnOutline}>Show on map</div>
        <div onClick={onDone} role="button" tabIndex={0} style={btnDark}>Done</div>
      </div>
    </>
  );
}

/* ---------- Day ---------- */

export function DaySheet({ meta, trip, day, dayIdx, accent, onTonight }: { meta: TripMeta; trip: Trip; day: Day; dayIdx: number; accent: string; onTonight: () => void }) {
  const b = dayBits(meta, day);
  const sum = daySummary(day);
  const st = day.stay ? trip.stays[day.stay] : null;
  const home = homeCity(trip);
  const tonight = st
    ? { kicker: `TONIGHT · NIGHT ${st.nights.indexOf(dayIdx) + 1} OF ${st.nights.length}`, name: st.name }
    : { kicker: 'TONIGHT', name: home?.name ?? 'No stay booked' };
  return (
    <>
      <div style={kicker(accent)}>Day {day.num} · {b.wd} {b.d} {b.month}</div>
      <div style={{ marginTop: 10, font: serif(32, 1.05, true), letterSpacing: '-.01em', textWrap: 'balance' }}>{sum.theme}</div>
      <div style={{ marginTop: 10, font: serif(14.5, 1.5), color: C.ink2, textWrap: 'pretty' }}>{sum.story}</div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        {sum.stats.map((x) => (
          <div key={x.k} style={{ padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${rule(0.1)}`, minWidth: 0 }}>
            <div style={{ font: mono(500, 9.5), letterSpacing: '.07em', color: C.muted }}>{x.k}</div>
            <div style={{ marginTop: 6, font: sans(500, 14, 1.2) }}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, font: mono(500, 10.5), letterSpacing: '.07em', color: C.muted }}>THE PLAN</div>
      <div style={{ marginTop: 8, borderTop: `1px solid ${rule(0.1)}` }}>
        {day.items.filter((i): i is Stop => i.kind === 'stop').map((p) => (
          <div key={p.id} style={{ padding: '10px 0', borderBottom: `1px solid ${rule(0.1)}`, display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', gap: 10, alignItems: 'baseline' }}>
            <div style={{ font: mono(500, 12), color: C.muted }}>{p.time}</div>
            <div style={{ font: serif(16, 1.25) }}>{p.title}</div>
          </div>
        ))}
      </div>
      {sum.bring.length > 0 && (
        <>
          <div style={{ marginTop: 18, font: mono(500, 10.5), letterSpacing: '.07em', color: C.muted }}>BRING</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sum.bring.map((x) => (
              <div key={x} style={{ padding: '7px 11px', borderRadius: 999, border: `1px solid ${rule(0.16)}`, font: sans(400, 12.5) }}>{x}</div>
            ))}
          </div>
        </>
      )}
      <div onClick={onTonight} role="button" tabIndex={0} style={{ marginTop: 18, padding: '14px 16px', borderRadius: 14, background: C.sand, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: mono(500, 10), letterSpacing: '.08em', color: C.nile }}>{tonight.kicker}</div>
          <div style={{ marginTop: 5, font: serif(17, 1.2) }}>{tonight.name}</div>
        </div>
        <div style={{ font: serif(18, 1), color: C.muted }}>→</div>
      </div>
    </>
  );
}

/* ---------- Journeys ---------- */

export function JourneysSheet({ meta, trip, dayIdx, onOpen }: { meta: TripMeta; trip: Trip; dayIdx: number; onOpen: (day: number) => void }) {
  return (
    <>
      <div style={kicker()}>ALL JOURNEYS · {rangeShort(meta.start, meta.end).toUpperCase()}</div>
      <div style={{ marginTop: 9, font: serif(30, 1.05) }}>Journeys</div>
      <div style={{ ...subTxt, lineHeight: 1.4 }}>Every flight and long transfer on this trip. Tap one to open its day.</div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trip.journeys.map((j, i) => {
          const d = trip.days[j.day];
          if (!d) return null;
          const b = dayBits(meta, d);
          return (
            <div
              key={i}
              onClick={() => onOpen(j.day)}
              role="button"
              tabIndex={0}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px minmax(0,1fr) auto',
                gap: 12,
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: 14,
                background: j.day === dayIdx ? C.sand : C.card,
                border: `1px solid ${rule(0.1)}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ font: mono(500, 9.5), letterSpacing: '.06em', color: C.muted }}>{b.wd.toUpperCase()}</div>
                <div style={{ font: serif(20, 1) }}>{b.d}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: mono(500, 10, 1.2), letterSpacing: '.07em', textTransform: 'uppercase', color: j.mode === 'Flight' ? C.flight : C.ink2 }}>
                  {j.mode} · {j.by}
                </div>
                <div style={{ marginTop: 4, font: serif(17, 1.2) }}>{j.from} → {j.to}</div>
              </div>
              <div style={{ font: mono(400, 11.5, 1.2), color: isPlaceholder(j.dur) ? C.muted2 : C.muted, textAlign: 'right', maxWidth: 74 }}>{j.dur}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Stays ---------- */

export function StaysSheet({ trip, dayIdx, accent, onOpen }: { trip: Trip; dayIdx: number; accent: string; onOpen: (id: string) => void }) {
  const stays = staysInOrder(trip);
  return (
    <>
      <div style={kicker()}>{plural(nightCount(trip), 'NIGHT', 'NIGHTS')} · {plural(stays.length, 'STAY', 'STAYS')}</div>
      <div style={{ marginTop: 9, font: serif(30, 1.05) }}>Stays</div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stays.map((s) => (
          <div
            key={s.id}
            onClick={() => onOpen(s.id)}
            role="button"
            tabIndex={0}
            style={{ padding: '14px 16px', borderRadius: 14, background: s.nights.includes(dayIdx) ? C.sand : C.card, border: `1px solid ${rule(0.1)}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, font: mono(500, 10), letterSpacing: '.07em', textTransform: 'uppercase' }}>
                <span style={{ color: accent }}>{s.city}</span>
                <span style={{ color: C.muted }}>{plural(s.nights.length, 'night')}</span>
              </div>
              <div style={{ marginTop: 6, font: serif(18, 1.2) }}>{s.name}</div>
              <div style={{ marginTop: 3, font: sans(400, 12, 1.3), color: C.muted }}>{s.inShort} → {s.outShort}</div>
            </div>
            <div style={{ font: serif(18, 1), color: C.muted }}>→</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Edit trip (Claude) ---------- */

export function EditSheet({
  meta, trip, text, busy, err, result, canUndo, showData, examples,
  onText, onApply, onUndo, onToggleData, onReset,
}: {
  meta: TripMeta; trip: Trip; text: string; busy: boolean; err: string;
  result: { summary: string[]; n: number } | null; canUndo: boolean; showData: boolean; examples: string[];
  onText: (v: string) => void; onApply: () => void; onUndo: () => void; onToggleData: () => void; onReset: () => void;
}) {
  const disabled = busy || !text.trim();
  const empty = trip.days.length === 0;
  return (
    <>
      <div style={kicker()}>{meta.name.toUpperCase()} · {rangeShort(meta.start, meta.end).toUpperCase()}</div>
      <div style={{ marginTop: 9, font: serif(30, 1.05) }}>{empty ? 'Plan this trip' : 'Edit trip'}</div>
      <div style={{ marginTop: 6, font: sans(400, 13, 1.45), color: C.muted }}>
        {empty
          ? 'Paste bookings, tour itineraries or notes. Claude turns them into days, stays and journeys, and tells you what it added.'
          : 'Describe a change, or paste bookings and new plans. Claude updates the itinerary and tells you what changed.'}
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {examples.map((t) => (
          <div
            key={t}
            onClick={() => onText(t)}
            role="button"
            tabIndex={0}
            className="chip-hov"
            style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 999, border: `1px solid ${rule(0.16)}`, font: sans(400, 12.5, 1.2), color: C.ink2, cursor: 'pointer' }}
          >
            {t}
          </div>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={empty ? 'Paste a booking email, a tour itinerary or your notes' : 'e.g. Add a dinner cruise on the 26th at 19:00, back by 22:00'}
        rows={5}
        style={{ marginTop: 12, width: '100%', resize: 'none', padding: 14, borderRadius: 14, border: `1px solid ${rule(0.14)}`, background: C.card, font: sans(400, 14, 1.45), color: C.ink, outline: 'none' }}
      />
      {err && <div style={{ marginTop: 8, font: sans(400, 12.5, 1.4), color: C.error }}>{err}</div>}
      <div
        onClick={() => !disabled && onApply()}
        role="button"
        aria-disabled={disabled}
        tabIndex={0}
        style={{ marginTop: 12, padding: 15, borderRadius: 14, background: C.dark, color: C.darkText, textAlign: 'center', font: sans(500, 14.5), cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1 }}
      >
        {busy ? 'Updating your trip…' : 'Apply with Claude'}
      </div>
      {result && (
        <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: C.sand }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div style={{ font: mono(500, 10.5), letterSpacing: '.08em', color: C.nile }}>
              {result.n ? `${result.n} ${result.n > 1 ? 'CHANGES' : 'CHANGE'}` : 'NO CHANGES'}
            </div>
            {canUndo && (
              <div onClick={onUndo} role="button" tabIndex={0} style={{ font: sans(500, 12.5), color: C.ink, textDecoration: 'underline', cursor: 'pointer' }}>Undo</div>
            )}
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.summary.map((ln, i) => (
              <div key={i} style={{ font: serif(14.5, 1.4) }}>{ln}</div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${rule(0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={onToggleData} role="button" tabIndex={0} style={{ font: sans(500, 12.5), cursor: 'pointer' }}>{showData ? 'Hide trip data' : 'View trip data (JSON)'}</div>
        <div onClick={onReset} role="button" tabIndex={0} style={{ font: sans(400, 12.5), color: C.muted, cursor: 'pointer' }}>Reset to original</div>
      </div>
      {showData && (
        <pre style={{ margin: '10px 0 0', maxHeight: 260, overflow: 'auto', padding: 12, borderRadius: 12, background: C.dark, color: '#E8DFD0', font: mono(400, 10.5, 1.5), whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(trip, null, 2)}
        </pre>
      )}
    </>
  );
}

/* ---------- Settings ---------- */

export function SettingsSheet({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1, textAlign: 'center', whiteSpace: 'nowrap', padding: '9px 14px', borderRadius: 999, font: sans(500, 12.5), cursor: 'pointer',
    background: active ? C.dark : 'transparent', color: active ? C.darkText : C.ink,
  });
  const pill: React.CSSProperties = { display: 'flex', padding: 3, borderRadius: 999, background: C.card, border: `1px solid ${rule(0.1)}` };
  return (
    <>
      <div style={kicker()}>PREFERENCES</div>
      <div style={{ marginTop: 9, font: serif(30, 1.05) }}>Settings</div>
      <div style={{ marginTop: 18, borderTop: `1px solid ${rule(0.1)}` }}>
        <div style={{ padding: '14px 0', borderBottom: `1px solid ${rule(0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={label}>ACCENT</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {ACCENTS.map((a) => (
              <div
                key={a}
                onClick={() => onChange({ ...settings, accent: a })}
                role="button"
                aria-label={`Accent ${a}`}
                tabIndex={0}
                style={{ width: 28, height: 28, borderRadius: 14, background: a, cursor: 'pointer', border: `2.5px solid ${C.sheet}`, boxShadow: settings.accent === a ? `0 0 0 1.5px ${C.ink}` : 'none' }}
              />
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 0', borderBottom: `1px solid ${rule(0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={label}>TIMELINE</div>
          <div style={pill}>
            <div onClick={() => onChange({ ...settings, cardStyle: 'cards' })} style={seg(settings.cardStyle === 'cards')}>Cards</div>
            <div onClick={() => onChange({ ...settings, cardStyle: 'ledger' })} style={seg(settings.cardStyle === 'ledger')}>Ledger</div>
          </div>
        </div>
        <div style={{ padding: '14px 0', borderBottom: `1px solid ${rule(0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={label}>SHOW COMMUTES</div>
          <div style={pill}>
            <div onClick={() => onChange({ ...settings, showTransport: true })} style={seg(settings.showTransport)}>On</div>
            <div onClick={() => onChange({ ...settings, showTransport: false })} style={seg(!settings.showTransport)}>Off</div>
          </div>
        </div>
      </div>
    </>
  );
}
