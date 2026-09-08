import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth, type Role } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Badge } from '../ui/Badge';
import styles from './TopBar.module.css';

const ROLE_LABEL: Record<Role, string> = { agent: 'Agent', operations: 'Operations', admin: 'Admin' };

function initials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { operator, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const now = new Date();

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className={styles.bar}>
      <button type="button" className={styles.hamburger} onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className={styles.spacer} />

      <div className={styles.liveIndicator}>
        <span className={styles.date}>
          {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <button
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <div className={styles.userMenuWrap} ref={userMenuRef}>
        <button
          type="button"
          className={styles.userChip}
          title={`Signed in as ${operator?.name ?? 'Operator'}`}
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <span className={styles.avatar}>{initials(operator?.name)}</span>
          <span className={styles.userLabel}>{operator?.name}</span>
          {operator && (
            <Badge tone="primary" className={styles.roleBadge}>
              {ROLE_LABEL[operator.role]}
            </Badge>
          )}
          <ChevronDown size={14} className={styles.chevron} />
        </button>
        {userMenuOpen && (
          <div className={styles.userMenu} role="menu">
            <div className={styles.userMenuHeader}>
              <span className={styles.userMenuName}>{operator?.name}</span>
              <span className={styles.userMenuEmail}>{operator?.email}</span>
              {operator && <Badge tone="primary">{ROLE_LABEL[operator.role]}</Badge>}
            </div>
            {operator?.role === 'admin' && (
              <button
                type="button"
                role="menuitem"
                className={styles.userMenuItem}
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/admin/settings');
                }}
              >
                <Settings size={16} />
                Settings
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={styles.userMenuItem}
              onClick={() => {
                setUserMenuOpen(false);
                signOut();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
