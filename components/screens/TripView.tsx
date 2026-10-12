import { Bed, Check, Plane, Plus, type LucideIcon } from 'lucide-react';
import { BackButton } from '../BackButton';
import { rangeLong, plural } from '@/lib/format';
import { cityCount, dayBits, isStop, nightCount, routeRows } from '@/lib/derive';
import { C, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';
import type { Settings, Trip, TripMeta } from '@/lib/types';

export function TripView({
  meta,
  trip,
  todayIdx,
  settings,
  onHome,
  onEdit,
  onDay,
  onJourneys,
  onStays,
  onAddJourneys,
  onAddStays,
}: {
  meta: TripMeta;
  trip: Trip;
  todayIdx: number;
  settings: Settings;
  onHome: () => void;
  onEdit: () => void;
  onDay: (i: number) => void;
  /** Open the list of journeys / stays (when there are some). */
  onJourneys: () => void;
  onStays: () => void;
  /** Open the editor with flight / stay hints (when there are none yet). */
  onAddJourneys: () => void;
  onAddStays: () => void;
}) {
  const accent = settings.accent;
  const rows = routeRows(meta, trip);
  const stayCount = Object.keys(trip.stays).length;
  const first = trip.journeys[0];
  const journeyDetail = first
    ? `${first.from} → ${first.to}${trip.journeys.length > 1 ? ` · +${trip.journeys.length - 1} more` : ''}`
    : '';
  return (
    <div className="scroll" style={{ position: 'absolute', inset: '0 0 var(--tabbar) 0', overflowY: 'auto', padding: 'var(--top) 0 24px' }}>
     <div className="col">
      <div style={{ padding: '6px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton label="Trips" onClick={onHome} />
        <div
          onClick={onEdit}
          role="button"
          tabIndex={0}
          style={{ font: sans(500, 12.5), height: 44, display: 'inline-flex', alignItems: 'center', padding: '0 18px', borderRadius: R.pill, background: C.dark, color: C.darkText, boxShadow: CLAY.accent, cursor: 'pointer' }}
        >
          Edit trip
        </div>
      </div>
      <h1 style={{ margin: '14px 22px 0', font: serif(40, 1), letterSpacing: '-.015em' }}>{meta.name}</h1>
      <div style={{ margin: '8px 22px 0', font: sans(400, 13.5, 1.4), color: C.muted }}>
        {rangeLong(meta.start, meta.end)} · {plural(trip.days.length, 'day')} · {plural(cityCount(trip), 'city', 'cities')} · {plural(Object.keys(trip.stays).length, 'stay')}
      </div>
      <div style={{ margin: '20px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <StatusTile
          icon={Plane}
          title="Flights & journeys"
          filled={trip.journeys.length > 0}
          detail={journeyDetail}
          emptyText="Not added yet"
          onOpen={trip.journeys.length > 0 ? onJourneys : onAddJourneys}
        />
        <StatusTile
          icon={Bed}
          title="Stays"
          filled={stayCount > 0}
          detail={`${plural(stayCount, 'stay')} · ${plural(nightCount(trip), 'night')}`}
          emptyText="Not added yet"
          onOpen={stayCount > 0 ? onStays : onAddStays}
        />
      </div>
      {rows.length > 0 && (
        <div style={{ margin: '14px 16px 0', padding: '16px 18px', borderRadius: R.card, boxShadow: CLAY.soft, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                borderRadius: R.card,
                background: C.card,
                boxShadow: CLAY.soft,
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
                    <span style={{ font: mono(500, 10), letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 6px', borderRadius: R.pill, background: C.draftBg, color: C.draftFg }}>
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
    </div>
  );
}

/**
 * A checklist tile for something the trip needs. Filled in (raised clay, tinted with the secondary colour, a check
 * badge) once there is data; an outline with a dashed border while it is still empty, which invites adding it.
 */
function StatusTile({
  icon: Icon,
  title,
  filled,
  detail,
  emptyText,
  onOpen,
}: {
  icon: LucideIcon;
  title: string;
  filled: boolean;
  detail: string;
  emptyText: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={filled ? 'status-tile' : 'status-tile empty'}
      aria-label={filled ? `${title}: ${detail}. Open` : `${title}: ${emptyText}. Add`}
      style={{
        boxSizing: 'border-box',
        minHeight: 128,
        padding: '16px 14px 14px',
        borderRadius: R.card,
        border: filled ? '2px solid transparent' : '2px dashed rgba(120, 84, 52, .4)',
        background: filled ? 'color-mix(in srgb, var(--accent2) 30%, #FCF7EE)' : 'transparent',
        boxShadow: filled ? CLAY.raised : 'none',
        color: C.ink,
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 14,
        font: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: filled ? 'var(--accent)' : 'transparent',
            border: filled ? '0' : '2px dashed rgba(120, 84, 52, .4)',
            boxSizing: 'border-box',
            boxShadow: filled ? CLAY.accent : 'none',
          }}
        >
          <Icon size={21} strokeWidth={1.9} color={filled ? '#fff' : C.muted} />
        </span>
        {filled ? (
          <span
            aria-hidden
            style={{ width: 26, height: 26, borderRadius: 13, background: C.card, boxShadow: CLAY.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Check size={15} strokeWidth={3} color="var(--accent)" />
          </span>
        ) : (
          <span
            aria-hidden
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 26, padding: '0 10px 0 7px', borderRadius: 13, border: '2px dashed rgba(120, 84, 52, .4)', boxSizing: 'border-box', font: sans(700, 11.5), color: C.muted }}
          >
            <Plus size={13} strokeWidth={2.6} />
            Add
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: sans(700, 15, 1.2) }}>{title}</div>
        <div style={{ marginTop: 4, font: sans(filled ? 500 : 400, 12.5, 1.35), color: filled ? C.ink2 : C.muted, overflowWrap: 'anywhere' }}>{filled ? detail : emptyText}</div>
      </div>
    </button>
  );
}
