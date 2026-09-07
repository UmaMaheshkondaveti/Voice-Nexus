import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { UserEditDrawer, type UserDraft } from '../components/admin/UserEditDrawer';
import { createUser, deleteUser, getUsers, updateUser } from '../services/adminService';
import type { PlatformUser } from '../types/admin';
import { formatDateTime } from '../utils/format';

export function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlatformUser | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PlatformUser | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(draft: UserDraft) {
    setSaving(true);
    if (editing && editing !== 'new') {
      await updateUser(editing.id, draft);
      toast.push({ title: 'User updated', tone: 'success' });
    } else {
      await createUser(draft);
      toast.push({ title: 'User created', tone: 'success' });
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteUser(pendingDelete.id);
    toast.push({ title: `${pendingDelete.name} deleted`, tone: 'info' });
    setPendingDelete(null);
    load();
  }

  const columns: TableColumn<PlatformUser>[] = [
    { key: 'name', header: 'Name', render: (u) => <strong>{u.name}</strong>, sortValue: (u) => u.name },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => <Badge tone="primary">{u.role}</Badge> },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'success' : 'neutral'}>{u.status}</Badge> },
    { key: 'lastActive', header: 'Last active', render: (u) => formatDateTime(u.lastActive), sortValue: (u) => new Date(u.lastActive).getTime() },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <button
          type="button"
          aria-label={`Delete ${u.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(u);
          }}
          style={{ background: 'transparent', color: 'var(--color-text-faint)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Users"
        subtitle="Everyone with access to the VoiceNexus operator console."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Users' }]}
        actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setEditing('new')}>
            New user
          </Button>
        }
      />

      <Card>
        <Table
          columns={columns}
          rows={users}
          rowKey={(u) => u.id}
          loading={loading}
          onRowClick={(u) => setEditing(u)}
          emptyTitle="No users yet"
          defaultSortKey="lastActive"
        />
      </Card>

      <UserEditDrawer
        open={editing !== null}
        user={editing === 'new' ? null : editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name}?`}
        description="This user will immediately lose access to the operator console. This cannot be undone."
        confirmLabel="Delete user"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
