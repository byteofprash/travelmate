import { C, mono, sans, serif, CLAY, R } from '@/lib/theme';

export interface Stat { k: string; v: string }

export function DaySummary({
  kicker = 'Theme of the day',
  theme,
  blurb,
  stats,
  onOpen,
}: {
  kicker?: string;
  theme: string;
  blurb: string;
  stats: Stat[];
  onOpen?: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      style={{ padding: '20px 20px 18px', margin: 4, borderRadius: R.card, background: C.dark, color: C.darkText, cursor: 'pointer', boxShadow: CLAY.accent }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <div style={{ font: mono(500, 10.5), color: C.darkMuted, textTransform: 'uppercase' }}>{kicker}</div>
        <div style={{ font: mono(500, 13), color: C.darkMuted }}>▸</div>
      </div>
      <div style={{ marginTop: 12, font: serif(27, 1.4, true), textWrap: 'balance' }}>{theme}</div>
      <div style={{ marginTop: 8, font: sans(400, 13, 1.1), color: C.darkBody, textWrap: 'pretty' }}>{blurb}</div>
      {stats.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `4px dotted ${C.onDarkRule}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: 10,
          }}
        >
          {stats.map((s) => (
            <div key={s.k} style={{ minWidth: 0 }}>
              <div style={{ font: mono(500, 9.5), color: C.darkLabel, textTransform: 'uppercase' }}>{s.k}</div>
              <div style={{ marginTop: 6, font: sans(400, 14, 1.1), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
