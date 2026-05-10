import { useState, useEffect } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useChannels, usePreferences } from '@/lib/hooks';
import { SearchModal } from '@/components/SearchModal';
import { LoginModal } from '@/components/LoginModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { MessageList } from '@/components/MessageList';
import { MessageComposer } from '@/components/MessageComposer';
import { ChannelSidebar } from '@/components/ChannelSidebar';
import { ThreadPanel } from '@/components/ThreadPanel';
import { DMPanel } from '@/components/DMPanel';
import { ToastContainer } from '@/components/ToastContainer';
import { Avatar } from '@/components/ui/Avatar';
import { format } from 'date-fns';

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 520;
const SIDEBAR_DEFAULT = 240;

function useSidebarResizer() {
  useEffect(() => {
    const saved = localStorage.getItem('devlink-sidebar-width');
    if (saved) {
      document.documentElement.style.setProperty('--sidebar-w', saved);
    } else {
      document.documentElement.style.setProperty('--sidebar-w', `${SIDEBAR_DEFAULT}px`);
    }
  }, []);

  useEffect(() => {
    let startX = 0;
    let startW = 0;

    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.sidebar-resizer')) {
        const cur = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w');
        startX = e.clientX;
        startW = parseInt(cur) || SIDEBAR_DEFAULT;
        document.body.style.userSelect = 'none';
        document.body.setAttribute('data-resizing', '1');

        const onMove = (ev: MouseEvent) => {
          const delta = ev.clientX - startX;
          const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startW + delta));
          document.documentElement.style.setProperty('--sidebar-w', `${next}px`);
        };

        const onUp = () => {
          document.body.style.userSelect = '';
          document.body.removeAttribute('data-resizing');
          const w = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w');
          if (w) localStorage.setItem('devlink-sidebar-width', w);
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }
    };

    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);
}

export function App() {
  const { isAuthenticated } = useAuth();
  const currentUser = getCurrentUser();
  const {
    selectedChannelId,
    selectedThreadId,
    selectedDMUserId,
    sidebarCollapsed,
    toggleSidebar,
    toggleShortcutsModal,
  } = useUIStore();
  const { channels } = useChannels();
  const { preferences } = usePreferences();

  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useSidebarResizer();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const channel = channels.find((c) => c.id === selectedChannelId);
  // TODO: Implement threads query from Convex
  const thread = undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      setShowSettings(true);
    }
    if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      toggleShortcutsModal(true);
    }
    if (e.key === 'Escape') {
      setShowSearch(false);
      setShowLogin(false);
      setShowSettings(false);
      setShowNotificationSettings(false);
      setShowUserProfile(null);
      setShowShortcuts(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <div className="app-auth">
          <div className="auth-container">
            <div className="auth-header">
              <div className="auth-logo">
                <span className="logo-bracket">[</span>
                <span className="logo-text">DevLink</span>
                <span className="logo-bracket">]</span>
              </div>
              <div className="auth-tagline">// your team's terminal</div>
            </div>
            <div className="auth-prompt">
              <span className="prompt-user">guest</span>
              <span className="prompt-at">@</span>
              <span className="prompt-host">devlink</span>
              <span className="prompt-path">:~$</span>
              <input
                type="text"
                className="auth-command"
                placeholder="login --init"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setShowLogin(true);
                }}
              />
            </div>
            <div className="auth-hint">
              <span>Press</span>
              <kbd>Enter</kbd>
              <span>to authenticate</span>
            </div>
          </div>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <div className="app">
      {preferences.sidebarVisible !== false && (
        <>
          <div className="sidebar-reveal-zone" />
          <div className={`sidebar-host ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
            <ChannelSidebar />
            <div className="sidebar-resizer"><div className="bar" /></div>
          </div>
          
        </>
      )}

      <div className="main-area">
        {/* ── Terminal Title Bar ─── */}
        <div className="terminal-titlebar">
          <button
            className={`titlebar-btn titlebar-collapse ${sidebarCollapsed ? 'collapsed' : ''}`}
            onClick={() => toggleSidebar()}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
          <div className="titlebar-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="titlebar-title">
            <Avatar name={currentUser?.name || 'User'} size="xs" status={currentUser?.status || 'online'} />
            <span className="prompt-user" style={{ fontSize: 12 }}>{currentUser?.name?.split(' ')[0] || 'user'}</span>
            <span style={{ color: 'var(--fg-dim)' }}>@</span>
            <span className="prompt-host" style={{ fontSize: 12 }}>devlink</span>
            <span style={{ color: 'var(--fg-dim)' }}>:</span>
            <span className="prompt-path" style={{ fontSize: 12 }}>~/{channel?.name || 'general'}</span>
            <span className="prompt-symbol" style={{ fontSize: 12 }}>$</span>
          </div>
          <div className="titlebar-actions">
            <button className="titlebar-btn" onClick={() => setShowNotificationSettings(true)} title="Notifications">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <button className="titlebar-btn" onClick={() => setShowSearch(true)} title="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className="titlebar-btn" onClick={() => setShowSettings(true)} title="Settings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Terminal Body ─── */}
        <div className="terminal-body">
          <div className="messages-area">
            <MessageList />
            <MessageComposer />
          </div>
          {preferences.showThreads && thread && <ThreadPanel />}
          {selectedDMUserId && <DMPanel />}
        </div>

        {/* ── Terminal Status Bar ─── */}
        <div className="terminal-statusbar">
          <div className="statusbar-left">
            <span className="status-indicator" />
            <span className="status-text">connected</span>
            <span className="status-sep">|</span>
            <span className="status-text">DevLink v1.0.0</span>
            <span className="status-sep">|</span>
            <span className="status-text status-dim">channels/{channel?.name || 'general'}</span>
          </div>
          <div className="statusbar-right">
            <span className="status-key">Ctrl+K</span>
            <span className="status-text status-dim">search</span>
            <span className="status-sep">|</span>
            <span className="status-key">Ctrl+,</span>
            <span className="status-text status-dim">settings</span>
            <span className="status-sep">|</span>
            <span className="status-text status-dim">{format(currentTime, 'HH:mm:ss')}</span>
          </div>
        </div>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showNotificationSettings && <NotificationSettingsModal onClose={() => setShowNotificationSettings(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showUserProfile && <UserProfileModal userId={showUserProfile} onClose={() => setShowUserProfile(null)} />}
      <ToastContainer />
    </div>
  );
}
