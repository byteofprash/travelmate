import { MON, MONTHS, parseISO, rangeShort, plural } from '@/lib/format';
import { C, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';
import { seasonKicker } from '@/lib/derive';
import type { Trip, TripMeta } from '@/lib/types';

export function Home({
  index,
  trips,
  todayISO,
  accent,
  onOpen,
  onSettings,
}: {
  index: TripMeta[];
  trips: Record<string, Trip>;
  todayISO: string;
  accent: string;
  onOpen: (id: string) => void;
  onSettings: () => void;
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
      <div style={{ padding: '6px 22px 0', font: mono(500, 11), letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted }}>{seasonKicker(index)}</div>
      <h1 style={{ margin: '14px 22px 0', font: serif(44, 1), letterSpacing: '-.02em' }}>Trips</h1>
      <div style={{ margin: '8px 22px 0', font: sans(400, 13.5, 1.4), color: C.muted }}>
        {upcoming.length} upcoming · {nights} nights away
      </div>
      <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column' }}>
        {groups.map((g) => (
          <div key={g.name}>
            <div style={{ margin: '22px 6px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ font: serif(18, 1, true), color: C.ink2 }}>{g.name}</div>
              <div style={{ flex: 1, height: 1, background: rule(0.12) }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      <div style={{ font: serif(30, 1) }}>{d.getDate()}</div>
                      <div style={{ font: mono(500, 10), letterSpacing: '.08em', color: muted }}>{MON[d.getMonth()].toUpperCase()}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ font: mono(500, 10, 1.3), letterSpacing: '.08em', textTransform: 'uppercase', color: muted, whiteSpace: 'nowrap' }}>
                          {rangeShort(t.start, t.end)} · {plural(t.nights, 'night')}
                        </div>
                        {t.id === nextId && (
                          <div style={{ font: mono(500, 9.5), letterSpacing: '.08em', padding: '4px 7px', borderRadius: R.pill, background: dark ? C.card : C.accent2, color: dark ? accent : C.ink, fontWeight: 700 }}>NEXT</div>
                        )}
                      </div>
                      <div style={{ marginTop: 6, font: serif(25, 1.05), letterSpacing: '-.01em' }}>{t.name}</div>
                      <div style={{ marginTop: 5, font: sans(400, 12.5, 1.4), color: muted }}>{t.summary}</div>
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: `1px solid ${dark ? C.onDarkRule : rule(0.08)}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div style={{ font: sans(400, 12.5, 1.3) }}>{status}</div>
                        <div style={{ font: serif(18, 1), color: muted }}>→</div>
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
          style={{ font: mono(500, 11), letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, cursor: 'pointer', padding: 8 }}
        >
          Settings
        </div>
      </div>
     </div>
    </div>
  );
}
