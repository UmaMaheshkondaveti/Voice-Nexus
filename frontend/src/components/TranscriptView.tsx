import { useState } from 'react';
import type { Turn } from '@shared/types';

export function TranscriptView({ turns }: { turns: Turn[] }) {
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
              <div className="transcript__bubble">{turn.text}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
