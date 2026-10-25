import { C, INK, TAGBG, TAGC, mono, sans, serif, CLAY, R } from '@/lib/theme';

export function ActivityCard({
  variant = 'cards',
  tag,
  tagColor,
  title,
  subtitle,
  duration,
  note,
  onOpen,
}: {
  variant?: 'cards' | 'ledger';
  tag: string;
  tagColor?: string;
  title: string;
  subtitle: string;
  duration?: string;
  note?: string;
  onOpen?: () => void;
}) {
  const color = tagColor ?? TAGBG[tag] ?? C.lightMuted; // the ledger style sits straight on the night sky, so the tag colour is the bright fill
  if (variant === 'ledger') {
    return (
      <div onClick={onOpen} role="button" tabIndex={0} style={{ padding: '0 6px 16px 0', borderBottom: '4px dotted rgba(244,244,244,.3)', cursor: 'pointer', color: C.light }}>
        <div style={{ font: serif(24, 1.1), textWrap: 'pretty' }}>{title}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 10, font: sans(400, 12.5, 1.3), color: C.lightMuted, flexWrap: 'wrap' }}>
          <span style={{ color }}>{tag}</span>
          <span>{subtitle}</span>
          <span>{duration}</span>
        </div>
        {note ? <div style={{ marginTop: 6, font: serif(14, 1.4, true), color: C.light }}>{note}</div> : null}
      </div>
    );
  }
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="hov-card"
      style={{
        padding: '16px 16px 16px',
        margin: 4,
        borderRadius: R.card,
        background: C.card,
        boxShadow: CLAY.raised,
        cursor: 'pointer',
        color: C.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ font: mono(700, 10.5), textTransform: 'uppercase', color: TAGC[tag] ?? INK, background: TAGBG[tag] ?? C.sand, padding: '6px 8px 4px', margin: 2, borderRadius: R.pill, boxShadow: `0 -2px 0 ${INK}, 0 2px 0 ${INK}, -2px 0 0 ${INK}, 2px 0 0 ${INK}` }}>{tag}</div>
        <div style={{ font: sans(400, 12.5), color: C.muted }}>{duration}</div>
      </div>
      <div style={{ marginTop: 10, font: serif(20, 1.4), textWrap: 'pretty' }}>{title}</div>
      <div style={{ marginTop: 4, font: sans(400, 12.5, 1.35), color: C.muted }}>{subtitle}</div>
      {note ? (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '4px dotted rgba(26,28,44,.2)', font: sans(400, 12.5, 1.1), color: C.ink2 }}>{note}</div>
      ) : null}
    </div>
  );
}
