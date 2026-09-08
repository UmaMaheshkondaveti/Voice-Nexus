import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radio, Mail, Lock, Eye, EyeOff, Headset, LineChart, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_LOGINS, ROLE_HOME, type Role } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import styles from './LoginPage.module.css';

const ROLE_ICON: Record<Role, typeof Headset> = {
  agent: Headset,
  operations: LineChart,
  admin: ShieldCheck,
};

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestedFrom = (location.state as { from?: string } | null)?.from;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Client-side check against the known demo accounts — see AuthContext.
    // No network round-trip needed, but we still keep it feeling like a real
    // submit rather than an instant toggle.
    window.setTimeout(() => {
      const result = signIn(email, password);
      if (result.ok) {
        navigate(requestedFrom ?? ROLE_HOME[result.role], { replace: true });
      } else {
        setError(result.error);
        setSubmitting(false);
      }
    }, 250);
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  }

  function forgotPassword() {
    toast.push({
      title: 'Contact your administrator',
      description: 'Password resets for the operator console are handled by a VoiceNexus administrator.',
      tone: 'info',
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.brandMark}>
          <Radio size={26} />
        </span>
        <h1 className={styles.brandName}>VoiceNexus</h1>
        <p className={styles.tagline}>Conversational IVR Platform</p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <Mail size={16} className={styles.fieldIcon} aria-hidden="true" />
            <label htmlFor="login-email" className="visually-hidden">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className={styles.field}>
            <Lock size={16} className={styles.fieldIcon} aria-hidden="true" />
            <label htmlFor="login-password" className="visually-hidden">
              Password
            </label>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className={styles.formRow}>
            <button type="button" className={styles.forgot} onClick={forgotPassword}>
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className={styles.demoSection}>
          <p className={styles.demoLabel}>Demo environment — sign in as</p>
          <div className={styles.demoGrid}>
            {DEMO_LOGINS.map((demo) => {
              const Icon = ROLE_ICON[demo.role];
              return (
                <button
                  key={demo.role}
                  type="button"
                  className={styles.demoCard}
                  onClick={() => fillDemo(demo.email, demo.password)}
                >
                  <Icon size={16} />
                  <span>{demo.label}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.hint}>
            <code>{'{role}'}@voicenexus.demo</code> / <code>Demo123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
