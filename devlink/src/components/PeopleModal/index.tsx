import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useUsers, useUser, useConnectUser, useRemoveOrgMember } from '@/hooks/useData';
import { X, Search, UserPlus, UserCheck, MessageSquare, Terminal, UserX } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface PeopleModalProps {
  onClose: () => void;
}

export function PeopleModal({ onClose }: PeopleModalProps) {
  const [query, setQuery] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { currentUserId, currentOrgId, currentUserRole, setSelectedDMUser, addToast } = useUIStore();
  const { data: users = [] } = useUsers();
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const connectUserMutation = useConnectUser();
  const removeMemberMutation = useRemoveOrgMember();

  const orgMembers = users.filter(u => {
    return u.orgId && currentOrgId && u.orgId === currentOrgId;
  });

  const filteredUsers = orgMembers.filter(u => {
    const searchStr = (u.name + u.email + u.username).toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

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

  const handleRemove = async (targetUserId: string) => {
    if (!currentUserId || !currentOrgId) return;
    try {
      await removeMemberMutation.mutateAsync({
        adminId: currentUserId,
        targetUserId,
        orgId: currentOrgId,
      });
      addToast({ type: 'success', message: 'Member removed' });
      setConfirmRemove(null);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to remove member' });
    }
  };

  const roleColor = (role?: string) => {
    switch (role) {
      case 'owner': return 'var(--yellow)';
      case 'admin': return 'var(--cyan)';
      default: return 'var(--fg-dim)';
    }
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="popup-header">
          <div className="popup-title">
            <Terminal size={16} style={{ color: 'var(--cyan)' }} />
            <span>members</span>
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
              const isMe = user._id === currentUserId;
              const isContact = currentUserData?.contacts?.includes(user._id);
              const canRemove = isAdmin && !isMe && user.role !== 'owner';
              return (
                <div key={user._id} className="search-result" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={user.name} size="md" status={user.status} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user.name}
                      {isMe && <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>(you)</span>}
                      {user.role && (
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: roleColor(user.role), opacity: 0.8 }}>{user.role}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {confirmRemove === user._id ? (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(user._id)} style={{ fontSize: 11, padding: '4px 8px' }}>
                          Confirm
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRemove(null)} style={{ fontSize: 11, padding: '4px 8px' }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!isMe && (
                          <button 
                            className="btn btn-ghost btn-icon" 
                            title="Send Message"
                            onClick={() => handleMessage(user._id)}
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                        {!isMe && (
                          <button 
                            className={`btn btn-icon ${isContact ? 'btn-ghost' : 'btn-secondary'}`}
                            title={isContact ? 'Connected' : 'Connect'}
                            onClick={() => handleConnect(user._id, user.name)}
                            disabled={isContact || connectUserMutation.isPending}
                          >
                            {isContact ? <UserCheck size={14} style={{ color: 'var(--green)' }} /> : <UserPlus size={14} />}
                          </button>
                        )}
                        {canRemove && (
                          <button 
                            className="btn btn-ghost btn-icon" 
                            title="Remove from organization"
                            onClick={() => setConfirmRemove(user._id)}
                            style={{ color: 'var(--red)', opacity: 0.6 }}
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="popup-footer">
          <span className="prompt-comment" style={{ fontSize: 11 }}>Total members: {orgMembers.length}</span>
        </div>
      </div>
    </div>
  );
}