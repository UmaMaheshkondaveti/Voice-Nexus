import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'title' | 'tone' | 'durationMs'>> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertCircle size={18} />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = idRef.current++;
      const durationMs = toast.durationMs ?? 4000;
      setToasts((prev) => [...prev, { id, tone: toast.tone ?? 'info', durationMs, title: toast.title, description: toast.description }]);
      window.setTimeout(() => remove(id), durationMs);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.stack} aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={[styles.toast, styles[toast.tone]].join(' ')}>
              <span className={styles.icon}>{ICONS[toast.tone]}</span>
              <div className={styles.body}>
                <p className={styles.title}>{toast.title}</p>
                {toast.description && <p className={styles.description}>{toast.description}</p>}
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => remove(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
