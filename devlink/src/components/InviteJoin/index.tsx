import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useOrganizationByCode, useUpdateUser } from '@/hooks/useData';
import { LoginModal } from '@/components/LoginModal';

export function InviteJoin() {
  const code = window.location.pathname.replace('/join/', '');
  const { data: org, isLoading } = useOrganizationByCode(code || undefined);
  const isAuthenticated = useUIStore((s) => s.isAuthenticated);
  const currentUserId = useUIStore((s) => s.currentUserId);
  const switchOrg = useUIStore((s) => s.switchOrg);
  const setCurrentUserRole = useUIStore((s) => s.setCurrentUserRole);
  const addToast = useUIStore((s) => s.addToast);
  const updateUserMutation = useUpdateUser();
  const [showLogin, setShowLogin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!org || !currentUserId) return;
    setJoining(true);
    setError('');
    try {
      await updateUserMutation.mutateAsync({
        userId: currentUserId,
        orgId: org._id,
        role: 'member',
      });
      switchOrg(org._id, org.name, org.slug, org.code);
      setCurrentUserRole('member');
      addToast({ type: 'success', message: `Joined ${org.name}` });
      window.history.replaceState(null, '', '/');
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 380, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--fg-dim)' }}>Looking up organization...</div>
        </div>
      </div>
    );
  }

  if (!code) {
    return null;
  }

  if (!org) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 380, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Invalid invite</div>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginBottom: 16 }}>
            No organization found with code "{code}"
          </div>
          <button className="btn btn-primary" onClick={() => { window.location.href = '/'; }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Join {org.name}</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>
                Log in to join this organization.
              </div>
              <button className="btn btn-primary" onClick={() => setShowLogin(true)} style={{ width: '100%' }}>
                Log In
              </button>
            </div>
          </div>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h3>Join Organization</h3>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{org.name}</div>
          {org.code && <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: 12 }}>{org.code}</div>}
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginBottom: 16 }}>
            You've been invited to join this organization.
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" onClick={handleJoin} disabled={joining} style={{ width: '100%' }}>
            {joining ? 'Joining...' : 'Accept Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}