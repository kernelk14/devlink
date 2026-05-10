import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels, useUsers, useUser, usePendingRequests } from '@/hooks/useData';
import { ChevronDown, Plus, Settings, Users, Hash, Lock, Star, Search, Bell } from 'lucide-react';
import { CreateChannelModal } from '@/components/CreateChannelModal';
import { PeopleModal } from '@/components/PeopleModal';
import { NotificationsModal } from '@/components/NotificationsModal';

export function ChannelSidebar() {
  const { selectedChannelId, setSelectedChannel, starredChannels, toggleStarredChannel, setSelectedDMUser, currentOrgId, currentUserId } = useUIStore();
  const { data: channels = [], isLoading, isError } = useChannels(currentOrgId || undefined, currentUserId || undefined);
  const { data: allUsers = [] } = useUsers();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const { data: pendingRequests = [] } = usePendingRequests(currentUserId || undefined);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const currentUser = currentUserData || getCurrentUser();

  const sortedChannels = [...channels].sort((a, b) => {
    const idA = (a as any)._id;
    const idB = (b as any)._id;
    const aStarred = starredChannels.includes(idA);
    const bStarred = starredChannels.includes(idB);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return a.name.localeCompare(b.name);
  });

  const dmUsers = allUsers.filter(u => 
    u._id !== currentUserId && 
    (currentUserData as any)?.contacts?.includes(u._id)
  );

  return (
    <div className="sidebar">
      {/* Sidebar title bar */}
      <div className="sidebar-titlebar">
        <div className="stb-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="stb-title">
          <span style={{ color: 'var(--fg-dim)' }}>#</span>
          <span style={{ fontSize: 12 }}>devlink</span>
        </div>
        <button className="stb-btn" title="Workspace options">
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Terminal prompt line */}
      <div className="sidebar-prompt-line">
        <span className="prompt-user" style={{ fontSize: 11 }}>{currentUser?.name?.split(' ')[0] || 'user'}</span>
        <span style={{ color: 'var(--fg-dim)' }}>@devlink:~$</span>
        <span style={{ color: 'var(--cyan)', fontSize: 11 }}> ls --channels</span>
      </div>

      {/* Channels section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="section-label">// channels</span>
          <button className="section-btn" onClick={() => setShowCreateChannel(true)} title="Create channel">
            <Plus size={10} />
          </button>
        </div>
        <div className="channel-list">
          {sortedChannels.map((channel: any) => {
            const isActive = selectedChannelId === channel._id;
            const isStarred = starredChannels.includes(channel._id);
            return (
              <div
                key={channel._id}
                className={`channel-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedChannel(channel._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedChannel(channel._id)}
              >
                <span className="ch-icon">{channel.type === 'private' ? '🔒' : '#'}</span>
                <span className="ch-name">{channel.name}</span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="ch-unread">{channel.unreadCount}</span>
                )}
                <button
                  className={`ch-star ${isStarred ? 'starred' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleStarredChannel(channel._id); }}
                >
                  {isStarred ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* DMs section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="section-label">// direct messages</span>
          <button className="section-btn" onClick={() => setShowPeopleModal(true)} title="New DM">
            <Plus size={10} />
          </button>
        </div>
        <div className="channel-list">
          {dmUsers.map((user: any) => {
            const statusColor = user.status === 'online' ? 'var(--green)' : user.status === 'away' ? 'var(--yellow)' : 'var(--fg-dim)';
            return (
              <div
                key={user._id}
                className="channel-item"
                onClick={() => setSelectedDMUser(user._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedDMUser(user._id)}
              >
                <span className="ch-icon">
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'var(--purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                    <span style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: statusColor,
                      border: '1px solid var(--bg-panel)',
                    }} />
                  </span>
                </span>
                <span className="ch-name">{user.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="user-avatar">
          <span className="user-initial">{currentUser?.name?.charAt(0) || 'U'}</span>
          <span className="user-status online" />
        </div>
        <div className="user-info">
          <div className="user-name">{currentUser?.name || 'User'}</div>
          <div className="user-status-line">
            <span style={{ color: 'var(--green)' }}>●</span>
            <span style={{ color: 'var(--fg-dim)', fontSize: 10 }}>online</span>
          </div>
        </div>
        <button 
          className="sidebar-settings-btn" 
          onClick={() => setShowNotifications(true)} 
          title="Notifications"
          style={{ position: 'relative', marginRight: 4 }}
        >
          <Bell size={12} />
          {pendingRequests.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              background: 'var(--red)',
              borderRadius: '50%',
              border: '1px solid var(--bg-panel)'
            }} />
          )}
        </button>
        <button className="sidebar-settings-btn" onClick={() => {}} title="Settings">
          <Settings size={12} />
        </button>
      </div>

      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}
      {showPeopleModal && (
        <PeopleModal onClose={() => setShowPeopleModal(false)} />
      )}
      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
