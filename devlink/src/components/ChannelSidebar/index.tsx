import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels, useUsers, useUser, usePendingRequests, useMyDMs } from '@/hooks/useData';
import { ChevronDown, Plus, Settings, Users, Hash, Lock, Star, Search, Bell } from 'lucide-react';
import { CreateChannelModal } from '@/components/CreateChannelModal';
import { PeopleModal } from '@/components/PeopleModal';
import { NotificationsModal } from '@/components/NotificationsModal';

export function ChannelSidebar() {
  const { selectedChannelId, setSelectedChannel, starredChannels, toggleStarredChannel, setSelectedDMUser, currentOrgId, currentUserId, openTab } = useUIStore();
  const { data: channels = [], isLoading, isError } = useChannels(currentOrgId || undefined, currentUserId || undefined);
  const { data: allUsers = [] } = useUsers();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const { data: pendingRequests = [] } = usePendingRequests(currentUserId || undefined);
  const { data: myDMs = [] } = useMyDMs(currentUserId || undefined, currentOrgId || undefined);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const currentUser = currentUserData || getCurrentUser();

  const sortedChannels = [...channels].sort((a, b) => {
    const idA = a._id || a.id;
    const idB = b._id || b.id;
    const aStarred = starredChannels.includes(idA);
    const bStarred = starredChannels.includes(idB);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return a.name.localeCompare(b.name);
  });

  // Get user IDs who have DM conversations with the current user
  const connectedUserIds = new Set(
    myDMs.flatMap(dm => dm.participantIds.filter(id => id !== currentUserId))
  );

  const contactIds = new Set(currentUserData?.contacts || []);
  const connectionUsers = allUsers.filter(u =>
    u.id !== currentUserId && contactIds.has(u.id)
  );

  const dmUsers = allUsers.filter(u =>
    u.id !== currentUserId && connectedUserIds.has(u.id)
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
            const channelId = channel._id || channel.id;
            if (!channelId) return null; // Skip channels without ID
            
            const isActive = selectedChannelId === channelId;
            const isStarred = starredChannels.includes(channelId);
            return (
              <div
                key={channelId}
                className={`channel-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedChannel(channelId);
                  openTab({ id: channelId, type: 'channel', name: channel.name || 'unknown' });
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedChannel(channelId);
                    openTab({ id: channelId, type: 'channel', name: channel.name || 'unknown' });
                  }
                }}
              >
                <span className="ch-icon">{channel.type === 'private' ? '🔒' : '#'}</span>
                <span className="ch-name">{channel.name || 'unknown'}</span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="ch-unread">{channel.unreadCount}</span>
                )}
                <button
                  className={`ch-star ${isStarred ? 'starred' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleStarredChannel(channelId); }}
                >
                  {isStarred ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connections section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="section-label">// connections</span>
          <button className="section-btn" onClick={() => setShowPeopleModal(true)} title="New connection">
            <Users size={10} />
          </button>
        </div>
        <div className="channel-list">
          {connectionUsers.length > 0 ? connectionUsers.map((user: any) => {
            const userId = user._id || user.id;
            if (!userId || userId === currentUserId) return null;
            
            const statusColor = user.status === 'online' ? 'var(--green)' : user.status === 'away' ? 'var(--yellow)' : 'var(--fg-dim)';
            return (
              <div
                key={userId}
                className="channel-item"
                onClick={() => {
                  setSelectedDMUser(userId);
                  openTab({ id: userId, type: 'dm', name: user.name || 'Unknown' });
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedDMUser(userId);
                    openTab({ id: userId, type: 'dm', name: user.name || 'Unknown' });
                  }
                }}
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
                      {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                <span className="ch-name">{user.name || 'Unknown'}</span>
              </div>
            );
          }) : (
            <div className="channel-item channel-empty">No connections yet</div>
          )}
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
            const userId = user._id || user.id;
            if (!userId || userId === currentUserId) return null;
            
            const statusColor = user.status === 'online' ? 'var(--green)' : user.status === 'away' ? 'var(--yellow)' : 'var(--fg-dim)';
            return (
              <div
                key={userId}
                className="channel-item"
                onClick={() => {
                  setSelectedDMUser(userId);
                  openTab({ id: userId, type: 'dm', name: user.name || 'Unknown' });
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedDMUser(userId);
                    openTab({ id: userId, type: 'dm', name: user.name || 'Unknown' });
                  }
                }}
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
                      {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                <span className="ch-name">{user.name || 'Unknown'}</span>
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
