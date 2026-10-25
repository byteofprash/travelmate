import { PixelIcon } from './PixelIcon';
import { C, CLAY, R, mono } from '@/lib/theme';

/** A clear back control: a raised yellow pixel button with an arrow and a label. */
export function BackButton({ label = 'Trips', onClick, iconOnly = false }: { label?: string; onClick: () => void; iconOnly?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Back to ${label}`}
      className="hov-card"
      style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 48,
        minWidth: 48,
        margin: 4,
        padding: iconOnly ? 0 : '0 16px 0 10px',
        justifyContent: 'center',
        border: 0,
        borderRadius: R.pill,
        background: C.accent2,
        boxShadow: CLAY.accent,
        color: C.ink,
        font: mono(700, 14),
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <PixelIcon name="back" size={28} />
      {!iconOnly && label}
    </button>
  );
}
