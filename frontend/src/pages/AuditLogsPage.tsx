import { useEffect, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { getAuditLogs, type AuditLogFilters } from '../services/adminService';
import type { AuditLogEntry } from '../types/admin';
import { formatDateTime } from '../utils/format';
import styles from './AuditLogsPage.module.css';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<'' | 'success' | 'failure'>('');

  async function load(filters: AuditLogFilters) {
    setLoading(true);
    setLogs(await getAuditLogs(filters));
    setLoading(false);
  }

  useEffect(() => {
    load({ search, result: result || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const columns: TableColumn<AuditLogEntry>[] = [
    { key: 'timestamp', header: 'Time', render: (l) => formatDateTime(l.timestamp), sortValue: (l) => new Date(l.timestamp).getTime() },
    { key: 'user', header: 'User', render: (l) => l.user },
    { key: 'action', header: 'Action', render: (l) => l.action },
    { key: 'resource', header: 'Resource', render: (l) => l.resource },
    {
      key: 'result',
      header: 'Result',
      render: (l) => (
        <Badge tone={l.result === 'success' ? 'success' : 'danger'}>{l.result}</Badge>
      ),
    },
    { key: 'detail', header: 'Detail', render: (l) => l.errorDetail ?? '—' },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Audit Logs"
        subtitle="Every administrative action taken across VoiceNexus, for compliance and troubleshooting."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'Audit Logs' }]}
        actions={
          <Button variant="outline" leftIcon={<Download size={14} />} disabled>
            Export
          </Button>
        }
      />

      <Card>
        <div className={styles.filters}>
          <form
            className={styles.search}
            onSubmit={(e) => {
              e.preventDefault();
              load({ search, result: result || undefined });
            }}
          >
            <Search size={15} className={styles.searchIcon} />
            <input type="search" placeholder="Search user, action, or resource…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <Select
            size="sm"
            value={result}
            onChange={(e) => setResult(e.target.value as '' | 'success' | 'failure')}
            options={[
              { value: '', label: 'All results' },
              { value: 'success', label: 'Success only' },
              { value: 'failure', label: 'Failure only' },
            ]}
          />
        </div>

        <Table columns={columns} rows={logs} rowKey={(l) => l.id} loading={loading} defaultSortKey="timestamp" emptyTitle="No matching audit events" />
      </Card>
    </div>
  );
}
