import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels, useUsers } from '@/lib/hooks';
import { ChevronDown, Plus, Settings, Users, Hash, Lock, Star } from 'lucide-react';
import { CreateChannelModal } from '@/components/CreateChannelModal';

export function ChannelSidebar() {
  const { selectedChannelId, setSelectedChannel, starredChannels, toggleStarredChannel, setSelectedDMUser, currentOrgId } = useUIStore();
  const currentUser = getCurrentUser();
  const { channels, isLoading, isError } = useChannels();
  const { users } = useUsers();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  
  // Debug logging
  console.log('[ChannelSidebar] orgId:', currentOrgId, 'channels:', channels, 'loading:', isLoading, 'error:', isError);

  const sortedChannels = [...channels].sort((a, b) => {
    const aStarred = starredChannels.includes(a.id);
    const bStarred = starredChannels.includes(b.id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return a.name.localeCompare(b.name);
  });

  const dmUsers = users.filter(u => u.id !== currentUser.id);

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
          {sortedChannels.map((channel) => {
            const isActive = selectedChannelId === channel.id;
            const isStarred = starredChannels.includes(channel.id);
            return (
              <div
                key={channel.id}
                className={`channel-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedChannel(channel.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedChannel(channel.id)}
              >
                <span className="ch-icon">{channel.type === 'private' ? '🔒' : '#'}</span>
                <span className="ch-name">{channel.name}</span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="ch-unread">{channel.unreadCount}</span>
                )}
                <button
                  className={`ch-star ${isStarred ? 'starred' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleStarredChannel(channel.id); }}
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
          <button className="section-btn" title="New DM">
            <Plus size={10} />
          </button>
        </div>
        <div className="channel-list">
          {dmUsers.map((user) => {
            const statusColor = user.status === 'online' ? 'var(--green)' : user.status === 'away' ? 'var(--yellow)' : 'var(--fg-dim)';
            return (
              <div
                key={user.id}
                className="channel-item"
                onClick={() => setSelectedDMUser(user.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedDMUser(user.id)}
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
                      {user.name.split(' ').map(n => n[0]).join('')}
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
        <button className="sidebar-settings-btn" onClick={() => {}} title="Settings">
          <Settings size={12} />
        </button>
      </div>

      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}
    </div>
  );
}
