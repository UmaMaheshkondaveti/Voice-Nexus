import type { CallStatus } from '@shared/types';

const LABELS: Record<CallStatus, string> = {
  connecting: 'Connecting',
  'in-progress': 'In progress',
  escalated: 'Escalated',
  ended: 'Ended',
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{LABELS[status]}</span>;
}
