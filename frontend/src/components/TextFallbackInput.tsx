import { useState, type FormEvent } from 'react';

interface TextFallbackInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function TextFallbackInput({ disabled, onSubmit }: TextFallbackInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form className="text-fallback" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type what you'd say…"
        disabled={disabled}
        aria-label="Message to the IVR agent"
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
