import type { CallSession } from '@shared/types';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { TranscriptView } from '../TranscriptView';
import { escalationReasonLabel, fallbackRecommendedAction, urgencyLabel, urgencyBadgeTone } from '../../utils/escalation';
import { formatDateTime, formatSeconds } from '../../utils/format';
import styles from './CallDetailDrawer.module.css';

const STATUS_TONE = {
  connecting: 'warn',
  'in-progress': 'info',
  escalated: 'escalation',
  ended: 'success',
} as const;

const STATUS_LABEL = {
  connecting: 'Connecting',
  'in-progress': 'In progress',
  escalated: 'Escalated',
  ended: 'Resolved',
} as const;

function durationOf(session: CallSession): number | undefined {
  return session.endedAt ? (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000 : undefined;
}

export function CallSessionDrawer({
  session,
  loading,
  onClose,
}: {
  session: CallSession | null;
  loading: boolean;
  onClose: () => void;
}) {
  const duration = session ? durationOf(session) : undefined;

  return (
    <Drawer
      open={session !== null || loading}
      onClose={onClose}
      title={session?.callerName ?? session?.phoneNumber ?? 'Call detail'}
      subtitle={session ? [session.phoneNumber, formatDateTime(session.startedAt)].filter(Boolean).join(' · ') : undefined}
      width={520}
    >
      {loading && !session && <p className={styles.sectionTitle}>Loading…</p>}
      {session && (
        <div className={styles.content}>
          <div className={styles.badgeRow}>
            <Badge tone={STATUS_TONE[session.status]}>{STATUS_LABEL[session.status]}</Badge>
            <Badge tone={session.identityVerified ? 'success' : 'warn'}>
              {session.identityVerified ? `Verified (${session.verificationLevel})` : 'Not verified'}
            </Badge>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Summary</h3>
            <dl className={styles.factGrid}>
              <div>
                <dt>Intent</dt>
                <dd>{session.intent.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{duration !== undefined ? formatSeconds(duration) : 'Ongoing'}</dd>
              </div>
              {session.accountId && (
                <div>
                  <dt>Account ID</dt>
                  <dd><code>{session.accountId}</code></dd>
                </div>
              )}
              {session.transactionsCompleted.length > 0 && (
                <div>
                  <dt>Actions completed</dt>
                  <dd>{session.transactionsCompleted.join('; ')}</dd>
                </div>
              )}
            </dl>
          </section>

          {session.escalation && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Escalation</h3>
              <dl className={styles.factGrid}>
                <div>
                  <dt>Reason</dt>
                  <dd>{escalationReasonLabel(session.escalation.reason)}</dd>
                </div>
                <div>
                  <dt>Urgency</dt>
                  <dd><Badge tone={urgencyBadgeTone(session.escalation.urgency)}>{urgencyLabel(session.escalation.urgency)}</Badge></dd>
                </div>
                {session.escalation.customerIssue && (
                  <div>
                    <dt>Customer's issue</dt>
                    <dd>{session.escalation.customerIssue}</dd>
                  </div>
                )}
                {session.escalation.desiredOutcome && (
                  <div>
                    <dt>Desired outcome</dt>
                    <dd>{session.escalation.desiredOutcome}</dd>
                  </div>
                )}
                <div>
                  <dt>Recommended next action</dt>
                  <dd>{session.escalation.recommendedNextAction || fallbackRecommendedAction(session.escalation.reason)}</dd>
                </div>
              </dl>
              <p>{session.escalation.summary}</p>
              {session.escalation.keyFacts.length > 0 && (
                <>
                  <h4 className={styles.sectionTitle}>Key facts</h4>
                  <ul>
                    {session.escalation.keyFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </>
              )}
              {session.agentNotes && (
                <>
                  <h4 className={styles.sectionTitle}>Agent notes</h4>
                  <p>{session.agentNotes}</p>
                </>
              )}
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Transcript</h3>
            <TranscriptView turns={session.transcript} callerLabel="Customer" assistantLabel="VoiceNexus AI" showTimestamps />
          </section>
        </div>
      )}
    </Drawer>
  );
}
