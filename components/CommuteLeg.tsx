import type { LegMode } from '@/lib/types';
import { C, mono, sans } from '@/lib/theme';

export const MODES: Record<LegMode, [string, string]> = {
  car: ['Car', '#94b0c2'],
  walk: ['Walk', '#a7f070'],
  train: ['Train', '#73eff7'],
  metro: ['Metro', '#73eff7'],
  flight: ['Flight', '#73eff7'],
};

export function CommuteLeg({ mode, duration, time, detail }: { mode: LegMode; duration: string; time?: string; detail: string }) {
  const [label, color] = MODES[mode] || MODES.car;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 20px minmax(0,1fr)', alignItems: 'stretch', minHeight: 44 }}>
      <div style={{ font: mono(400, 14), color: C.lightMuted, textAlign: 'right', paddingTop: 15, paddingRight: 8 }}>{time || ''}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 0, borderLeft: '4px dotted #94b0c2' }} />
      </div>
      <div style={{ padding: '10px 6px 10px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ font: mono(500, 10.5, 1.2), textTransform: 'uppercase', color }}>
          {label}
          {duration ? ' · ' + duration : ''}
        </div>
        <div style={{ font: sans(400, 12.5, 1.1), color: C.lightMuted }}>{detail}</div>
      </div>
    </div>
  );
}
