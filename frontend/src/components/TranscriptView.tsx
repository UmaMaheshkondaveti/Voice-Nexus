import { useState } from 'react';
import type { Turn } from '@shared/types';
import { formatTime } from '../utils/format';

interface TranscriptViewProps {
  turns: Turn[];
  /** Label for role: 'caller' turns — "You" in the live call simulator, "Customer" in an agent-facing view. */
  callerLabel?: string;
  /** Label for role: 'assistant' turns. */
  assistantLabel?: string;
  /** Show a small timestamp under each speaker label. Off by default in the live call simulator; on for agent/history review views. */
  showTimestamps?: boolean;
}

export function TranscriptView({
  turns,
  callerLabel = 'Customer',
  assistantLabel = 'VoiceNexus AI',
  showTimestamps = false,
}: TranscriptViewProps) {
  const [showDebug, setShowDebug] = useState(false);
  const visibleTurns = turns.filter((t) => t.role !== 'system-event' || showDebug);

  return (
    <div className="transcript">
      <div className="transcript__toolbar">
        <label className="transcript__toggle">
          <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
          Show technical detail
        </label>
      </div>
      <div className="transcript__list">
        {visibleTurns.map((turn) => (
          <div key={turn.id} className={`transcript__turn transcript__turn--${turn.role}`}>
            {turn.role === 'system-event' ? (
              <div className="transcript__debug">
                <code>{turn.text}</code>
                {turn.toolCall && (
                  <pre>{JSON.stringify({ input: turn.toolCall.input, result: turn.toolCall.result }, null, 2)}</pre>
                )}
              </div>
            ) : (
              <>
                <div className="transcript__speaker">
                  <span>{turn.role === 'caller' ? callerLabel : assistantLabel}</span>
                  {showTimestamps && <span className="transcript__timestamp">{formatTime(turn.timestamp)}</span>}
                </div>
                <div className="transcript__bubble">{turn.text}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
