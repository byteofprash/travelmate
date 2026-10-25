import { PixelIcon, type IconName } from './PixelIcon';
import { C, mono, rule, sans, serif, CLAY, R } from '@/lib/theme';

export type NavTab = 'home' | 'today' | 'trip' | 'map';

const EXPANDED = 272;
const COLLAPSED = 84;

function Item({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={'side-item' + (active ? ' active' : '')}
      style={{ padding: collapsed ? '12px 0' : '10px 14px', justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <PixelIcon name={icon} size={28} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export function Sidebar({
  tab,
  collapsed,
  tripName,
  showTrip,
  accent,
  onToggle,
  onGo,
  onSettings,
}: {
  tab: NavTab;
  collapsed: boolean;
  tripName: string;
  showTrip: boolean; // the selected trip has plans, so Today / Trip / Map make sense
  accent: string;
  onToggle: () => void;
  onGo: (t: NavTab) => void;
  onSettings: () => void;
}) {
  return (
    <aside className="side" style={{ width: collapsed ? COLLAPSED : EXPANDED }}>
      <div
        style={{
          padding: collapsed ? '30px 0 8px' : '30px 16px 8px 18px',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div style={{ flex: 'none', width: 48, height: 48, margin: 4, background: accent, boxShadow: CLAY.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PixelIcon name="plane" size={28} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ font: serif(21, 1), textTransform: 'uppercase' }}>Travel</div>
              <div style={{ marginTop: 6, font: mono(500, 9.5), color: C.muted, textTransform: 'uppercase' }}>Companion</div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="side-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PixelIcon name={collapsed ? 'forward' : 'back'} size={28} />
        </button>
      </div>

      <nav aria-label="Main" style={{ padding: collapsed ? '22px 14px 0' : '22px 18px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Item icon="suitcase" label="Trips" active={tab === 'home'} collapsed={collapsed} onClick={() => onGo('home')} />

        {showTrip && (
          <>
            {collapsed ? (
              <div style={{ margin: '10px 8px', borderTop: `4px dotted ${rule(0.25)}` }} />
            ) : (
              <div style={{ margin: '22px 14px 8px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ flex: 'none', width: 8, height: 8, background: accent, boxShadow: `0 0 0 2px ${C.ink}` }} />
                <div style={{ font: mono(500, 10.5), textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tripName}
                </div>
              </div>
            )}
            <Item icon="list" label="Trip" active={tab === 'trip'} collapsed={collapsed} onClick={() => onGo('trip')} />
            <Item icon="calendar" label="Today" active={tab === 'today'} collapsed={collapsed} onClick={() => onGo('today')} />
            <Item icon="map" label="Map" active={tab === 'map'} collapsed={collapsed} onClick={() => onGo('map')} />
          </>
        )}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ padding: collapsed ? '18px 14px 26px' : '18px 18px 26px', borderTop: `4px dotted ${rule(0.2)}` }}>
        <Item icon="gear" label="Settings" collapsed={collapsed} onClick={onSettings} />
      </div>
    </aside>
  );
}
