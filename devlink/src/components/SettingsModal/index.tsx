import { useEffect, useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { usePreferences } from '@/lib/hooks';
import { X, User, Bell, Palette, Shield, Keyboard, Terminal, LogOut, Trash2, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { preferences, updatePreferences } = usePreferences();
  const addToast = useUIStore((state) => state.addToast);
  const logout = useUIStore((state) => state.logout);
  const updateCurrentUser = useUIStore((state) => state.updateCurrentUser);
  const setShowQuickStartGuide = useUIStore((state) => state.setShowQuickStartGuide);
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(preferences.theme);
  const [fontSize, setFontSize] = useState(preferences.fontSize);
  const [showThreads, setShowThreads] = useState(preferences.showThreads);
  const [sidebarVisible, setSidebarVisible] = useState(preferences.sidebarVisible);
  const [notifications, setNotifications] = useState(preferences.notifications);
  const [securitySettings, setSecuritySettings] = useState(preferences.security);

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');

  useEffect(() => {
    setTheme(preferences.theme);
    setFontSize(preferences.fontSize);
    setShowThreads(preferences.showThreads);
    setSidebarVisible(preferences.sidebarVisible);
    setNotifications(preferences.notifications);
    setSecuritySettings(preferences.security);
  }, [preferences]);

  const tabs = [
    { id: 'profile', label: 'profile', icon: User },
    { id: 'appearance', label: 'appearance', icon: Palette },
    { id: 'notifications', label: 'notifications', icon: Bell },
    { id: 'keyboard', label: 'keyboard', icon: Keyboard },
    { id: 'security', label: 'security', icon: Shield },
    { id: 'help', label: 'help', icon: HelpCircle },
  ];

  const handleSaveProfile = () => {
    updateCurrentUser(profileName, profileEmail);
    addToast({ type: 'success', message: 'Profile updated successfully' });
    onClose();
  };

  const handleSaveAppearance = () => {
    updatePreferences({ theme, fontSize, showThreads, sidebarVisible });
    addToast({ type: 'success', message: 'Appearance settings saved' });
    onClose();
  };

  const handleSaveNotifications = () => {
    updatePreferences({ notifications });
    addToast({ type: 'success', message: 'Notification settings saved' });
    onClose();
  };

  const handleSaveSecurity = () => {
    updatePreferences({ security: securitySettings });
    addToast({ type: 'success', message: 'Security settings saved' });
    onClose();
  };

  const handleChangePassword = () => {
    addToast({ type: 'info', message: 'Password change flow would trigger here' });
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGithubLink = () => {
    setSecuritySettings((prev) => ({ ...prev, githubLinked: true }));
    addToast({ type: 'success', message: 'GitHub account linked successfully' });
  };

  const handleGithubUnlink = () => {
    setSecuritySettings((prev) => ({ ...prev, githubLinked: false }));
    addToast({ type: 'info', message: 'GitHub account unlinked' });
  };

  const handleToggle2FA = () => {
    setSecuritySettings((prev) => {
      const next = { ...prev, twoFAEnabled: !prev.twoFAEnabled };
      addToast({
        type: 'success',
        message: next.twoFAEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      });
      return next;
    });
  };

  const handleSave = () => {
    if (activeTab === 'profile') {
      handleSaveProfile();
      return;
    }
    if (activeTab === 'appearance') {
      handleSaveAppearance();
      return;
    }
    if (activeTab === 'notifications') {
      handleSaveNotifications();
      return;
    }
    if (activeTab === 'security') {
      handleSaveSecurity();
      return;
    }
    if (activeTab === 'help') {
      onClose();
      return;
    }
    onClose();
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
                  <div className="theme-grid">
                    <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #1a1b26 50%, #24283b 50%)' }} />
                      <span>Tokyo Night</span>
                    </button>
                    <button className={`theme-option ${theme === 'catppuccin' ? 'active' : ''}`} onClick={() => setTheme('catppuccin')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #1e1e2e 50%, #313244 50%)' }} />
                      <span>Catppuccin</span>
                    </button>
                    <button className={`theme-option ${theme === 'kanagawa' ? 'active' : ''}`} onClick={() => setTheme('kanagawa')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #1f1f28 50%, #2a2a37 50%)' }} />
                      <span>Kanagawa</span>
                    </button>
                    <button className={`theme-option ${theme === 'rose-pine' ? 'active' : ''}`} onClick={() => setTheme('rose-pine')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #191724 50%, #26233a 50%)' }} />
                      <span>Rosé Pine</span>
                    </button>
                    <button className={`theme-option ${theme === 'everforest' ? 'active' : ''}`} onClick={() => setTheme('everforest')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #2d353b 50%, #3a454a 50%)' }} />
                      <span>Everforest</span>
                    </button>
                    <button className={`theme-option ${theme === 'gruvbox' ? 'active' : ''}`} onClick={() => setTheme('gruvbox')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #282828 50%, #3c3836 50%)' }} />
                      <span>Gruvbox</span>
                    </button>
                    <button className={`theme-option ${theme === 'nord' ? 'active' : ''}`} onClick={() => setTheme('nord')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #2e3440 50%, #3b4252 50%)' }} />
                      <span>Nord</span>
                    </button>
                    <button className={`theme-option ${theme === 'dracula' ? 'active' : ''}`} onClick={() => setTheme('dracula')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #282a36 50%, #3c3f51 50%)' }} />
                      <span>Dracula</span>
                    </button>
                    <button className={`theme-option ${theme === 'monokai-pro' ? 'active' : ''}`} onClick={() => setTheme('monokai-pro')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #2d2a2e 50%, #403e41 50%)' }} />
                      <span>Monokai Pro</span>
                    </button>
                    <button className={`theme-option ${theme === 'nightfox' ? 'active' : ''}`} onClick={() => setTheme('nightfox')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #1b1b2f 50%, #242442 50%)' }} />
                      <span>Nightfox</span>
                    </button>
                    <button className={`theme-option ${theme === 'oxocarbon' ? 'active' : ''}`} onClick={() => setTheme('oxocarbon')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #161616 50%, #262626 50%)' }} />
                      <span>Oxocarbon</span>
                    </button>
                    <button className={`theme-option ${theme === 'github' ? 'active' : ''}`} onClick={() => setTheme('github')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #0d1117 50%, #21262d 50%)' }} />
                      <span>GitHub Dark</span>
                    </button>
                    <button className={`theme-option ${theme === 'sonokai' ? 'active' : ''}`} onClick={() => setTheme('sonokai')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #2c2e34 50%, #363a45 50%)' }} />
                      <span>Sonokai</span>
                    </button>
                    <button className={`theme-option ${theme === 'onedark' ? 'active' : ''}`} onClick={() => setTheme('onedark')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #282c34 50%, #353b45 50%)' }} />
                      <span>One Dark</span>
                    </button>
                    <button className={`theme-option ${theme === 'ayu' ? 'active' : ''}`} onClick={() => setTheme('ayu')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #0b0e14 50%, #1a1f29 50%)' }} />
                      <span>Ayu Dark</span>
                    </button>
                    <button className={`theme-option ${theme === 'cyberdream' ? 'active' : ''}`} onClick={() => setTheme('cyberdream')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #0a0b10 50%, #1a1b22 50%)' }} />
                      <span>Cyberdream</span>
                    </button>
                    <button className={`theme-option ${theme === 'material' ? 'active' : ''}`} onClick={() => setTheme('material')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #263238 50%, #37474f 50%)' }} />
                      <span>Material</span>
                    </button>
                    <button className={`theme-option ${theme === 'gruber-darker' ? 'active' : ''}`} onClick={() => setTheme('gruber-darker')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #181818 50%, #282828 50%)' }} />
                      <span>Gruber Darker</span>
                    </button>
                    <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #f5f7fb 50%, #ffffff 50%)' }} />
                      <span>Daybreak</span>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">font size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setFontSize(Math.max(11, fontSize - 1))}>
                      -
                    </button>
                    <span>{fontSize}px</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setFontSize(Math.min(18, fontSize + 1))}>
                      +
                    </button>
                  </div>
                </div>
                <div className="permission-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>Show sidebar</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Toggle the left sidebar visibility</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={sidebarVisible} onChange={() => setSidebarVisible(prev => !prev)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="permission-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>Show threads</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Show thread panel when threads are available</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={showThreads} onChange={() => setShowThreads(prev => !prev)} />
                    <span className="toggle-slider" />
                  </label>
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
                      <input type="checkbox" checked={notifications.desktopNotifications} onChange={() => toggleNotification('desktopNotifications')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Sound Alerts</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Play sound for mentions</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={notifications.soundAlerts} onChange={() => toggleNotification('soundAlerts')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Message Preview</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Show message content in notifications</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={notifications.messagePreview} onChange={() => toggleNotification('messagePreview')} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="permission-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>Channel Notifications</div>
                      <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Notify on all channel activity</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={notifications.channelNotifications} onChange={() => toggleNotification('channelNotifications')} />
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
                            {securitySettings.githubLinked ? 'alexthompson-dev' : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      {securitySettings.githubLinked ? (
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
                      <input type="checkbox" checked={securitySettings.twoFAEnabled} onChange={handleToggle2FA} />
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

            {activeTab === 'help' && (
              <div>
                <div className="terminal-block" style={{ marginBottom: 20 }}>
                  <div className="terminal-line">
                    <span className="prompt-symbol">$</span>
                    <span style={{ color: 'var(--fg-muted)' }}> help --show</span>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 14 }}>// getting started</div>
                  <div className="terminal-block" style={{ padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Quick Start Guide</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
                          Learn the basics of DevLink with an interactive guide
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setShowQuickStartGuide(true);
                          onClose();
                        }}
                      >
                        <HelpCircle size={14} />
                        start guide
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 14 }}>// resources</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                      <Keyboard size={14} />
                      Keyboard Shortcuts
                    </button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                      <Terminal size={14} />
                      Command Reference
                    </button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                      <HelpCircle size={14} />
                      FAQ
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 14 }}>// support</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
                    Need help? Contact our support team or check out our community forums.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="popup-footer">
          <button className="btn btn-secondary" onClick={onClose}>cancel</button>
          {activeTab !== 'help' && (
            <button className="btn btn-primary" onClick={handleSave}>
              save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}