import { PixelIcon } from '../PixelIcon';
import { MON, MONTHS, parseISO, rangeShort, plural } from '@/lib/format';
import { C, INK, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';
import { seasonKicker } from '@/lib/derive';
import type { Trip, TripMeta } from '@/lib/types';

export function Home({
  index,
  trips,
  todayISO,
  accent,
  onOpen,
  onSettings,
  inboxCount = 0,
  onInbox,
  onNew,
}: {
  index: TripMeta[];
  trips: Record<string, Trip>;
  todayISO: string;
  accent: string;
  onOpen: (id: string) => void;
  onSettings: () => void;
  inboxCount?: number;
  onInbox?: () => void;
  onNew?: () => void;
}) {
  const sorted = [...index].sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = sorted.filter((t) => t.end >= todayISO);
  const nextId = upcoming[0]?.id;
  const nights = upcoming.reduce((a, t) => a + t.nights, 0);
  const groups: { name: string; trips: TripMeta[] }[] = [];
  for (const t of sorted) {
    const d = parseISO(t.start);
    const name = MONTHS[d.getMonth()];
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, trips: [] }));
    g.trips.push(t);
  }
  return (
    <div className="scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 'var(--top) 0 40px' }}>
     <div className="col">
      <div style={{ padding: '6px 22px 0', font: mono(500, 11), textTransform: 'uppercase', color: C.lightMuted }}>{seasonKicker(index)}</div>
      <div style={{ margin: '14px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0, font: serif(44, 1) }}>Trips</h1>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, margin: 4, padding: '0 16px 0 10px', border: 0, borderRadius: R.pill, background: C.dark, color: C.darkText, boxShadow: CLAY.accent, font: mono(700, 14), textTransform: 'uppercase', cursor: 'pointer' }}
          >
            <PixelIcon name="plus" size={28} />
            New trip
          </button>
        )}
      </div>
      <div style={{ margin: '8px 22px 0', font: sans(400, 13.5, 1.1), color: C.lightMuted }}>
        {upcoming.length} upcoming · {nights} nights away
      </div>
      {inboxCount > 0 && onInbox && (
        <button
          type="button"
          onClick={onInbox}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: 'calc(100% - 40px)', margin: '20px 20px 0', padding: '14px 18px', border: 0, borderRadius: R.card, background: C.accent2, color: C.ink, boxShadow: CLAY.raised, font: sans(700, 14), textAlign: 'left', cursor: 'pointer' }}
        >
          <span style={{ font: mono(700, 12), textTransform: 'uppercase' }}>{inboxCount === 1 ? '1 email waiting' : `${inboxCount} emails waiting`}</span>
          <span style={{ font: mono(700, 11), textTransform: 'uppercase' }}>Review ▸</span>
        </button>
      )}
      {sorted.length === 0 && (
        <div style={{ margin: '28px 20px 0', padding: '28px 22px', borderRadius: R.card, background: C.card, boxShadow: CLAY.soft, textAlign: 'center', font: sans(400, 14, 1.2), color: C.ink2 }}>
          No trips yet. Press <b>New trip</b> and paste a booking or an itinerary to start one.
        </div>
      )}
      <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column' }}>
        {groups.map((g) => (
          <div key={g.name}>
            <div style={{ margin: '24px 6px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ font: mono(500, 12), textTransform: 'uppercase', color: C.lightAccent }}>▸ {g.name}</div>
              <div style={{ flex: 1, borderTop: '4px dotted rgba(244,244,244,.25)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {g.trips.map((t) => {
                const trip = trips[t.id];
                const ready = !!trip && trip.days.length > 0;
                const dark = ready;
                const muted = dark ? C.darkMuted : C.muted;
                const d = parseISO(t.start);
                const status = ready
                  ? `${plural(trip.days.length, 'day')} planned · ${plural(Object.keys(trip.stays).length, 'stay')} · ${plural(trip.journeys.length, 'journey')}`
                  : 'No plans yet · Add bookings or notes';
                return (
                  <div
                    key={t.id}
                    onClick={() => onOpen(t.id)}
                    role="button"
                    tabIndex={0}
                    className="lift"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '54px minmax(0,1fr)',
                      gap: 14,
                      padding: 16,
                      borderRadius: R.card,
                      background: dark ? C.dark : C.card,
                      color: dark ? C.darkText : C.ink,
                      boxShadow: dark ? CLAY.accent : CLAY.raised,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
                      <div style={{ font: sans(400, 27, 1) }}>{d.getDate()}</div>
                      <div style={{ font: mono(500, 10), color: muted }}>{MON[d.getMonth()].toUpperCase()}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ font: mono(500, 10, 1.5), textTransform: 'uppercase', color: muted, whiteSpace: 'nowrap' }}>
                          {rangeShort(t.start, t.end)} · {plural(t.nights, 'night')}
                        </div>
                        {t.id === nextId && (
                          <div style={{ font: mono(500, 9.5), padding: '6px 8px 4px', margin: 2, borderRadius: R.pill, background: C.accent2, color: INK, boxShadow: `0 -2px 0 ${INK}, 0 2px 0 ${INK}, -2px 0 0 ${INK}, 2px 0 0 ${INK}` }}>NEXT</div>
                        )}
                      </div>
                      <div style={{ marginTop: 10, font: serif(25, 1.4) }}>{t.name}</div>
                      <div style={{ marginTop: 6, font: sans(400, 12.5, 1.1), color: muted }}>{t.summary}</div>
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: `4px dotted ${dark ? C.onDarkRule : rule(0.2)}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div style={{ font: sans(400, 12.5, 1.1) }}>{status}</div>
                        <div style={{ font: mono(500, 13), color: muted }}>▸</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
        <div
          onClick={onSettings}
          role="button"
          tabIndex={0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: mono(500, 11), textTransform: 'uppercase', color: C.light, cursor: 'pointer', padding: 8 }}
        >
          <PixelIcon name="gear" size={28} />
          Settings
        </div>
      </div>
     </div>
    </div>
  );
}
