import { BackButton } from '../BackButton';
import { PixelIcon, type IconName } from '../PixelIcon';
import { rangeLong, plural } from '@/lib/format';
import { cityCount, dayBits, flightStatus, isStop, nightCount, routeRows } from '@/lib/derive';
import { C, INK, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';
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
          style={{ font: mono(700, 14), textTransform: 'uppercase', height: 48, margin: 4, display: 'inline-flex', alignItems: 'center', padding: '0 16px', borderRadius: R.pill, background: C.dark, color: C.darkText, boxShadow: CLAY.accent, cursor: 'pointer' }}
        >
          Edit trip
        </div>
      </div>
      <h1 style={{ margin: '18px 22px 0', font: serif(40, 1) }}>{meta.name}</h1>
      <div style={{ margin: '10px 22px 0', font: sans(400, 13.5, 1.1), color: C.lightMuted }}>
        {rangeLong(meta.start, meta.end)} · {plural(trip.days.length, 'day')} · {plural(cityCount(trip), 'city', 'cities')} · {plural(Object.keys(trip.stays).length, 'stay')}
      </div>
      <div style={{ margin: '28px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
        <StatusTile
          icon="plane"
          title="Flights"
          state={fs.state === 'none' ? 'empty' : fs.state}
          detail={fs.state === 'complete' ? `${plural(fs.total, 'flight')} · all details` : `${fs.complete} of ${plural(fs.total, 'flight')} complete`}
          note={fs.state === 'partial' ? `Needs ${fs.missing.join(', ')}` : undefined}
          emptyText="Not added yet"
          onOpen={fs.state === 'complete' ? onJourneys : fs.state === 'partial' ? onFinishFlights : onAddJourneys}
        />
        <StatusTile
          icon="bed"
          title="Stays"
          state={stayCount > 0 ? 'complete' : 'empty'}
          detail={`${plural(stayCount, 'stay')} · ${plural(nightCount(trip), 'night')}`}
          emptyText="Not added yet"
          onOpen={stayCount > 0 ? onStays : onAddStays}
        />
      </div>
      {rows.length > 0 && (
        <div style={{ margin: '28px 20px 0', padding: '16px 18px', borderRadius: R.card, background: C.card, color: C.ink, boxShadow: CLAY.soft, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, font: serif(19, 1.1) }}>{r.city}</div>
                <div style={{ font: sans(400, 12.5), color: C.muted }}>{r.nights}</div>
              </div>
              {r.leg && (
                <div style={{ paddingLeft: 2, font: mono(500, 10.5), textTransform: 'uppercase', color: C.nile }}>↓ {r.leg}</div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                color: C.ink,
                boxShadow: CLAY.soft,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
                <div style={{ font: mono(500, 10), textTransform: 'uppercase', color: C.muted }}>{b.wd}</div>
                <div style={{ font: sans(400, 27, 1) }}>{b.d}</div>
                {i === todayIdx && <div style={{ font: mono(500, 9.5), padding: '5px 6px 3px', margin: 2, background: C.accent2, color: INK, boxShadow: `0 -2px 0 ${INK}, 0 2px 0 ${INK}, -2px 0 0 ${INK}, 2px 0 0 ${INK}` }}>TODAY</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ font: mono(500, 10, 1.5), textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap' }}>
                    Day {d.num} · {d.mode}
                  </span>
                  {d.draft && (
                    <span style={{ font: mono(500, 10), textTransform: 'uppercase', padding: '5px 6px 3px', margin: 2, background: C.draftBg, color: C.draftFg, boxShadow: `0 -2px 0 ${INK}, 0 2px 0 ${INK}, -2px 0 0 ${INK}, 2px 0 0 ${INK}` }}>
                      Draft
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8, font: serif(20, 1.4) }}>{d.title}</div>
                <div style={{ marginTop: 6, font: sans(400, 12.5, 1.1), color: C.muted, textWrap: 'pretty' }}>{sights.length ? sights.join(' · ') : d.summary}</div>
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: `4px dotted ${rule(0.2)}`, font: sans(400, 12, 1.1), color: C.ink2 }}>
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

/**
 * A checklist tile for something the trip needs. Complete: a solid, raised panel in the primary colour with a check
 * badge. Empty: a dashed outline that invites adding it. Partial: the dashed outline in the secondary colour with what
 * is done and what is still missing, so it never looks finished before it is.
 */
function StatusTile({
  icon,
  title,
  state,
  detail,
  note,
  emptyText,
  onOpen,
}: {
  icon: IconName;
  title: string;
  state: TileState;
  detail: string;
  note?: string;
  emptyText: string;
  onOpen: () => void;
}) {
  const done = state === 'complete';
  const partial = state === 'partial';
  const line = partial ? C.accent2 : C.lightMuted;
  const text = done ? C.ink : C.light;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={done ? 'status-tile' : 'status-tile empty'}
      aria-label={done ? `${title}: ${detail}. Open` : partial ? `${title}: ${detail}${note ? `, ${note.toLowerCase()}` : ''}. Finish` : `${title}: ${emptyText}. Add`}
      style={{
        boxSizing: 'border-box',
        minHeight: 150,
        padding: '16px 14px 14px',
        borderRadius: R.card,
        border: done ? '4px solid transparent' : `4px dashed ${line}`,
        background: done ? C.dark : 'transparent',
        boxShadow: done ? CLAY.accent : 'none',
        color: text,
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
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: done ? C.accent2 : 'transparent',
            border: done ? '0' : `4px dashed ${line}`,
            boxSizing: 'border-box',
            boxShadow: done ? CLAY.accent : 'none',
          }}
        >
          <PixelIcon name={icon} size={28} />
        </span>
        {done ? (
          <span aria-hidden style={{ width: 32, height: 32, margin: 4, background: C.card, boxShadow: CLAY.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PixelIcon name="check" size={28} />
          </span>
        ) : (
          <span
            aria-hidden
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 8px', border: `4px dashed ${line}`, boxSizing: 'border-box', font: mono(700, 11), textTransform: 'uppercase', color: line }}
          >
            {partial ? 'Finish' : '+ Add'}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: mono(700, 15, 1.4), textTransform: 'uppercase' }}>{title}</div>
        <div style={{ marginTop: 8, font: sans(400, 12.5, 1.1), color: done ? C.ink : C.light, overflowWrap: 'anywhere' }}>{state === 'empty' ? emptyText : detail}</div>
        {note && <div style={{ marginTop: 4, font: sans(400, 11.5, 1.1), color: done ? C.ink2 : C.lightMuted, overflowWrap: 'anywhere' }}>{note}</div>}
      </div>
    </button>
  );
}
