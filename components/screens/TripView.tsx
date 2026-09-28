import { rangeLong, plural } from '@/lib/format';
import { cityCount, dayBits, isStop, routeRows } from '@/lib/derive';
import { C, mono, rule, sans, serif } from '@/lib/theme';
import type { Settings, Trip, TripMeta } from '@/lib/types';

export function TripView({
  meta,
  trip,
  todayIdx,
  settings,
  onHome,
  onEdit,
  onDay,
}: {
  meta: TripMeta;
  trip: Trip;
  todayIdx: number;
  settings: Settings;
  onHome: () => void;
  onEdit: () => void;
  onDay: (i: number) => void;
}) {
  const accent = settings.accent;
  const rows = routeRows(meta, trip);
  return (
    <div className="scroll" style={{ position: 'absolute', inset: '0 0 84px 0', overflowY: 'auto', padding: '58px 0 24px' }}>
      <div style={{ padding: '6px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={onHome} role="button" tabIndex={0} style={{ font: mono(500, 11), letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
          ‹ All trips
        </div>
        <div
          onClick={onEdit}
          role="button"
          tabIndex={0}
          style={{ font: sans(500, 12.5), padding: '9px 12px', borderRadius: 999, background: C.dark, color: C.darkText, cursor: 'pointer' }}
        >
          Edit trip
        </div>
      </div>
      <h1 style={{ margin: '14px 22px 0', font: serif(40, 1), letterSpacing: '-.015em' }}>{meta.name}</h1>
      <div style={{ margin: '8px 22px 0', font: sans(400, 13.5, 1.4), color: C.muted }}>
        {rangeLong(meta.start, meta.end)} · {plural(trip.days.length, 'day')} · {plural(cityCount(trip), 'city', 'cities')} · {plural(Object.keys(trip.stays).length, 'stay')}
      </div>
      {rows.length > 0 && (
        <div style={{ margin: '20px 16px 0', padding: '16px 18px', borderRadius: 18, border: `1px solid ${rule(0.12)}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, font: serif(19, 1.1) }}>{r.city}</div>
                <div style={{ font: mono(400, 11.5), color: C.muted }}>{r.nights}</div>
              </div>
              {r.leg && (
                <div style={{ paddingLeft: 2, font: mono(500, 10.5), letterSpacing: '.07em', textTransform: 'uppercase', color: accent }}>↓ {r.leg}</div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trip.days.map((d, i) => {
          const b = dayBits(meta, d);
          const sights = d.items.filter((x) => isStop(x) && x.tag === 'Visit').map((x) => (x as { title: string }).title);
          return (
            <div
              key={d.num}
              onClick={() => onDay(i)}
              role="button"
              tabIndex={0}
              className="hov-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '52px minmax(0,1fr)',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 16,
                background: C.card,
                border: `1px solid ${rule(0.09)}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
                <div style={{ font: mono(500, 10), letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted }}>{b.wd}</div>
                <div style={{ font: serif(28, 1) }}>{b.d}</div>
                {i === todayIdx && <div style={{ font: mono(500, 9.5), letterSpacing: '.06em', color: accent }}>TODAY</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ font: mono(500, 10, 1.3), letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap' }}>
                    Day {d.num} · {d.mode}
                  </span>
                  {d.draft && (
                    <span style={{ font: mono(500, 10), letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 6px', borderRadius: 5, background: C.draftBg, color: C.draftFg }}>
                      Draft
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 6, font: serif(20, 1.15) }}>{d.title}</div>
                <div style={{ marginTop: 5, font: sans(400, 12.5, 1.4), color: C.muted, textWrap: 'pretty' }}>{sights.length ? sights.join(' · ') : d.summary}</div>
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${rule(0.08)}`, font: sans(400, 12, 1.3), color: C.ink2 }}>
                  {d.stay && trip.stays[d.stay] ? 'Tonight: ' + trip.stays[d.stay].name : 'No stay: flying home'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
