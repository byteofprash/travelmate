import { C, TAGBG, TAGC, mono, sans, serif, CLAY, R } from '@/lib/theme';

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
  const color = tagColor ?? TAGC[tag] ?? C.muted;
  if (variant === 'ledger') {
    return (
      <div onClick={onOpen} role="button" tabIndex={0} style={{ padding: '0 6px 16px 0', borderBottom: '2px dotted rgba(120,84,52,.2)', cursor: 'pointer', color: C.ink }}>
        <div style={{ font: serif(24, 1.1), textWrap: 'pretty' }}>{title}</div>
        <div style={{ marginTop: 6, display: 'flex', gap: 10, font: sans(400, 12.5, 1.3), color: C.muted, flexWrap: 'wrap' }}>
          <span style={{ color, fontWeight: 500 }}>{tag}</span>
          <span>{subtitle}</span>
          <span>{duration}</span>
        </div>
        {note ? <div style={{ marginTop: 6, font: serif(14, 1.4, true), color: C.ink2 }}>{note}</div> : null}
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
        padding: '15px 16px 16px',
        borderRadius: R.card,
        background: C.card,
        boxShadow: CLAY.raised,
        cursor: 'pointer',
        color: C.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ font: mono(700, 10.5), letterSpacing: '.07em', textTransform: 'uppercase', color, background: TAGBG[tag] ?? C.sand, padding: '4px 10px', borderRadius: R.pill }}>{tag}</div>
        <div style={{ font: mono(400, 11.5), color: C.muted }}>{duration}</div>
      </div>
      <div style={{ marginTop: 7, font: serif(20, 1.15), textWrap: 'pretty' }}>{title}</div>
      <div style={{ marginTop: 4, font: sans(400, 12.5, 1.35), color: C.muted }}>{subtitle}</div>
      {note ? (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '2px dotted rgba(120,84,52,.18)', font: sans(400, 12.5, 1.4), color: C.ink2 }}>{note}</div>
      ) : null}
    </div>
  );
}
