import { Bed, Check, Plane, Plus, type LucideIcon } from 'lucide-react';
import { BackButton } from '../BackButton';
import { rangeLong, plural } from '@/lib/format';
import { cityCount, dayBits, flightStatus, isStop, nightCount, routeRows } from '@/lib/derive';
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
  onFinishFlights,
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
  /** Open the editor listing which flight details are still missing. */
  onFinishFlights: () => void;
}) {
  const accent = settings.accent;
  const rows = routeRows(meta, trip);
  const stayCount = Object.keys(trip.stays).length;
  const fs = flightStatus(trip);
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
          title="Flights"
          state={fs.state === 'none' ? 'empty' : fs.state}
          detail={fs.state === 'complete' ? `${plural(fs.total, 'flight')} · all details` : `${fs.complete} of ${plural(fs.total, 'flight')} complete`}
          note={fs.state === 'partial' ? `Needs ${fs.missing.join(', ')}` : undefined}
          emptyText="Not added yet"
          onOpen={fs.state === 'complete' ? onJourneys : fs.state === 'partial' ? onFinishFlights : onAddJourneys}
        />
        <StatusTile
          icon={Bed}
          title="Stays"
          state={stayCount > 0 ? 'complete' : 'empty'}
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

type TileState = 'empty' | 'partial' | 'complete';

const DASH = 'rgba(120, 84, 52, .4)';
const DASH_ACCENT = 'color-mix(in srgb, var(--accent) 65%, transparent)';

/**
 * A checklist tile for something the trip needs. Complete: raised clay tinted with the secondary colour and a check
 * badge. Empty: a dashed outline that invites adding it. Partial: the dashed outline in the primary colour with what is
 * done and what is still missing, so it never looks finished before it is.
 */
function StatusTile({
  icon: Icon,
  title,
  state,
  detail,
  note,
  emptyText,
  onOpen,
}: {
  icon: LucideIcon;
  title: string;
  state: TileState;
  detail: string;
  note?: string;
  emptyText: string;
  onOpen: () => void;
}) {
  const done = state === 'complete';
  const partial = state === 'partial';
  const line = partial ? DASH_ACCENT : DASH;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={done ? 'status-tile' : 'status-tile empty'}
      aria-label={done ? `${title}: ${detail}. Open` : partial ? `${title}: ${detail}${note ? `, ${note.toLowerCase()}` : ''}. Finish` : `${title}: ${emptyText}. Add`}
      style={{
        boxSizing: 'border-box',
        minHeight: 128,
        padding: '16px 14px 14px',
        borderRadius: R.card,
        border: done ? '2px solid transparent' : `2px dashed ${line}`,
        background: done ? 'color-mix(in srgb, var(--accent2) 30%, #FCF7EE)' : partial ? 'color-mix(in srgb, var(--accent2) 12%, transparent)' : 'transparent',
        boxShadow: done ? CLAY.raised : 'none',
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
            background: done ? 'var(--accent)' : 'transparent',
            border: done ? '0' : `2px dashed ${line}`,
            boxSizing: 'border-box',
            boxShadow: done ? CLAY.accent : 'none',
          }}
        >
          <Icon size={21} strokeWidth={1.9} color={done ? '#fff' : partial ? 'var(--accent)' : C.muted} />
        </span>
        {done ? (
          <span
            aria-hidden
            style={{ width: 26, height: 26, borderRadius: 13, background: C.card, boxShadow: CLAY.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Check size={15} strokeWidth={3} color="var(--accent)" />
          </span>
        ) : (
          <span
            aria-hidden
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 26, padding: partial ? '0 10px' : '0 10px 0 7px', borderRadius: 13, border: `2px dashed ${line}`, boxSizing: 'border-box', font: sans(700, 11.5), color: partial ? 'var(--accent)' : C.muted }}
          >
            {!partial && <Plus size={13} strokeWidth={2.6} />}
            {partial ? 'Finish' : 'Add'}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: sans(700, 15, 1.2) }}>{title}</div>
        <div style={{ marginTop: 4, font: sans(done || partial ? 500 : 400, 12.5, 1.35), color: done || partial ? C.ink2 : C.muted, overflowWrap: 'anywhere' }}>{state === 'empty' ? emptyText : detail}</div>
        {note && <div style={{ marginTop: 3, font: sans(500, 11.5, 1.35), color: C.muted, overflowWrap: 'anywhere' }}>{note}</div>}
      </div>
    </button>
  );
}
