import { Badge } from '../ui/Badge';
import { INTENT_LABELS, WORKFLOW_STAGE_LABELS, type EnrichedCall } from '../../types/analytics';
import { formatSeconds, formatTime } from '../../utils/format';
import styles from './CallDetailDrawer.module.css';

const RESOLUTION_TONE = {
  resolved: 'success',
  partial: 'warn',
  escalated: 'danger',
  failed: 'danger',
} as const;

const AUTH_TONE = {
  verified: 'success',
  pending: 'warn',
  failed: 'danger',
  'not-required': 'neutral',
} as const;

export function CallDetailBody({ call }: { call: EnrichedCall }) {
  return (
    <div className={styles.content}>
      <div className={styles.badgeRow}>
        <Badge tone={RESOLUTION_TONE[call.resolution]}>{call.resolution}</Badge>
        <Badge tone={AUTH_TONE[call.authStatus]}>Auth: {call.authStatus.replace('-', ' ')}</Badge>
        {call.escalated && <Badge tone="danger">Escalated</Badge>}
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Summary</h3>
        <dl className={styles.factGrid}>
          <div>
            <dt>Intent</dt>
            <dd>{INTENT_LABELS[call.intent]}</dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>{Math.round(call.intentConfidence * 100)}%</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{formatSeconds(call.durationSeconds)}</dd>
          </div>
          <div>
            <dt>Workflow stage</dt>
            <dd>{WORKFLOW_STAGE_LABELS[call.workflowStage]}</dd>
          </div>
          {call.csat !== undefined && (
            <div>
              <dt>CSAT</dt>
              <dd>{call.csat.toFixed(1)} / 5</dd>
            </div>
          )}
          {call.escalated && (
            <div>
              <dt>Destination</dt>
              <dd>{call.destinationQueue}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Call timeline</h3>
        <ol className={styles.timeline}>
          {call.timeline.map((event, i) => (
            <li key={i} className={styles.timelineItem}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div>
                <p className={styles.timelineLabel}>{event.label}</p>
                <p className={styles.timelineMeta}>
                  {formatTime(event.timestamp)}
                  {event.detail ? ` · ${event.detail}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Transcript</h3>
        <div className={styles.transcript}>
          {call.transcriptSnippet.map((turn, i) => (
            <div key={i} className={turn.speaker === 'caller' ? styles.turnCaller : styles.turnAssistant}>
              <div className={styles.bubble}>{turn.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
