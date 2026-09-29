import type { LegMode } from '@/lib/types';
import { C, mono, sans } from '@/lib/theme';

export const MODES: Record<LegMode, [string, string]> = {
  car: ['Car', '#3B3E44'],
  walk: ['Walk', '#408335'],
  train: ['Train', '#1455C0'],
  metro: ['Metro', '#1455C0'],
  flight: ['Flight', '#1455C0'],
};

export function CommuteLeg({ mode, duration, time, detail }: { mode: LegMode; duration: string; time?: string; detail: string }) {
  const [label, color] = MODES[mode] || MODES.car;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '62px 18px minmax(0,1fr)', alignItems: 'stretch', minHeight: 44 }}>
      <div style={{ font: mono(400, 11.5), color: C.muted, textAlign: 'right', paddingTop: 15 }}>{time || ''}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 0, borderLeft: '1.5px dashed rgba(34,36,40,.28)' }} />
      </div>
      <div style={{ padding: '10px 6px 10px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ font: mono(500, 10.5, 1.2), letterSpacing: '.07em', textTransform: 'uppercase', color }}>
          {label}
          {duration ? ' · ' + duration : ''}
        </div>
        <div style={{ font: sans(400, 12.5, 1.35), color: C.muted }}>{detail}</div>
      </div>
    </div>
  );
}
