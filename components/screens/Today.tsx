import { forwardRef } from 'react';
import { Bed, Plane } from 'lucide-react';
import { BackButton } from '../BackButton';
import { ActivityCard } from '../ActivityCard';
import { CommuteLeg } from '../CommuteLeg';
import { DaySummary } from '../DaySummary';
import { WD, addDays, fmtClock, toISO, toMin } from '@/lib/format';
import { dayBits, dayDate, daySummary, isStop } from '@/lib/derive';
import { C, F, TAGC, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';
import type { Day, Settings, Stop, Trip, TripMeta } from '@/lib/types';

const iconBtn: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 23,
  boxShadow: CLAY.soft,
  background: C.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

type Row =
  | { k: 'now'; time: string }
  | { k: 'leg'; i: number }
  | { k: 'stop'; i: number; time: string };

export const Today = forwardRef<HTMLDivElement, {
  meta: TripMeta;
  trip: Trip;
  day: Day;
  dayIdx: number;
  todayIdx: number;
  todayISO: string;
  nowMin: number;
  settings: Settings;
  onHome: () => void;
  onJourneys: () => void;
  onStays: () => void;
  onPickDay: (i: number) => void;
  onDaySheet: () => void;
  onStop: (s: Stop) => void;
}>(function Today(p, ref) {
  const { meta, trip, day, settings } = p;
  const accent = settings.accent;
  const bits = dayBits(meta, day);

  // Day strip: two days before the trip through its last day.
  const first = dayDate(meta, trip.days[0]);
  const last = dayDate(meta, trip.days[trip.days.length - 1]);
  const strip: { iso: string; wd: string; d: number; idx: number }[] = [];
  for (let dt = addDays(first, -2); dt <= last; dt = addDays(dt, 1)) {
    const iso = toISO(dt);
    strip.push({ iso, wd: WD[dt.getDay()], d: dt.getDate(), idx: trip.days.findIndex((x) => toISO(dayDate(meta, x)) === iso) });
  }

  // Timeline rows, with the now line on the day that is actually today.
  const rows: Row[] = [];
  day.items.forEach((it, i) => {
    if (isStop(it)) rows.push({ k: 'stop', i, time: it.time });
    else if (settings.showTransport) rows.push({ k: 'leg', i });
  });
  if (p.dayIdx === p.todayIdx) {
    const nm = p.nowMin;
    const timeOf = (r: Row) => (r.k === 'stop' ? r.time : r.k === 'leg' ? (day.items[r.i] as { time?: string }).time : undefined);
    let pos = 0;
    rows.forEach((r, i) => {
      const m = toMin(timeOf(r));
      if (m != null && m <= nm) pos = i + 1;
    });
    const f = rows.findIndex((r) => toMin(timeOf(r)) != null);
    if (f >= 0 && nm < (toMin(timeOf(rows[f])) as number)) pos = f;
    rows.splice(pos, 0, { k: 'now', time: fmtClock(nm) });
  }

  const sum = daySummary(day);
  const cards = settings.cardStyle === 'cards';

  return (
    <div ref={ref} className="scroll" style={{ position: 'absolute', inset: '0 0 var(--tabbar) 0', overflowY: 'auto', padding: 'var(--top) 0 24px' }}>
     <div className="col">
      <div style={{ padding: '2px 16px 0 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <BackButton label="Trips" onClick={p.onHome} />
          <div style={{ font: mono(500, 11), letterSpacing: '.08em', color: C.muted }}>
            {meta.name} · DAY {day.num} OF {trip.days.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={p.onJourneys} title="Journeys" aria-label="Journeys" role="button" tabIndex={0} className="hov-card" style={iconBtn}>
            <Plane size={19} strokeWidth={1.6} color={C.ink} />
          </div>
          <div onClick={p.onStays} title="Stays" aria-label="Stays" role="button" tabIndex={0} className="hov-card" style={iconBtn}>
            <Bed size={20} strokeWidth={1.6} color={C.ink} />
          </div>
        </div>
      </div>

      <div className="scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '16px 22px 22px' }}>
        {strip.map((s) => {
          const sel = s.idx === p.dayIdx;
          const inT = s.idx >= 0;
          return (
            <div
              key={s.iso}
              onClick={() => inT && p.onPickDay(s.idx)}
              style={{
                flex: 'none',
                width: 48,
                padding: '10px 0 11px',
                borderRadius: 24,
                boxShadow: sel ? CLAY.accent : inT ? CLAY.soft : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: inT ? 'pointer' : 'default',
                background: sel ? C.dark : inT ? C.card : 'transparent',
                color: sel ? C.darkText : C.ink,
                opacity: inT ? 1 : 0.35,
              }}
            >
              <div style={{ font: mono(500, 10), letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.wd}</div>
              <div style={{ font: `500 19px/1 ${F.serif}` }}>{s.d}</div>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: s.iso === p.todayISO ? (sel ? C.darkText : accent) : 'transparent' }} />
            </div>
          );
        })}
      </div>

      <div style={{ padding: '6px 22px 0' }}>
        <div style={{ font: sans(500, 12), color: accent, letterSpacing: '.02em' }}>
          {p.dayIdx === p.todayIdx ? 'Today · ' : ''}
          {bits.wd} {bits.d} {bits.month}
        </div>
        <h1 style={{ margin: '8px 0 0', font: serif(38, 1.02), letterSpacing: '-.015em', textWrap: 'balance' }}>{day.title}</h1>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              font: mono(500, 10.5),
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '5px 12px',
              borderRadius: R.pill,
              background: C.sand,
              boxShadow: CLAY.inset,
              color: C.ink2,
            }}
          >
            {day.mode}
          </span>
          <span style={{ font: sans(400, 13, 1.3), color: C.muted }}>{day.summary}</span>
        </div>
      </div>

      <div style={{ margin: '20px 16px 0' }}>
        <DaySummary theme={sum.theme} blurb={sum.blurb} stats={sum.stats} onOpen={p.onDaySheet} />
      </div>

      <div style={{ padding: '26px 16px 8px 0' }}>
        {rows.map((r) => {
          if (r.k === 'now')
            return (
              <div key="now" style={{ display: 'grid', gridTemplateColumns: '62px 18px minmax(0,1fr)', alignItems: 'center', height: 22, margin: '2px 0' }}>
                <div style={{ font: mono(600, 11.5), color: C.accent, textAlign: 'right' }}>{r.time}</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 11, height: 11, borderRadius: R.ctl, background: C.now, boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent2) 45%, transparent)' }} />
                </div>
                <div style={{ height: 3, background: C.now, borderRadius: 2, marginLeft: -4 }} />
              </div>
            );
          const it = day.items[r.i];
          if (!isStop(it)) return <CommuteLeg key={'l' + r.i} mode={it.mode} duration={it.dur} time={it.time} detail={it.text} />;
          const tag = it.tag || '';
          const tc = TAGC[tag] || C.muted;
          return (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '62px 18px minmax(0,1fr)', alignItems: 'start' }}>
              <div style={{ font: mono(500, 13), textAlign: 'right', paddingTop: cards ? 22 : 6 }}>{it.time}</div>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: cards ? 21 : 5 }}>
                <div style={{ width: 13, height: 13, borderRadius: 7, border: `3px solid ${tc}`, background: C.card, boxShadow: CLAY.soft }} />
              </div>
              <div style={{ margin: cards ? '4px 0 4px 8px' : '0 0 0 8px' }}>
                <ActivityCard
                  variant={settings.cardStyle}
                  tag={tag}
                  title={it.title}
                  subtitle={it.sub}
                  duration={it.dur || ''}
                  note={it.note}
                  onOpen={() => p.onStop(it)}
                />
              </div>
            </div>
          );
        })}
      </div>
     </div>
    </div>
  );
});
