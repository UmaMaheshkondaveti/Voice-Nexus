import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Radio } from 'lucide-react';
import { NAV_GROUPS } from './navConfig';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && <div className={styles.backdrop} onClick={onCloseMobile} aria-hidden="true" />}
      <nav
        className={[styles.sidebar, collapsed ? styles.collapsed : '', mobileOpen ? styles.mobileOpen : ''].join(' ')}
        aria-label="Primary"
      >
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Radio size={18} />
          </span>
          {!collapsed && <span className={styles.brandName}>VoiceNexus</span>}
        </div>

        <div className={styles.groups}>
          {NAV_GROUPS.map((group, gi) => (
            <div className={styles.group} key={group.label ?? `g${gi}`}>
              {group.label && !collapsed && <div className={styles.groupLabel}>{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onCloseMobile}
                    className={({ isActive }) => [styles.link, isActive ? styles.active : ''].join(' ')}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} className={styles.linkIcon} />
                    {!collapsed && <span className={styles.linkLabel}>{item.label}</span>}
                    {!collapsed && !item.implemented && <span className={styles.soonBadge}>Soon</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </nav>
    </>
  );
}
