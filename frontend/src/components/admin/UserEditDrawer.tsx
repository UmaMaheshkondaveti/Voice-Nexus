import { useEffect, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { PlatformUser, UserRole } from '../../types/admin';
import styles from './UserEditDrawer.module.css';

const ROLES: UserRole[] = ['Administrator', 'Operations Manager', 'Agent', 'Analyst', 'Developer'];

export interface UserDraft {
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
}

function toDraft(user: PlatformUser | null): UserDraft {
  return user ? { name: user.name, email: user.email, role: user.role, status: user.status } : { name: '', email: '', role: 'Agent', status: 'active' };
}

export interface UserEditDrawerProps {
  open: boolean;
  user: PlatformUser | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: UserDraft) => void;
}

export function UserEditDrawer({ open, user, saving, onClose, onSave }: UserEditDrawerProps) {
  const [draft, setDraft] = useState<UserDraft>(() => toDraft(user));

  useEffect(() => {
    setDraft(toDraft(user));
  }, [user, open]);

  return (
    <Drawer open={open} onClose={onClose} title={user ? `Edit ${user.name}` : 'New user'} width={440}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <label className={styles.field}>
          Full name
          <input type="text" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className={styles.field}>
          Email
          <input type="email" required value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </label>
        <label className={styles.field}>
          Role
          <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })} options={ROLES.map((r) => ({ value: r, label: r }))} />
        </label>
        <label className={styles.field}>
          Status
          <Select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as 'active' | 'disabled' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
            ]}
          />
        </label>
        <div className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save user
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
