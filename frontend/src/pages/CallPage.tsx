import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
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
  const navigate = useNavigate();
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
  const callEndedRef = useRef(false);

  // After the agent finishes talking, automatically start listening again so
  // the exchange feels like a real phone call instead of push-to-talk.
  function resumeListeningAfterSpeech() {
    if (callEndedRef.current) return;
    if (sttSupportedRef.current) startRef.current();
  }

  async function handleTurn(text: string) {
    if (!sessionIdRef.current) return;
    setIsThinking(true);
    setError(null);
    try {
      const { session: updated, assistantText } = await api.postTurn(sessionIdRef.current, text);
      setSession(updated);
      callEndedRef.current = updated.status === 'ended' || updated.status === 'escalated';
      speak(assistantText, resumeListeningAfterSpeech);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsThinking(false);
    }
  }

  const { isSupported: sttSupported, isListening, start, stop } = useSpeechRecognition({
    onFinalResult: handleTurn,
  });
  const sttSupportedRef = useRef(sttSupported);
  sttSupportedRef.current = sttSupported;
  const startRef = useRef(start);
  startRef.current = start;

  async function startCall() {
    setError(null);
    setIsThinking(true);
    callEndedRef.current = false;
    try {
      const { session: newSession } = await api.startCall(selectedPhone || UNKNOWN_NUMBER);
      sessionIdRef.current = newSession.id;
      setSession(newSession);
      const greeting = newSession.transcript.find((t) => t.role === 'assistant');
      if (greeting) speak(greeting.text, resumeListeningAfterSpeech);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the call.');
    } finally {
      setIsThinking(false);
    }
  }

  async function endCall() {
    if (!sessionIdRef.current) return;
    callEndedRef.current = true;
    stop();
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
        subtitle="Simulates an inbound customer-care call. Speak naturally — VoiceNexus verifies your identity, works your request, and either resolves it or transfers you to a live agent."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Call Simulator' }]}
      />

      <div className="banner banner--info">
        <PhoneCall size={15} />
        In production, customers reach VoiceNexus by calling the care line — there's no app or website for them. This
        page simulates that phone call in the browser so you can demo the experience without a telephony line.
      </div>

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

          {isEscalated && session && (
            <div className="banner banner--info">
              <span>Transferring you to a live agent, with everything VoiceNexus already knows about this call.</span>
              <Button size="sm" variant="outline" onClick={() => navigate(`/agent-handoff?call=${session.id}`)}>
                Open in Agent Workspace →
              </Button>
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
