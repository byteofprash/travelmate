import { useEffect, useRef, useState } from 'react';
import { buildDayMap, buildTripMap } from '@/lib/map';
import { rangeShort } from '@/lib/format';
import { C, mono, rule, sans, serif } from '@/lib/theme';
import type { Settings, Stop, Trip, TripMeta } from '@/lib/types';

export function MapView({
  meta,
  trip,
  dayIdx,
  mode,
  settings,
  onMode,
  onPickDay,
  onCity,
  onStop,
}: {
  meta: TripMeta;
  trip: Trip;
  dayIdx: number;
  mode: 'day' | 'trip';
  settings: Settings;
  onMode: (m: 'day' | 'trip') => void;
  onPickDay: (i: number) => void;
  onCity: (dayIdx: number) => void;
  onStop: (s: Stop) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 402, h: 790 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { w: W, h: H } = size;
  const accent = settings.accent;
  const day = trip.days[dayIdx];
  const m =
    mode === 'trip'
      ? buildTripMap(trip, `${meta.name} · ${rangeShort(meta.start, meta.end)}`, W, H, onCity)
      : buildDayMap(trip, day, accent, W, H, onStop);

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 'none',
    whiteSpace: 'nowrap',
    padding: '8px 16px',
    borderRadius: 999,
    font: sans(500, 12.5),
    cursor: 'pointer',
    background: active ? C.dark : 'transparent',
    color: active ? C.darkText : C.ink,
  });

  return (
    <div ref={ref} style={{ position: 'absolute', inset: '0 0 var(--tabbar) 0', overflow: 'hidden', background: C.sand }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(31,27,22,.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {m.sea && <polygon points={m.sea} fill="#D6E0DB" />}
        {m.river && <polyline points={m.river} fill="none" stroke="#B9D0CC" strokeWidth={m.riverW} strokeLinecap="round" strokeLinejoin="round" />}
        {m.routes.map((r, i) => (
          <polyline key={i} points={r.pts} fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray={r.dash} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      {m.labels.map((l) => (
        <div
          key={l.t}
          style={{ position: 'absolute', left: l.x, top: l.y, font: serif(13, 1, true), color: '#5E7A77', whiteSpace: 'nowrap', transform: 'translateY(-100%)' }}
        >
          {l.t}
        </div>
      ))}
      {m.markers.map((k) => (
        <div key={k.n} onClick={k.onClick} style={{ position: 'absolute', left: k.x, top: k.y, width: 0, height: 0, cursor: 'pointer' }}>
          <div
            style={{
              position: 'absolute',
              left: -13,
              top: -13,
              width: 26,
              height: 26,
              borderRadius: 13,
              background: k.fill,
              border: `2.5px solid ${C.paper}`,
              color: C.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: mono(500, 11),
            }}
          >
            {k.n}
          </div>
          <div
            style={{
              position: 'absolute',
              top: -9,
              left: k.labelLeft ? 'auto' : 20,
              right: k.labelLeft ? 20 : 'auto',
              font: `400 15px/18px Newsreader, Georgia, serif`,
              color: C.ink,
              whiteSpace: 'nowrap',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: k.labelHidden ? 'none' : 'block',
              textShadow: `0 0 3px ${C.sand},0 0 3px ${C.sand},0 0 3px ${C.sand}`,
            }}
          >
            {k.label}
          </div>
        </div>
      ))}

      <div style={{ position: 'absolute', top: 'var(--top)', left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', padding: 3, borderRadius: 999, background: 'rgba(251,248,242,.92)', border: `1px solid ${rule(0.1)}` }}>
            <div onClick={() => onMode('day')} style={seg(mode === 'day')}>Day</div>
            <div onClick={() => onMode('trip')} style={seg(mode === 'trip')}>Whole trip</div>
          </div>
          {m.scale && (
            <div style={{ font: mono(500, 10.5), letterSpacing: '.06em', color: C.muted, padding: '8px 10px', borderRadius: 999, background: 'rgba(251,248,242,.92)' }}>
              {m.scale}
            </div>
          )}
        </div>
        {mode === 'day' && (
          <div className="scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
            {trip.days.map((d, i) => {
              const sel = i === dayIdx;
              const dd = new Date(meta.start + 'T00:00');
              dd.setDate(dd.getDate() + d.num - 1);
              return (
                <div
                  key={d.num}
                  onClick={() => onPickDay(i)}
                  style={{
                    flex: 'none',
                    whiteSpace: 'nowrap',
                    padding: '7px 10px',
                    borderRadius: 999,
                    font: mono(500, 11),
                    cursor: 'pointer',
                    background: sel ? C.dark : 'rgba(251,248,242,.92)',
                    color: sel ? C.darkText : C.ink,
                    border: `1px solid ${rule(0.1)}`,
                  }}
                >
                  D{d.num} · {dd.getDate()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14 }}>
        <div style={{ padding: '0 18px 8px', font: serif(22, 1.1), textShadow: `0 0 8px ${C.sand}` }}>{m.title}</div>
        <div className="scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 2px' }}>
          {m.cards.map((c, i) => (
            <div
              key={i}
              onClick={c.onClick}
              style={{
                flex: 'none',
                width: 210,
                padding: '12px 14px',
                borderRadius: 16,
                background: C.card,
                border: `1px solid ${rule(0.1)}`,
                boxShadow: '0 6px 18px rgba(31,27,22,.08)',
                cursor: 'pointer',
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: c.fill,
                  color: C.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: mono(500, 11),
                }}
              >
                {c.n}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: mono(400, 11.5), color: C.muted }}>{c.time}</div>
                <div style={{ marginTop: 5, font: serif(16, 1.15) }}>{c.title}</div>
                <div style={{ marginTop: 3, font: sans(400, 11.5, 1.3), color: C.muted }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
