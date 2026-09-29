import { CalendarDays, Luggage, Map as MapIcon, PanelLeftClose, PanelLeftOpen, Plane, Route, Settings, type LucideIcon } from 'lucide-react';
import { C, F, mono, rule, serif } from '@/lib/theme';

export type NavTab = 'home' | 'today' | 'trip' | 'map';

const EXPANDED = 248;
const COLLAPSED = 72;

function Item({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: LucideIcon;
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
      style={{ padding: collapsed ? '13px 0' : '12px 14px', justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <Icon size={20} strokeWidth={active ? 1.9 : 1.6} style={{ flex: 'none' }} />
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
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
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
          <div style={{ flex: 'none', width: 34, height: 34, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={18} strokeWidth={1.6} color={C.darkText} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ font: serif(21, 1), letterSpacing: '-.01em' }}>Travel</div>
              <div style={{ marginTop: 4, font: mono(500, 9.5), letterSpacing: '.1em', color: C.muted, textTransform: 'uppercase' }}>Companion</div>
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
          <Toggle size={18} strokeWidth={1.6} color={C.ink} />
        </button>
      </div>

      <nav aria-label="Main" style={{ padding: collapsed ? '18px 10px 0' : '18px 12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Item icon={Luggage} label="Trips" active={tab === 'home'} collapsed={collapsed} onClick={() => onGo('home')} />

        {showTrip && (
          <>
            {collapsed ? (
              <div style={{ margin: '14px 12px', height: 1, background: rule(0.12) }} />
            ) : (
              <div style={{ margin: '22px 14px 8px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ flex: 'none', width: 6, height: 6, borderRadius: 3, background: accent }} />
                <div style={{ font: mono(500, 10.5), letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tripName}
                </div>
              </div>
            )}
            <Item icon={CalendarDays} label="Today" active={tab === 'today'} collapsed={collapsed} onClick={() => onGo('today')} />
            <Item icon={Route} label="Trip" active={tab === 'trip'} collapsed={collapsed} onClick={() => onGo('trip')} />
            <Item icon={MapIcon} label="Map" active={tab === 'map'} collapsed={collapsed} onClick={() => onGo('map')} />
          </>
        )}
      </nav>

      <div style={{ flex: 1 }} />
      <div style={{ padding: collapsed ? '10px 10px 22px' : '10px 12px 22px', borderTop: `1px solid ${rule(0.08)}`, fontFamily: F.sans }}>
        <Item icon={Settings} label="Settings" collapsed={collapsed} onClick={onSettings} />
      </div>
    </aside>
  );
}
