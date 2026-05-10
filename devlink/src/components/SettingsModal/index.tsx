import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { usePreferences } from '@/lib/hooks';
import { X, User, Bell, Palette, Shield, Keyboard, Terminal, LogOut, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { preferences, updatePreferences } = usePreferences();
  const addToast = useUIStore((state) => state.addToast);
  const logout = useUIStore((state) => state.logout);
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(preferences.theme);

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [githubLinked, setGithubLinked] = useState(false);

  const tabs = [
    { id: 'profile', label: 'profile', icon: User },
    { id: 'appearance', label: 'appearance', icon: Palette },
    { id: 'notifications', label: 'notifications', icon: Bell },
    { id: 'keyboard', label: 'keyboard', icon: Keyboard },
    { id: 'security', label: 'security', icon: Shield },
  ];

  const handleSaveProfile = () => {
    addToast({ type: 'success', message: 'Profile updated successfully' });
    onClose();
  };

  const handleSaveAppearance = () => {
    updatePreferences({ theme });
    addToast({ type: 'success', message: 'Appearance settings saved' });
  };

  const handleChangePassword = () => {
    addToast({ type: 'info', message: 'Password change flow would trigger here' });
  };

  const handleToggle2FA = () => {
    const newVal = !twoFAEnabled;
    setTwoFAEnabled(newVal);
    addToast({
      type: 'success',
      message: newVal ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
    });
  };

  const handleGithubLink = () => {
    addToast({ type: 'info', message: 'GitHub OAuth flow would start here (simulated)' });
    setGithubLinked(true);
    addToast({ type: 'success', message: 'GitHub account linked successfully' });
  };

  const handleGithubUnlink = () => {
    setGithubLinked(false);
    addToast({ type: 'info', message: 'GitHub account unlinked' });
  };

  const handleLogout = () => {
    logout();
    addToast({ type: 'info', message: 'Logged out successfully' });
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel settings-popup">
        <div className="popup-header">
          <div className="popup-title">
            <Terminal size={16} style={{ color: 'var(--cyan)' }} />
            <span>settings</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// config</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            {activeTab === 'profile' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> user.config --edit</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> name</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> email</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={handleLogout}>
                    <LogOut size={14} />
                    logout
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> theme.list --active</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">theme</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="theme-preview dark" />
                      <span>Tokyo Night</span>
                    </button>
                    <button
                      className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="theme-preview light" />
                      <span>Daybreak</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> notify.config --list</span>
                  </div>
                </div>
                <div className="permission-group">
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Desktop Notifications</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Show system notifications</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Sound Alerts</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Play sound for mentions</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Message Preview</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Show message content in notifications</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Channel Notifications</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Notify on all channel activity</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'keyboard' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> keybindings.list</span>
                  </div>
                </div>
                <div className="keybindings-list">
                  <div className="keybinding-item">
                    <span>Search</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">Ctrl</kbd>
                      <kbd className="keybinding-key">K</kbd>
                    </div>
                  </div>
                  <div className="keybinding-item">
                    <span>Settings</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">Ctrl</kbd>
                      <kbd className="keybinding-key">,</kbd>
                    </div>
                  </div>
                  <div className="keybinding-item">
                    <span>Send Message</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">Ctrl</kbd>
                      <kbd className="keybinding-key">Enter</kbd>
                    </div>
                  </div>
                  <div className="keybinding-item">
                    <span>Toggle Sidebar</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">Ctrl</kbd>
                      <kbd className="keybinding-key">B</kbd>
                    </div>
                  </div>
                  <div className="keybinding-item">
                    <span>Shortcuts Help</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">?</kbd>
                    </div>
                  </div>
                  <div className="keybinding-item">
                    <span>New Line</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd className="keybinding-key">Shift</kbd>
                      <kbd className="keybinding-key">Enter</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> security.config</span>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>// connected accounts</div>
                  <div className="terminal-block" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>⚙</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>GitHub</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                            {githubLinked ? 'alexthompson-dev' : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      {githubLinked ? (
                        <button className="btn btn-ghost btn-sm" onClick={handleGithubUnlink} style={{ color: 'var(--red)' }}>
                          unlink
                        </button>
                      ) : (
<button className="btn btn-secondary btn-sm" onClick={handleGithubLink}>
                            <span style={{ fontSize: 12 }}>⚙</span>
                            link
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleChangePassword}>
                    <Shield size={14} />
                    change password
                  </button>
                </div>
                <div className="form-group">
                  <div className="permission-row" style={{ padding: '12px 0' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>Two-Factor Authentication</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Add an extra layer of security</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={twoFAEnabled} onChange={handleToggle2FA} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div className="terminal-block" style={{ background: 'rgba(247, 118, 142, 0.06)', borderLeft: '3px solid var(--red)' }}>
                    <div style={{ fontWeight: 500, color: 'var(--red)', marginBottom: 6, fontSize: 12 }}>// danger zone</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12, marginBottom: 12 }}>
                      Deleting your account is permanent. All data will be lost.
                    </div>
                    <button className="btn btn-danger" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                      <Trash2 size={14} />
                      delete account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          <button className="btn btn-secondary" onClick={onClose}>cancel</button>
          <button className="btn btn-primary" onClick={activeTab === 'profile' ? handleSaveProfile : activeTab === 'appearance' ? handleSaveAppearance : onClose}>
            save
          </button>
        </div>
      </div>
    </div>
  );
}