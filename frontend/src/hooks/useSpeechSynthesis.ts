import { useCallback, useEffect, useRef } from 'react';

// Ranked by how natural/human they sound in Chrome/Edge's Web Speech voice list.
// Online neural voices (Google, Microsoft "Natural"/"Online") sound far less
// robotic than the offline SAPI voices ("Microsoft David/Zira Desktop", "Mark").
const PREFERRED_VOICE_PATTERNS = [
  /Google US English/i,
  /Microsoft \w+ Online \(Natural\)/i,
  /Microsoft Aria/i,
  /Microsoft Jenny/i,
  /Microsoft Ava/i,
  /Microsoft Guy/i,
  /Google UK English Female/i,
  /Samantha/i,
];

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  for (const pattern of PREFERRED_VOICE_PATTERNS) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }
  // Fall back to any remote/network voice — these are consistently more natural
  // than the always-available local SAPI voices.
  return pool.find((v) => !v.localService) ?? pool[0];
}

export function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) voiceRef.current = pickBestVoice(voices);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void, options?: { rate?: number; pitch?: number }) => {
      if (!isSupported || !text) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      // Slightly slower than default and a touch warmer in pitch reads as
      // calmer and more conversational than the flat 1.0/1.0 default.
      utterance.rate = options?.rate ?? 0.98;
      utterance.pitch = options?.pitch ?? 1.02;
      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  return { isSupported, speak };
}
