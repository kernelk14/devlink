import { useState, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useUsers, useCreateUser, useOrganizations } from '@/hooks/useData';
import { X, LogIn, Terminal, UserPlus, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { startGithubAuth, pollGithubToken, getGithubUser, getGithubEmails, buildGithubUsername } from '@/lib/github';

interface LoginModalProps {
  onClose: () => void;
}

const MOCK_ACCOUNTS = [
  { email: 'sarah@devlink.io', name: 'Sarah Chen', password: 'demo123' },
  { email: 'marcus@devlink.io', name: 'Marcus Johnson', password: 'demo123' },
  { email: 'elena@devlink.io', name: 'Elena Rodriguez', password: 'demo123' },
  { email: 'james@devlink.io', name: 'James Kim', password: 'demo123' },
  { email: 'priya@devlink.io', name: 'Priya Patel', password: 'demo123' },
  { email: 'alex@devlink.io', name: 'Alex Thompson', password: 'demo123' },
  { email: 'nina@devlink.io', name: 'Nina Kowalski', password: 'demo123' },
];

export function LoginModal({ onClose }: LoginModalProps) {
  const login = useUIStore((state) => state.login);
  const addToast = useUIStore((state) => state.addToast);
  const { data: users = [] } = useUsers();
  const { data: orgs = [] } = useOrganizations();
  const createUserMutation = useCreateUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState('');
  const [ghAuthStep, setGhAuthStep] = useState<'idle' | 'code' | 'polling' | 'complete'>('idle');
  const [ghDeviceCode, setGhDeviceCode] = useState('');
  const [ghUserCode, setGhUserCode] = useState('');
  const [ghError, setGhError] = useState('');
  const ghPollingRef = useRef<number | null>(null);

  const handleGithubLogin = async () => {
    try {
      setGhAuthStep('code');
      setGhError('');
      const deviceCode = await startGithubAuth((userCode) => {
        setGhDeviceCode('https://github.com/login/device');
        setGhUserCode(userCode);
      });

      setGhAuthStep('polling');

      const poll = async () => {
        try {
          const result = await pollGithubToken(deviceCode);
          if (result === 'pending' || result === 'slow_down') {
            ghPollingRef.current = window.setTimeout(poll, result === 'slow_down' ? 10000 : 5000);
            return;
          }

          if (typeof result === 'string' && result.length > 20) {
            const ghUser = await getGithubUser(result);
            const emails = await getGithubEmails(result);
            const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || emails[0]?.email || '';
            const ghUsername = buildGithubUsername(ghUser.name, ghUser.login);
            const loginEmail = primaryEmail || `${ghUsername}@github.local`;

            const firstOrgId = orgs[0]?._id;
            if (!firstOrgId) {
              setGhError('No organization found. Please set up an org first.');
              setGhAuthStep('idle');
              return;
            }

            const finalUserId = await createUserMutation.mutateAsync({
              name: ghUser.name || ghUser.login,
              username: ghUsername,
              email: loginEmail,
              avatar: ghUser.avatar_url,
              orgId: firstOrgId,
            });

            if (!finalUserId) {
              throw new Error('User creation returned no ID');
            }

            login(loginEmail, finalUserId);
            addToast({ type: 'success', message: `Welcome, ${ghUser.name || ghUser.login}!` });
            setGhAuthStep('complete');
            setTimeout(() => {
              setGhAuthStep('idle');
              onClose();
            }, 1000);
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

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
    setRegistered('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 800));

    const account = MOCK_ACCOUNTS.find(
      (a) => (a.email.toLowerCase() === username.toLowerCase() || a.name.toLowerCase() === username.toLowerCase()) && a.password === password
    );

    if (account) {
      const realUser = users.find(u => u.email.toLowerCase() === account.email.toLowerCase()) as any;
      if (realUser?._id) {
        login(account.email, realUser._id);
        addToast({ type: 'success', message: `Welcome back, ${account.name}!` });
        onClose();
      } else {
        setError('User not found in database. Please wait for sync or register.');
      }
    } else {
      setError('Invalid credentials. Use a demo account or create a new one.');
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const exists = MOCK_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError('An account with this email already exists');
        setIsLoading(false);
        return;
      }

      MOCK_ACCOUNTS.push({ email: email.toLowerCase(), name: username.trim(), password });
      const firstOrgId = orgs[0]?._id;
      if (!firstOrgId) {
        setError('No organization available. Please contact admin.');
        setIsLoading(false);
        return;
      }
      const finalUserId = await createUserMutation.mutateAsync({
        name: username.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, ''),
        email: email.toLowerCase(),
        orgId: firstOrgId,
      });
      if (!finalUserId) {
        throw new Error('User creation failed - no ID returned');
      }
      login(email.toLowerCase(), finalUserId);
      setRegistered(username.trim());
      addToast({ type: 'success', message: `Welcome, ${username.trim()}! Account created.` });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
    setIsLoading(false);
  };

  const handleDemoLogin = async (email: string) => {
    setIsLoading(true);
    const realUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) as any;
    if (realUser?._id) {
      login(email, realUser._id);
      const account = MOCK_ACCOUNTS.find((a) => a.email === email);
      addToast({ type: 'success', message: `Signed in as ${account?.name || email}` });
      onClose();
    } else {
      addToast({ type: 'error', message: 'Demo user not synchronized. Please try again in a moment.' });
    }
    setIsLoading(false);
  };

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontFamily: 'inherit', fontSize: 13, width: '100%', outline: 'none', transition: 'border-color 150ms' };
  const inputWrapStyle = { position: 'relative' as const, display: 'flex', alignItems: 'center' };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 440 }}>
        <div className="popup-header">
          <div className="popup-title">
            <Terminal size={16} style={{ color: 'var(--cyan)' }} />
            <span>auth</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// {mode}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popup-body">
          <div className="terminal-block" style={{ marginBottom: 20 }}>
            <div className="terminal-line">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> auth.{mode} --mode </span>
              <span style={{ color: 'var(--cyan)' }}>interactive</span>
            </div>
            <div className="terminal-line" style={{ color: 'var(--fg-dim)', marginTop: 4 }}>
              <span style={{ color: 'var(--fg-dim)' }}>// {mode === 'login' ? 'Authenticate to access DevLink' : 'Create your DevLink account'}</span>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> --name</span>
              </label>
              <input
                type="text"
                style={inputStyle}
                placeholder="Your full name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> --email</span>
              </label>
              <input
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group">
              <label className="form-label">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> --user</span>
              </label>
              <input
                type="text"
                style={inputStyle}
                placeholder="email or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password && handleLogin(e as any)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> --pass{mode === 'register' ? 'word' : ''}</span>
            </label>
            <div style={inputWrapStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 36 }}
                placeholder={mode === 'register' ? 'min. 6 characters' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (mode === 'login' && e.key === 'Enter' && username) handleLogin(e as any);
                  if (mode === 'register' && e.key === 'Enter' && username && email && password && confirmPassword) handleRegister(e as any);
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> --confirm</span>
              </label>
              <div style={inputWrapStyle}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 36 }}
                  placeholder="repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && username && email && password && confirmPassword && handleRegister(e as any)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {['uppercase', 'lowercase', 'number', '6+ chars'].map((req) => {
                  const met = req === 'uppercase' ? /[A-Z]/.test(password)
                    : req === 'lowercase' ? /[a-z]/.test(password)
                    : req === 'number' ? /[0-9]/.test(password)
                    : password.length >= 6;
                  return (
                    <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: met ? 'var(--green)' : 'var(--fg-dim)' }}>
                      <Check size={10} />
                      {req}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="terminal-block" style={{ background: 'rgba(247, 118, 142, 0.08)', borderLeft: '3px solid var(--red)', padding: 10, marginBottom: 12 }}>
              <div className="terminal-line">
                <span style={{ color: 'var(--red)' }}>error:</span>
                <span style={{ color: 'var(--fg)', fontSize: 12 }}> {error}</span>
              </div>
            </div>
          )}

          {ghError && (
            <div className="terminal-block" style={{ background: 'rgba(247, 118, 142, 0.08)', borderLeft: '3px solid var(--red)', padding: 10, marginBottom: 12 }}>
              <div className="terminal-line">
                <span style={{ color: 'var(--red)' }}>error:</span>
                <span style={{ color: 'var(--fg)', fontSize: 12 }}> {ghError}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 16 }}
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            <LogIn size={14} />
            {isLoading ? (mode === 'login' ? 'authenticating...' : 'creating account...') : (mode === 'login' ? 'login' : 'create account')}
          </button>

          {mode === 'login' && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginBottom: 10, textAlign: 'center' }}>
                  // demo accounts (click to login)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {MOCK_ACCOUNTS.slice(0, 4).map((acc) => (
                    <button
                      key={acc.email}
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'flex-start', fontSize: 11 }}
                      onClick={() => handleDemoLogin(acc.email)}
                      disabled={isLoading}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', background: 'var(--purple)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {acc.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      {acc.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginBottom: 8 }}>
                  // or continue with
                </div>
                {ghAuthStep === 'idle' ? (
                    <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={handleGithubLogin}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      sign in with github
                    </button>
                  ) : (
                    <div style={{ width: '100%', padding: 12, background: 'var(--bg-input)', borderRadius: 6, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--cyan)' }} />
                        <span style={{ fontSize: 12, color: 'var(--fg)' }}>
                          {ghAuthStep === 'code' ? 'Preparing authorization...' : 'Waiting for approval...'}
                        </span>
                      </div>
                      {ghUserCode && (
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 2, textAlign: 'center', fontFamily: 'monospace', background: 'var(--bg)', padding: 8, borderRadius: 4 }}>
                          {ghUserCode}
                        </div>
                      )}
                      {ghAuthStep === 'polling' && (
                        <div style={{ fontSize: 10, color: 'var(--fg-dim)', marginTop: 8, textAlign: 'center' }}>
                          Open <a href={ghDeviceCode} target="_blank" rel="noopener" style={{ color: 'var(--cyan)' }}>github.com/device</a> and enter the code
                        </div>
                      )}
                    </div>
                  )}
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-dim)' }}>
                  no account?{' '}
                  <button onClick={() => handleModeSwitch('register')} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>
                    create one
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
                already have an account?{' '}
                <button onClick={() => handleModeSwitch('login')} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>
                  login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}