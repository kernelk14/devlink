import { useState, useEffect } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels, useOrganizations, useUser, useUsers, useUpdateUser, useConnectUser } from '@/hooks/useData';
import { usePreferences } from '@/lib/hooks';
import { MessageSquare, UserPlus, UserCheck, AtSign } from 'lucide-react';
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
import { TabsBar } from '@/components/TabsBar';
import { QuickStartGuide } from '@/components/QuickStartGuide';
import { OrgSetupModal } from '@/components/OrgSetupModal';
import { InviteModal } from '@/components/InviteModal';
import { InviteJoin } from '@/components/InviteJoin';
import { ToastContainer } from '@/components/ToastContainer';
import { MessageNotificationWatcher } from '@/components/MessageNotificationWatcher';
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
  const { isAuthenticated, selectedChannelId, selectedThreadId, selectedDMUserId, sidebarCollapsed, toggleSidebar, toggleShortcutsModal, switchOrg, currentOrgId, currentOrgName, setSelectedChannel, currentUserId, setSelectedDMUser, openTab, closeTab, activeTabId, openTabs, showQuickStartGuide, setShowQuickStartGuide, dmConversationMap, addToast, isSettingsOpen, toggleSettings, isInviteModalOpen, toggleInviteModal } = useUIStore();
  const { data: channels = [] } = useChannels(currentOrgId || undefined, currentUserId || undefined);
  const { preferences } = usePreferences();
  const currentUser = getCurrentUser();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const updateUserMutation = useUpdateUser();

  const inviteCode = window.location.pathname.startsWith('/join/') ? window.location.pathname.replace('/join/', '') : null;

  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: orgs } = useOrganizations();

  // Initialize store with the user's org
  useEffect(() => {
    if (orgs && orgs.length > 0 && currentUserData) {
      const userOrgId = currentUserData.orgId;
      if (userOrgId) {
        const userOrg = orgs.find((o: any) => o._id === userOrgId) as any;
        if (userOrg) {
          switchOrg(userOrg._id, userOrg.name || userOrg.slug, userOrg.slug, userOrg.code);
          if (currentUserData.role) useUIStore.getState().setCurrentUserRole(currentUserData.role);
          return;
        }
      }
      // Don't auto-assign users without an orgId
      if (currentUserData.orgId === undefined) return;
      const isDefault = currentOrgId === 'o1';
      const stillExists = orgs.some((o: any) => o._id === currentOrgId);
      if (isDefault || !stillExists) {
        const firstOrg = orgs[0] as any;
        if (firstOrg?._id) {
          switchOrg(firstOrg._id, firstOrg.name || firstOrg.slug, firstOrg.slug, firstOrg.code);
        }
      }
    }
  }, [orgs, currentUserData]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId && !selectedDMUserId && activeTabId === null) {
      const firstChannel = channels[0];
      setSelectedChannel(firstChannel._id);
      openTab({ id: firstChannel._id, type: 'channel', name: firstChannel.name });
    }
  }, [channels, selectedChannelId, selectedDMUserId, activeTabId, setSelectedChannel, openTab]);

  useEffect(() => {
    if (isAuthenticated && currentUserData) {
      if (currentUserData.is_new_user && !currentUserData.orgId) {
        setShowOrgSetup(true);
        setShowQuickStartGuide(false);
      } else if (currentUserData.is_new_user) {
        setShowOrgSetup(false);
        setShowQuickStartGuide(true);
      } else {
        setShowOrgSetup(false);
        setShowQuickStartGuide(false);
      }
      if (currentUserData.role) {
        useUIStore.getState().setCurrentUserRole(currentUserData.role);
      }
    }
  }, [isAuthenticated, currentUserData, setShowQuickStartGuide]);

  const handleOrgSetupComplete = () => {
    setShowOrgSetup(false);
    setShowQuickStartGuide(true);
  };

  useSidebarResizer();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickStartClose = () => {
    if (currentUserData?.is_new_user) {
      updateUserMutation.mutate({
        userId: currentUserData._id,
        is_new_user: false,
      });
    }
    setShowQuickStartGuide(false);
  };

  const channel = channels.find((c: any) => c._id === selectedChannelId);
  const activeTab = openTabs.find(t => t.id === activeTabId);
  const activeChannelName = activeTab?.type === 'channel' ? activeTab.name : (activeTab?.type === 'dm' ? `dm/${activeTab.name}` : (activeTab?.type === 'profile' ? `profile/${activeTab.name}` : channel?.name || 'general'));
  const { data: profileUser } = useUser(activeTab?.type === 'profile' ? (activeTab.userId || activeTab.id) : undefined);

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

  if (inviteCode) {
    return <InviteJoin />;
  }

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
              <span className="prompt-host">{currentOrgName}</span>
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
{/* ── Sidebar Toggle ─── */}

      {preferences.sidebarVisible !== false && (
        <div className={`sidebar-host ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
          <ChannelSidebar />
        </div>
      )}

      <div className="main-area">
        <div
          className="sidebar-toggle"
          onClick={() => toggleSidebar()}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={sidebarCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
          </svg>
        </div>

        {/* ── Terminal Title Bar ─── */}
        <div className="terminal-titlebar">
          <div className="titlebar-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="titlebar-title">
            <span className="prompt-path" style={{ fontSize: 12 }}>~{currentUserData?.username || currentUser?.name?.split(' ')[0] || 'user'}</span>
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
            <button className="titlebar-btn" onClick={() => toggleSettings()} title="Settings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

       {/* ── Tabs Section ─── */}
       <TabsBar channels={channels} />

        {/* ── Terminal Body ─── */}
        <div className="terminal-body">
          {activeTab?.type === 'dm' ? (
            <DMPanel />
          ) : activeTab?.type === 'profile' ? (
            <ProfileTabContent
              profileUser={profileUser}
              currentUserId={currentUserId}
              setSelectedDMUser={setSelectedDMUser}
              addToast={addToast}
              onClose={() => closeTab(activeTab?.id || '')}
            />
          ) : (
            <div className="messages-area">
              <MessageList />
              <MessageComposer />
            </div>
          )}
          {selectedThreadId && <ThreadPanel />}
        </div>

        {/* ── Terminal Status Bar ─── */}
        <div className="terminal-statusbar">
          <div className="statusbar-left">
            <span className="status-indicator" />
            <span className="status-text">connected</span>
            <span className="status-sep">|</span>
            <span className="status-text">DevLink v1.0.0</span>
            <span className="status-sep">|</span>
            <span className="status-text status-dim">channels/{activeChannelName}</span>
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
      {isSettingsOpen && <SettingsModal onClose={() => toggleSettings(false)} />}
      {isInviteModalOpen && <InviteModal onClose={() => toggleInviteModal(false)} />}
      {showNotificationSettings && <NotificationSettingsModal onClose={() => setShowNotificationSettings(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showUserProfile && <UserProfileModal userId={showUserProfile} onClose={() => setShowUserProfile(null)} />}
      {showOrgSetup && <OrgSetupModal onComplete={handleOrgSetupComplete} />}
      {showQuickStartGuide && <QuickStartGuide onClose={handleQuickStartClose} />}
      <ToastContainer />
      {openTabs.filter(tab => tab.type !== 'profile').map(tab => {
        const convId = tab.type === 'dm' ? dmConversationMap[tab.id] : tab.id;
        if (!convId) return null;
        return (
          <MessageNotificationWatcher
            key={tab.id}
            tabId={tab.id}
            channelId={convId}
            isActive={tab.id === activeTabId}
            name={tab.name}
            type={tab.type}
          />
        );
      }      )}
    </div>
  );
}

function ProfileTabContent({ profileUser, currentUserId, setSelectedDMUser, addToast, onClose }: any) {
  const connectUserMutation = useConnectUser();
  const { data: allUsers } = useUsers();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const isMe = currentUserId === profileUser?._id;
  const isContact = currentUserData?.contacts?.includes(profileUser?._id);

  const handleMessage = () => {
    setSelectedDMUser(profileUser._id);
  };

  const handleConnect = async () => {
    if (!currentUserId || isMe || !profileUser) return;
    try {
      const res: any = await connectUserMutation.mutateAsync({ senderId: currentUserId, receiverId: profileUser._id });
      addToast({ type: 'success', message: res?.message || `Connected with ${profileUser.name}` });
    } catch {
      addToast({ type: 'error', message: 'Failed to send request' });
    }
  };

  const handleMention = () => {
    const mention = `@${profileUser?.username || profileUser?.name?.toLowerCase().replace(/\s+/g, '')} `;
    navigator.clipboard?.writeText(mention);
    addToast({ type: 'info', message: `Mention copied: ${mention}` });
  };

  if (!profileUser) return (
    <div className="messages-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ fontSize: 12, color: 'var(--fg-dim)' }}>loading profile...</div>
    </div>
  );

  const statusColors: Record<string, string> = {
    online: 'var(--green)', away: 'var(--yellow)', busy: 'var(--red)',
    dnd: 'var(--red)', offline: 'var(--fg-dim)',
  };

  return (
    <div className="messages-area" style={{ overflow: 'auto' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24, padding: 24, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <Avatar name={profileUser.name} size="xl" status={profileUser.status as any} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{profileUser.name}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>@{profileUser.username}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[profileUser.status || 'offline'] }} />
              <span style={{ fontSize: 12, color: statusColors[profileUser.status || 'offline'], textTransform: 'capitalize' }}>{profileUser.status || 'offline'}</span>
              {profileUser.role && (
                <>
                  <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>|</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{profileUser.role}</span>
                </>
              )}
            </div>
            {profileUser.statusMessage && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-muted)', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: 8 }}>
                "{profileUser.statusMessage}"
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="terminal-block" style={{ marginBottom: 24 }}>
          <div className="terminal-line"><span className="prompt-symbol">$</span><span style={{ color: 'var(--fg-muted)' }}> name: </span><span style={{ color: 'var(--cyan)' }}>{profileUser.name}</span></div>
          <div className="terminal-line"><span className="prompt-symbol">$</span><span style={{ color: 'var(--fg-muted)' }}> email: </span><span style={{ color: 'var(--fg)' }}>{profileUser.email}</span></div>
          <div className="terminal-line"><span className="prompt-symbol">$</span><span style={{ color: 'var(--fg-muted)' }}> user_id: </span><span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>{profileUser._id}</span></div>
          {profileUser.role && (
            <div className="terminal-line"><span className="prompt-symbol">$</span><span style={{ color: 'var(--fg-muted)' }}> role: </span><span style={{ color: 'var(--yellow)' }}>{profileUser.role}</span></div>
          )}
          {profileUser.createdAt && (
            <div className="terminal-line"><span className="prompt-symbol">$</span><span style={{ color: 'var(--fg-muted)' }}> member_since: </span><span style={{ color: 'var(--fg)' }}>{format(new Date(profileUser.createdAt), 'MMM d, yyyy')}</span></div>
          )}
        </div>

        {/* Actions */}
        {!isMe && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMessage}>
              <MessageSquare size={14} />
              message
            </button>
            <button
              className={`btn ${isContact ? 'btn-ghost' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={handleConnect}
              disabled={isContact || connectUserMutation.isPending}
            >
              {isContact ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {isContact ? 'connected' : 'connect'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleMention}>
              <AtSign size={14} />
              mention
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
