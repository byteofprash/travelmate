import { ChevronLeft } from 'lucide-react';
import { C, CLAY, R, sans } from '@/lib/theme';

/** A clear, finger-sized back control: a raised clay pill with a chevron and a label. */
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
        gap: 4,
        height: 44,
        minWidth: 44,
        padding: iconOnly ? 0 : '0 16px 0 10px',
        justifyContent: 'center',
        border: 0,
        borderRadius: R.pill,
        background: C.card,
        boxShadow: CLAY.soft,
        color: C.ink,
        font: sans(700, 14),
        cursor: 'pointer',
      }}
    >
      <ChevronLeft size={22} strokeWidth={2.4} color="var(--accent)" />
      {!iconOnly && label}
    </button>
  );
}
