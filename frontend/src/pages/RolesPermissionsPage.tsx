import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { getRoles, updateRolePermission } from '../services/adminService';
import type { RoleDefinition, UserRole } from '../types/admin';
import styles from './RolesPermissionsPage.module.css';

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [active, setActive] = useState<UserRole>('Administrator');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setRoles(await getRoles());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const current = roles.find((r) => r.role === active);
  const isAdmin = active === 'Administrator';

  async function toggle(module: string, field: 'view' | 'edit', value: boolean) {
    await updateRolePermission(active, module, { [field]: value });
    load();
    toast.push({ title: `${active} permissions updated`, tone: 'success' });
  }

  return (
    <div className="page">
      <PageHeader
        title="Roles & Permissions"
        subtitle="What each role can see and change across VoiceNexus."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Roles & Permissions' }]}
      />

      <Card
        actions={
          <Tabs
            size="sm"
            value={active}
            onChange={(v) => setActive(v as UserRole)}
            items={roles.map((r) => ({ value: r.role, label: r.role }))}
          />
        }
      >
        {!loading && current && (
          <>
            <p className={styles.description}>{current.description}</p>
            <div className={styles.table}>
              <div className={styles.headerRow}>
                <span>Module</span>
                <span>View</span>
                <span>Edit</span>
              </div>
              {current.permissions.map((perm) => (
                <div key={perm.module} className={styles.row}>
                  <span className={styles.moduleName}>{perm.module}</span>
                  <input type="checkbox" checked={perm.view} disabled={isAdmin} onChange={(e) => toggle(perm.module, 'view', e.target.checked)} />
                  <input
                    type="checkbox"
                    checked={perm.edit}
                    disabled={isAdmin || !perm.view}
                    onChange={(e) => toggle(perm.module, 'edit', e.target.checked)}
                  />
                </div>
              ))}
            </div>
            {isAdmin && <p className={styles.hint}>Administrator always has full access and can't be restricted.</p>}
          </>
        )}
      </Card>
    </div>
  );
}
