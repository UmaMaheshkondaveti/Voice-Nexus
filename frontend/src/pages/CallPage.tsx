import { useEffect, useRef, useState } from 'react';
import type { CallSession, DemoAccountOption } from '@shared/types';
import { api } from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { MicButton } from '../components/MicButton';
import { TranscriptView } from '../components/TranscriptView';
import { CallStatusBadge } from '../components/CallStatusBadge';
import { TextFallbackInput } from '../components/TextFallbackInput';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';

const UNKNOWN_NUMBER = '+19995550000';

export function CallPage() {
  const [accounts, setAccounts] = useState<DemoAccountOption[]>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [session, setSession] = useState<CallSession | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    api
      .getDemoAccounts()
      .then((list) => {
        setAccounts(list);
        setSelectedPhone(list[0]?.phoneNumber ?? UNKNOWN_NUMBER);
      })
      .catch(() => setError('Could not load demo accounts. Is the backend running?'));
  }, []);

  const { speak, isSupported: ttsSupported } = useSpeechSynthesis();

  async function handleTurn(text: string) {
    if (!sessionIdRef.current) return;
    setIsThinking(true);
    setError(null);
    try {
      const { session: updated, assistantText } = await api.postTurn(sessionIdRef.current, text);
      setSession(updated);
      speak(assistantText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsThinking(false);
    }
  }

  const { isSupported: sttSupported, isListening, start, stop } = useSpeechRecognition({
    onFinalResult: handleTurn,
  });

  async function startCall() {
    setError(null);
    setIsThinking(true);
    try {
      const { session: newSession } = await api.startCall(selectedPhone || UNKNOWN_NUMBER);
      sessionIdRef.current = newSession.id;
      setSession(newSession);
      const greeting = newSession.transcript.find((t) => t.role === 'assistant');
      if (greeting) speak(greeting.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the call.');
    } finally {
      setIsThinking(false);
    }
  }

  async function endCall() {
    if (!sessionIdRef.current) return;
    const { session: updated } = await api.endCall(sessionIdRef.current);
    setSession(updated);
  }

  function resetCall() {
    sessionIdRef.current = null;
    setSession(null);
  }

  const isActive = session && session.status !== 'ended' && session.status !== 'escalated';
  const isEscalated = session?.status === 'escalated';

  return (
    <div className="page">
      <PageHeader
        title="Call Simulator"
        subtitle="Simulates an inbound customer-care call. Speak naturally — the agent verifies your identity, works your request, and either resolves it or transfers you to a live agent."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Call Simulator' }]}
      />

      {error && <div className="banner banner--error">{error}</div>}

      {!session && (
        <div className="call-start card">
          <label htmlFor="account-select">Simulate calling as</label>
          <select id="account-select" value={selectedPhone} onChange={(e) => setSelectedPhone(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.phoneNumber} value={a.phoneNumber}>
                {a.fullName} ({a.phoneNumber})
              </option>
            ))}
            <option value={UNKNOWN_NUMBER}>Unknown number</option>
          </select>
          <Button onClick={startCall} loading={isThinking}>
            {isThinking ? 'Connecting…' : 'Start Call'}
          </Button>
        </div>
      )}

      {session && (
        <div className="call-active card">
          <div className="call-active__header">
            <CallStatusBadge status={session.status} />
            {!ttsSupported && <span className="banner banner--warn">Voice playback isn't supported here.</span>}
          </div>

          <TranscriptView turns={session.transcript} />

          {isEscalated && (
            <div className="banner banner--info">
              Transferring you to a live agent. This call now appears on the Agent Handoff page.
            </div>
          )}

          {isActive && (
            <div className="call-controls">
              {sttSupported ? (
                <MicButton isListening={isListening} disabled={isThinking} onClick={isListening ? stop : start} />
              ) : (
                <div className="banner banner--warn">
                  Voice input isn't supported in this browser — try Chrome or Edge. Use text instead:
                </div>
              )}
              <TextFallbackInput disabled={isThinking} onSubmit={handleTurn} />
            </div>
          )}

          <div className="call-active__footer">
            {isActive ? (
              <Button variant="danger" onClick={endCall}>
                End Call
              </Button>
            ) : (
              <Button onClick={resetCall}>Start a new call</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
