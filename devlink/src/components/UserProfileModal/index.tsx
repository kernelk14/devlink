import { useUIStore } from '@/lib/store';
import { X, MessageSquare, Hash, UserPlus, UserCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useUser, useConnectUser } from '@/hooks/useData';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { setSelectedDMUser, addToast, currentUserId } = useUIStore();
  const { data: convexUser } = useUser(userId);
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const connectUserMutation = useConnectUser();

  const isContact = currentUserData?.contacts?.includes(userId);
  const isMe = currentUserId === userId;

  const handleConnect = async () => {
    if (!currentUserId || isMe) return;
    try {
      const res: any = await connectUserMutation.mutateAsync({ senderId: currentUserId, receiverId: userId });
      if (res.success) {
        addToast({ type: 'success', message: `Request sent to ${user.name}` });
      } else {
        addToast({ type: 'info', message: res.message });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to send request' });
    }
  };
  
  const user = convexUser ? {
    id: convexUser._id,
    name: (convexUser as any).name || (convexUser as any).email?.split('@')[0] || 'User',
    username: (convexUser as any).email?.split('@')[0] || 'user',
    email: (convexUser as any).email || 'user@example.com',
    status: convexUser.status || 'offline',
    statusMessage: convexUser.statusMessage,
  } : {
    id: userId,
    name: 'User',
    username: 'user',
    email: 'user@example.com',
    status: 'offline' as const,
    statusMessage: undefined,
  };

  const handleMessage = () => {
    setSelectedDMUser(userId);
    addToast({ type: 'info', message: `Opening DM with ${user.name}` });
    onClose();
  };

  const handleMention = () => {
    const mention = `@${user.username || user.name.toLowerCase().replace(/\s+/g, '')} `;
    addToast({ type: 'info', message: `Mention copied: ${mention}` });
    onClose();
  };

  const statusColors: Record<string, string> = {
    online: 'var(--green)',
    away: 'var(--yellow)',
    busy: 'var(--red)',
    dnd: 'var(--red)',
    offline: 'var(--fg-dim)',
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 380 }}>
        <div className="popup-header">
          <div className="popup-title">
            <span className="prompt-symbol">$</span>
            <span style={{ color: 'var(--fg-muted)' }}>user.info --id</span>
            <span style={{ color: 'var(--cyan)' }}>{userId}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popup-body" style={{ padding: 0 }}>
          <div style={{ background: 'var(--bg-elevated)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <Avatar name={user.name} size="xl" status={user.status as any} />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--fg)' }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>@{user.username || user.name.toLowerCase().replace(/\s+/g, '')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[user.status || 'offline'] }} />
                <span style={{ fontSize: 12, color: statusColors[user.status || 'offline'], textTransform: 'capitalize' }}>{user.status || 'offline'}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="terminal-block" style={{ marginBottom: 16 }}>
              <div className="terminal-line">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> name: </span>
                <span style={{ color: 'var(--cyan)' }}>{user.name}</span>
              </div>
              <div className="terminal-line">
                <span className="prompt-symbol">$</span>
                <span style={{ color: 'var(--fg-muted)' }}> email: </span>
                <span style={{ color: 'var(--fg)' }}>{user.email}</span>
              </div>
              {user.statusMessage && (
                <div className="terminal-line">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> status: </span>
                  <span style={{ color: 'var(--yellow)' }}>"{user.statusMessage}"</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMessage}>
                <MessageSquare size={14} />
                message
              </button>
              {!isMe && (
                <button 
                  className={`btn ${isContact ? 'btn-ghost' : 'btn-secondary'}`} 
                  style={{ flex: 1 }} 
                  onClick={handleConnect}
                  disabled={isContact || connectUserMutation.isPending}
                >
                  {isContact ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  {isContact ? 'connected' : 'connect'}
                </button>
              )}
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleMention}>
                <Hash size={14} />
                mention
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}