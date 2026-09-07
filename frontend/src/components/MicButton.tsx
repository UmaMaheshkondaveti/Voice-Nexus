interface MicButtonProps {
  isListening: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function MicButton({ isListening, disabled, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      className={`mic-button${isListening ? ' mic-button--listening' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? 'Stop listening' : 'Start speaking'}
    >
      <span className="mic-button__icon" aria-hidden="true">
        {isListening ? '●' : '🎙'}
      </span>
      <span>{isListening ? 'Listening…' : 'Tap to speak'}</span>
    </button>
  );
}
