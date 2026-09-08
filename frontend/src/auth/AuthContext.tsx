import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setApiRole } from '../api/client';

export type Role = 'agent' | 'operations' | 'admin';

export interface Operator {
  name: string;
  email: string;
  role: Role;
}

const STORAGE_KEY = 'voicenexus.auth.operator';

// No real backend user store exists for the operator console, so these are three
// known demo accounts rather than a full auth backend — but the login/logout
// mechanics themselves are real: wrong credentials are rejected, the session
// persists across reloads, role determines what the signed-in operator can see
// AND (via the X-VN-Role header) what the backend will actually let them do,
// and signing out actually ends it.
const DEMO_PASSWORD = 'Demo123!';

const DEMO_ACCOUNTS: Record<string, Operator> = {
  'agent@voicenexus.demo': { name: 'Grace Okafor', email: 'agent@voicenexus.demo', role: 'agent' },
  'operations@voicenexus.demo': { name: 'Marcus Webb', email: 'operations@voicenexus.demo', role: 'operations' },
  'admin@voicenexus.demo': { name: 'Priya Anand', email: 'admin@voicenexus.demo', role: 'admin' },
};

export const DEMO_LOGINS: { role: Role; label: string; email: string; password: string }[] = [
  { role: 'agent', label: 'Agent', email: 'agent@voicenexus.demo', password: DEMO_PASSWORD },
  { role: 'operations', label: 'Operations', email: 'operations@voicenexus.demo', password: DEMO_PASSWORD },
  { role: 'admin', label: 'Admin', email: 'admin@voicenexus.demo', password: DEMO_PASSWORD },
];

/** Where each role lands immediately after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  agent: '/agent-handoff',
  operations: '/dashboard',
  admin: '/dashboard',
};

function readStoredOperator(): Operator | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Operator) : null;
  } catch {
    // storage unavailable (private browsing, etc.)
    return null;
  }
}

interface AuthContextValue {
  operator: Operator | null;
  signIn: (email: string, password: string) => { ok: true; role: Role } | { ok: false; error: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(readStoredOperator);

  useEffect(() => {
    try {
      if (operator) localStorage.setItem(STORAGE_KEY, JSON.stringify(operator));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — session just won't persist across reloads.
    }
    setApiRole(operator?.role ?? null);
  }, [operator]);

  const signIn = useCallback((email: string, password: string) => {
    const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
    if (!account || password !== DEMO_PASSWORD) {
      return { ok: false as const, error: 'Incorrect email or password.' };
    }
    setOperator(account);
    return { ok: true as const, role: account.role };
  }, []);

  const signOut = useCallback(() => setOperator(null), []);

  const value = useMemo(() => ({ operator, signIn, signOut }), [operator, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
