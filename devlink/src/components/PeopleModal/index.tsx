import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useUsers, useUser, useConnectUser } from '@/hooks/useData';
import { X, Search, UserPlus, UserCheck, MessageSquare, Terminal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface PeopleModalProps {
  onClose: () => void;
}

export function PeopleModal({ onClose }: PeopleModalProps) {
  const [query, setQuery] = useState('');
  const { currentUserId, setSelectedDMUser, addToast } = useUIStore();
  const { data: users = [] } = useUsers();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const connectUserMutation = useConnectUser();

  const filteredUsers = users.filter(u => {
    if (u._id === currentUserId) return false;
    const searchStr = (u.name + u.email + u.username).toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  const handleConnect = async (userId: string, name: string) => {
    if (!currentUserId) return;
    try {
      const res: any = await connectUserMutation.mutateAsync({ senderId: currentUserId, receiverId: userId });
      if (res.success) {
        addToast({ type: 'success', message: `Request sent to ${name}` });
      } else {
        addToast({ type: 'info', message: res.message });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to send request' });
    }
  };

  const handleMessage = (userId: string) => {
    setSelectedDMUser(userId);
    onClose();
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="popup-header">
          <div className="popup-title">
            <Terminal size={16} style={{ color: 'var(--cyan)' }} />
            <span>directory</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// find people</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-dim)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 12px 8px 36px',
                color: 'var(--fg)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>
              <span className="prompt-symbol">$</span>
              <span> No users found</span>
            </div>
          ) : (
            filteredUsers.map((user: any) => {
              const isContact = currentUserData?.contacts?.includes(user._id);
              return (
                <div key={user._id} className="search-result" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={user.name} size="md" status={user.status} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      title="Send Message"
                      onClick={() => handleMessage(user._id)}
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button 
                      className={`btn btn-icon ${isContact ? 'btn-ghost' : 'btn-secondary'}`}
                      title={isContact ? 'Connected' : 'Connect'}
                      onClick={() => handleConnect(user._id, user.name)}
                      disabled={isContact || connectUserMutation.isPending}
                    >
                      {isContact ? <UserCheck size={14} style={{ color: 'var(--green)' }} /> : <UserPlus size={14} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="popup-footer">
          <span className="prompt-comment" style={{ fontSize: 11 }}>Total members: {users.length}</span>
        </div>
      </div>
    </div>
  );
}
