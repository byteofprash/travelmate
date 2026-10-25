import { forwardRef, useLayoutEffect, useRef } from 'react';
import { PixelIcon } from '../PixelIcon';
import { BackButton } from '../BackButton';
import { ActivityCard } from '../ActivityCard';
import { CommuteLeg } from '../CommuteLeg';
import { DaySummary } from '../DaySummary';
import { useSwipe } from '@/lib/useSwipe';
import { WD, addDays, fmtClock, toISO, toMin } from '@/lib/format';
import { dayBits, dayDate, daySummary, isStop } from '@/lib/derive';
import { C, INK, TAGBG, mono, sans, serif, CLAY, R } from '@/lib/theme';
import type { Day, Settings, Stop, Trip, TripMeta } from '@/lib/types';

const iconBtn: React.CSSProperties = {
  width: 52,
  height: 52,
  margin: 4,
  borderRadius: R.pill,
  background: C.accent2,
  boxShadow: CLAY.accent,
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

  // Swipe left for the next day, right for the previous one. No animation: the day just changes.
  const go = (to: number) => {
    if (to >= 0 && to < trip.days.length && to !== p.dayIdx) p.onPickDay(to);
  };
  const swipe = useSwipe({ onNext: () => go(p.dayIdx + 1), onPrev: () => go(p.dayIdx - 1) });

  // Keep the selected date centred in the day strip (an instant jump, scrolling only the strip itself).
  const stripRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector('[data-sel="1"]') as HTMLElement | null;
    if (strip && el) strip.scrollLeft = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
  }, [p.dayIdx]);

  const sum = daySummary(day);
  const cards = settings.cardStyle === 'cards';

  return (
    <div ref={ref} className="scroll" {...swipe} style={{ position: 'absolute', inset: '0 0 var(--tabbar) 0', overflowY: 'auto', padding: 'var(--top) 0 24px', touchAction: 'pan-y' }}>
     <div className="col">
      <div style={{ padding: '2px 16px 0 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <BackButton label="Trips" onClick={p.onHome} />
          <div style={{ font: mono(500, 11), color: C.lightMuted, paddingLeft: 6 }}>
            {meta.name} · DAY {day.num} OF {trip.days.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={p.onJourneys} title="Journeys" aria-label="Journeys" role="button" tabIndex={0} className="hov-card" style={iconBtn}>
            <PixelIcon name="plane" size={28} />
          </div>
          <div onClick={p.onStays} title="Stays" aria-label="Stays" role="button" tabIndex={0} className="hov-card" style={iconBtn}>
            <PixelIcon name="bed" size={28} />
          </div>
        </div>
      </div>

      <div ref={stripRef} data-noswipe className="scroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '20px 24px 30px', touchAction: 'pan-x pan-y' }}>
        {strip.map((s) => {
          const sel = s.idx === p.dayIdx;
          const inT = s.idx >= 0;
          return (
            <div
              key={s.iso}
              data-sel={sel ? '1' : undefined}
              onClick={() => inT && go(s.idx)}
              style={{
                flex: 'none',
                width: 52,
                padding: '10px 0 10px',
                borderRadius: R.pill,
                boxShadow: sel ? CLAY.accent : CLAY.soft,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: inT ? 'pointer' : 'default',
                background: sel ? C.dark : inT ? C.card : C.lightMuted,
                color: sel ? C.darkText : C.ink,
                opacity: inT ? 1 : 0.55,
              }}
            >
              <div style={{ font: mono(500, 10), textTransform: 'uppercase' }}>{s.wd}</div>
              <div style={{ font: sans(400, 21, 1) }}>{s.d}</div>
              <div style={{ width: 8, height: 8, background: s.iso === p.todayISO ? (sel ? C.darkText : accent) : 'transparent' }} />
            </div>
          );
        })}
      </div>

      <div style={{ padding: '6px 22px 0' }}>
        <div style={{ font: mono(500, 12), textTransform: 'uppercase', color: C.lightAccent }}>
          {p.dayIdx === p.todayIdx ? 'Today · ' : ''}
          {bits.wd} {bits.d} {bits.month}
        </div>
        <h1 style={{ margin: '14px 0 0', font: serif(38, 1.4), textWrap: 'balance' }}>{day.title}</h1>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              font: mono(500, 10.5),
              textTransform: 'uppercase',
              padding: '8px 12px 6px',
              margin: 4,
              borderRadius: R.pill,
              background: C.sand,
              boxShadow: CLAY.inset,
              color: C.ink2,
            }}
          >
            {day.mode}
          </span>
          <span style={{ font: sans(400, 13, 1.1), color: C.lightMuted }}>{day.summary}</span>
        </div>
      </div>

      <div style={{ margin: '24px 20px 0' }}>
        <DaySummary theme={sum.theme} blurb={sum.blurb} stats={sum.stats} onOpen={p.onDaySheet} />
      </div>

      <div style={{ padding: '30px 20px 8px 0' }}>
        {rows.map((r) => {
          if (r.k === 'now')
            return (
              <div key="now" style={{ display: 'grid', gridTemplateColumns: '72px 20px minmax(0,1fr)', alignItems: 'center', height: 28, margin: '4px 0' }}>
                <div style={{ font: mono(600, 14), color: C.now, textAlign: 'right', paddingRight: 8 }}>{r.time}</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, background: C.now, boxShadow: `0 -4px 0 0 ${INK}, 0 4px 0 0 ${INK}, -4px 0 0 0 ${INK}, 4px 0 0 0 ${INK}` }} />
                </div>
                <div style={{ height: 4, background: C.now, marginLeft: -2 }} />
              </div>
            );
          const it = day.items[r.i];
          if (!isStop(it)) return <CommuteLeg key={'l' + r.i} mode={it.mode} duration={it.dur} time={it.time} detail={it.text} />;
          const tag = it.tag || '';
          const tc = TAGBG[tag] || C.lightMuted;
          return (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '72px 20px minmax(0,1fr)', alignItems: 'start' }}>
              <div style={{ font: mono(500, 14), color: C.light, textAlign: 'right', paddingTop: cards ? 26 : 8, paddingRight: 8 }}>{it.time}</div>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: cards ? 26 : 8 }}>
                <div style={{ width: 16, height: 16, background: tc, boxShadow: `0 -4px 0 0 ${INK}, 0 4px 0 0 ${INK}, -4px 0 0 0 ${INK}, 4px 0 0 0 ${INK}` }} />
              </div>
              <div style={{ margin: cards ? '4px 0 14px 12px' : '0 0 0 12px' }}>
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
