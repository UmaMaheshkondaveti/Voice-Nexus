import type { CallSummary, EscalationPayload } from '@shared/types';

type Escalation = CallSummary & { escalation: EscalationPayload };

export function EscalationCard({ call }: { call: Escalation }) {
  const { escalation } = call;
  return (
    <article className="escalation-card">
      <header className="escalation-card__header">
        <h3>{call.callerName ?? call.phoneNumber}</h3>
        <span className="escalation-card__time">{new Date(escalation.escalatedAt).toLocaleString()}</span>
      </header>
      <dl className="escalation-card__facts">
        <div>
          <dt>Verified identity</dt>
          <dd>{escalation.verifiedIdentity ? `Yes (${escalation.verificationLevel})` : 'No'}</dd>
        </div>
        <div>
          <dt>Intent</dt>
          <dd>{call.intent}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{escalation.reason}</dd>
        </div>
        {escalation.callbackRequested && (
          <div>
            <dt>Callback</dt>
            <dd>Requested</dd>
          </div>
        )}
      </dl>
      <p className="escalation-card__summary">{escalation.summary}</p>
      {escalation.attemptedSteps.length > 0 && (
        <>
          <h4>Attempted before transfer</h4>
          <ul>
            {escalation.attemptedSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
