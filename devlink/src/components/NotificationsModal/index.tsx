import { useUIStore } from '@/lib/store';
import { useUsers, usePendingRequests, useAcceptRequest, useRejectRequest } from '@/hooks/useData';
import { X, Check, XCircle, User, Terminal, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface NotificationsModalProps {
  onClose: () => void;
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { currentUserId, addToast } = useUIStore();
  const { data: requests = [] } = usePendingRequests(currentUserId || undefined);
  const { data: allUsers = [] } = useUsers();
  
  const acceptMutation = useAcceptRequest();
  const rejectMutation = useRejectRequest();

  const handleAccept = async (requestId: string, senderName: string) => {
    try {
      await acceptMutation.mutateAsync(requestId);
      addToast({ type: 'success', message: `Connected with ${senderName}!` });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to accept request' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectMutation.mutateAsync(requestId);
      addToast({ type: 'info', message: 'Request rejected' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to reject request' });
    }
  };

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-panel" style={{ width: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div className="popup-header">
          <div className="popup-title">
            <Bell size={16} style={{ color: 'var(--yellow)' }} />
            <span>notifications</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// inbox</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {requests.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>
              <div style={{ marginBottom: 12 }}>
                <Bell size={32} style={{ opacity: 0.2 }} />
              </div>
              <span className="prompt-symbol">$</span>
              <span> All caught up! No pending requests.</span>
            </div>
          ) : (
            requests.map((req: any) => {
              const sender = allUsers.find(u => u._id === req.senderId);
              return (
                <div key={req._id} className="notification-item" style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <Avatar name={sender?.name || 'User'} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--fg)' }}>
                      <strong style={{ color: 'var(--cyan)' }}>{sender?.name}</strong> wants to connect
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-primary btn-icon" 
                      onClick={() => handleAccept(req._id, sender?.name || 'User')}
                      disabled={acceptMutation.isPending}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={() => handleReject(req._id)}
                      disabled={rejectMutation.isPending}
                      style={{ color: 'var(--red)' }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="popup-footer" style={{ justifyContent: 'center' }}>
          <span className="prompt-comment" style={{ fontSize: 11 }}>You have {requests.length} pending requests</span>
        </div>
      </div>
    </div>
  );
}
