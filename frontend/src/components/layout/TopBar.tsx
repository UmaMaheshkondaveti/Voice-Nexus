import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useToast } from '../ui/Toast';
import styles from './TopBar.module.css';

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { push } = useToast();
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

      <div className={styles.userMenuWrap} ref={userMenuRef}>
        <button
          type="button"
          className={styles.userChip}
          title="Signed in as Demo Operator"
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <span className={styles.avatar}>DO</span>
          <span className={styles.userLabel}>Demo Operator</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>
        {userMenuOpen && (
          <div className={styles.userMenu} role="menu">
            <div className={styles.userMenuHeader}>
              <span className={styles.userMenuName}>Demo Operator</span>
              <span className={styles.userMenuEmail}>demo.operator@voicenexus.ai</span>
            </div>
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
            <button
              type="button"
              role="menuitem"
              className={styles.userMenuItem}
              onClick={() => {
                setUserMenuOpen(false);
                push({ title: 'Signed out', description: 'This is a demo session, so sign-out is simulated.', tone: 'info' });
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
