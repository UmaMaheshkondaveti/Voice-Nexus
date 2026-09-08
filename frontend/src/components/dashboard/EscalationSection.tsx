import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { HorizontalBarList } from '../charts/HorizontalBarList';
import { getEscalationAnalytics } from '../../services/analyticsService';
import type { EscalationAnalytics } from '../../types/analytics';
import { formatNumber, formatPercent, formatSeconds } from '../../utils/format';
import styles from './EscalationSection.module.css';

export function EscalationSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<EscalationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEscalationAnalytics(range).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <Card title="Escalations" subtitle="Why calls transfer to a human agent, and how cleanly">
      {loading || !data ? (
        <Skeleton variant="block" height={220} />
      ) : (
        <div className={styles.wrap}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatSeconds(data.avgEscalationTimeSeconds)}</span>
              <span className={styles.statLabel}>Avg. time to escalate</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatPercent(data.contextCompletenessRate)}</span>
              <span className={styles.statLabel}>Transfers with full context</span>
            </div>
          </div>
          <div className={styles.columns}>
            <div>
              <h3 className={styles.columnTitle}>By reason</h3>
              <HorizontalBarList
                items={data.reasons.map((r) => ({ key: r.key, label: r.label, value: r.count, color: 'var(--color-escalation)' }))}
                valueFormatter={formatNumber}
                onItemClick={(item) => navigate(`/calls?escalated=true&escalationReason=${item.key}`)}
              />
            </div>
            <div>
              <h3 className={styles.columnTitle}>By destination</h3>
              <HorizontalBarList
                items={data.destinations.map((d) => ({ key: d.key, label: d.label, value: d.count, color: 'var(--color-primary-500)' }))}
                valueFormatter={formatNumber}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
