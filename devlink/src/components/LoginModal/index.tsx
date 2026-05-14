import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useCreateUser, useRegister, useLogin } from '@/hooks/useData';
import { X, LogIn, Terminal, Eye, EyeOff, Loader2, Check, UserPlus } from 'lucide-react';
import { startGithubAuth, pollGithubToken, getGithubUser, getGithubEmails, buildGithubUsername } from '@/lib/github';

interface LoginModalProps {
  onClose: () => void;
}

type Page = 'login' | 'register' | 'success';

const DEMO_ACCOUNTS = [
  { email: 'sarah@devlink.io', name: 'Sarah Chen' },
  { email: 'marcus@devlink.io', name: 'Marcus Johnson' },
  { email: 'elena@devlink.io', name: 'Elena Rodriguez' },
  { email: 'james@devlink.io', name: 'James Kim' },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const map = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)', 'var(--cyan)'];
  return { score, label: map[score] || '', color: colors[score] || '' };
}

export function LoginModal({ onClose }: LoginModalProps) {
  const login = useUIStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);
  const createUserMutation = useCreateUser();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const [page, setPage] = useState<Page>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ghAuthStep, setGhAuthStep] = useState<'idle' | 'code' | 'polling' | 'complete'>('idle');
  const [ghUserCode, setGhUserCode] = useState('');
  const [ghError, setGhError] = useState('');
  const [successName, setSuccessName] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const ghPollRef = useRef<number | null>(null);

  const isPending = loginMutation.isPending || registerMutation.isPending || createUserMutation.isPending;
  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    return () => {
      if (ghPollRef.current) clearTimeout(ghPollRef.current);
    };
  }, []);

  useEffect(() => {
    setFieldErrors({});
    setTimeout(() => {
      if (page === 'register') nameRef.current?.focus();
      else emailRef.current?.focus();
    }, 50);
  }, [page]);

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  const handleGithubLogin = async () => {
    try {
      setGhAuthStep('code');
      setGhError('');
      const deviceCode = await startGithubAuth((userCode) => {
        setGhUserCode(userCode);
      });
      setGhAuthStep('polling');

      const poll = async () => {
        try {
          const result = await pollGithubToken(deviceCode);
          if (result === 'pending' || result === 'slow_down') {
            ghPollRef.current = window.setTimeout(poll, result === 'slow_down' ? 10000 : 5000);
            return;
          }
          if (typeof result === 'string' && result.length > 20) {
            const ghUser = await getGithubUser(result);
            const emails = await getGithubEmails(result);
            const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || emails[0]?.email || '';
            const ghUsername = buildGithubUsername(ghUser.name, ghUser.login);
            const loginEmail = primaryEmail || `${ghUsername}@github.local`;
            const finalUserId = await createUserMutation.mutateAsync({
              name: ghUser.name || ghUser.login,
              username: ghUsername,
              email: loginEmail,
              avatar: ghUser.avatar_url,
            });
            if (!finalUserId) throw new Error('User creation returned no ID');
            login(loginEmail, finalUserId);
            setSuccessName(ghUser.name || ghUser.login);
            setPage('success');
            setTimeout(() => onClose(), 1500);
          }
        } catch (err: any) {
          addToast({ type: 'error', message: err.message || 'GitHub auth failed' });
          setGhAuthStep('idle');
        }
      };
      setTimeout(poll, 2000);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to start GitHub auth' });
      setGhAuthStep('idle');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!email.trim()) { setFieldError('email', 'Required'); return; }
    if (!password.trim()) { setFieldError('password', 'Required'); return; }
    try {
      const result = await loginMutation.mutateAsync({ email: email.trim(), password });
      if (result) {
        login(result.email, result._id);
        setSuccessName(result.name);
        setPage('success');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setFieldError('email', err.message || 'Invalid credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    let hasError = false;
    if (!name.trim()) { setFieldError('name', 'Required'); hasError = true; }
    if (!email.trim() || !email.includes('@')) { setFieldError('email', 'Valid email required'); hasError = true; }
    if (password.length < 6) { setFieldError('password', 'At least 6 characters'); hasError = true; }
    if (password !== confirmPassword) { setFieldError('confirm', 'Passwords do not match'); hasError = true; }
    if (hasError) return;
    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email.toLowerCase(),
        password,
      });
      if (result) {
        login(result.email, result._id);
        setSuccessName(name.trim());
        setPage('success');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setFieldError('email', err.message || 'Registration failed');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email: demoEmail, password: 'demo123' });
      if (result) {
        login(result.email, result._id);
        setSuccessName(result.name);
        setPage('success');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Demo login failed' });
    }
  };

  const isSubmittable = () => {
    if (page === 'success') return false;
    if (isPending) return false;
    return true;
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    background: 'var(--bg-input)',
    border: `1px solid ${fieldErrors[field] ? 'var(--red)' : 'var(--border)'}`,
    color: 'var(--fg)',
    padding: '9px 10px',
    fontFamily: 'inherit',
    fontSize: 13,
    width: '100%',
    outline: 'none',
    transition: 'border-color 150ms',
  });

  const inputWrapStyle = { position: 'relative' as const, display: 'flex', alignItems: 'center' };

  if (page === 'success') {
    return (
      <div className="popup-overlay">
        <div className="popup-panel" style={{ width: 400, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>
            <Check size={48} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Welcome aboard</div>
          <div style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
            <span className="prompt-symbol">$</span> signed in as <span style={{ color: 'var(--cyan)' }}>{successName}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 440 }}>
        <div className="popup-header">
          <div className="popup-title">
            <Terminal size={16} style={{ color: 'var(--cyan)' }} />
            <span>auth</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// {page}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className="popup-body" onSubmit={page === 'login' ? handleLogin : handleRegister}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            marginBottom: 20,
            overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => { setPage('login'); setFieldErrors({}); }}
              style={{
                flex: 1,
                padding: '8px 0',
                background: page === 'login' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                color: page === 'login' ? 'var(--cyan)' : 'var(--fg-muted)',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: page === 'login' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              <LogIn size={12} style={{ marginRight: 6 }} />
              login
            </button>
            <button
              type="button"
              onClick={() => { setPage('register'); setFieldErrors({}); }}
              style={{
                flex: 1,
                padding: '8px 0',
                background: page === 'register' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                color: page === 'register' ? 'var(--cyan)' : 'var(--fg-muted)',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: page === 'register' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              <UserPlus size={12} style={{ marginRight: 6 }} />
              register
            </button>
          </div>

          {page === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --name</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  style={inputStyle('name')}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --email</span>
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  style={inputStyle('email')}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --password</span>
                </label>
                <div style={inputWrapStyle}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...inputStyle('password'), paddingRight: 36 }}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} style={{
                          flex: 1,
                          height: 3,
                          background: i <= strength.score ? strength.color : 'var(--border)',
                          transition: 'background 200ms',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: strength.color }}>{strength.label}</div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --confirm</span>
                </label>
                <div style={inputWrapStyle}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    style={{ ...inputStyle('confirm'), paddingRight: 36 }}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div style={{ fontSize: 10, color: passwordsMatch ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
                    {passwordsMatch ? <><Check size={10} /> passwords match</> : 'passwords do not match'}
                  </div>
                )}
              </div>
            </>
          )}

          {page === 'login' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --email</span>
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  style={inputStyle('email')}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> --password</span>
                </label>
                <div style={inputWrapStyle}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...inputStyle('password'), paddingRight: 36 }}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {ghError && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 10px', background: 'rgba(247, 118, 142, 0.08)', borderLeft: '3px solid var(--red)' }}>
              <span className="prompt-symbol">$</span> error: {ghError}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}
            disabled={!isSubmittable()}
          >
            {isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LogIn size={14} />
            )}
            {isPending
              ? (page === 'login' ? 'authenticating...' : 'creating account...')
              : (page === 'login' ? 'sign in' : 'create account')}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            fontSize: 11,
            color: 'var(--fg-dim)',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {ghAuthStep === 'idle' ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
              onClick={handleGithubLogin}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              sign in with GitHub
            </button>
          ) : (
            <div style={{ padding: 14, background: 'var(--bg-input)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--cyan)' }} />
                <span style={{ fontSize: 12, color: 'var(--fg)' }}>
                  {ghAuthStep === 'code' ? 'Preparing authorization...' : 'Waiting for GitHub approval...'}
                </span>
              </div>
              {ghUserCode && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>Enter this code on GitHub:</div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    letterSpacing: 3,
                    fontFamily: 'monospace',
                    background: 'var(--bg-main)',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    display: 'inline-block',
                  }}>
                    {ghUserCode}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--fg-dim)', textAlign: 'center' }}>
                Open <a href="https://github.com/login/device" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>github.com/login/device</a> and paste the code
              </div>
            </div>
          )}

          {page === 'login' && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, textAlign: 'center' }}>
                  Demo quick login (password: demo123)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'flex-start', fontSize: 10, padding: '5px 8px' }}
                      onClick={() => handleDemoLogin(acc.email)}
                      disabled={isPending}
                    >
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 7,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {acc.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </form>

        <div className="popup-footer" style={{ justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
            {page === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            onClick={() => { setPage(page === 'login' ? 'register' : 'login'); setFieldErrors({}); }}
            style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, fontWeight: 600 }}
          >
            {page === 'login' ? 'register' : 'sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
