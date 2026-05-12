import { useState, useMemo } from 'react';
import { useUIStore } from '@/lib/store';
import { useCreateOrganization, useUpdateUser, useOrganizations } from '@/hooks/useData';
import { Check } from 'lucide-react';

interface OrgSetupModalProps {
  onComplete: () => void;
}

export function OrgSetupModal({ onComplete }: OrgSetupModalProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const currentUserId = useUIStore((s) => s.currentUserId);
  const switchOrg = useUIStore((s) => s.switchOrg);

  // Create
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const createOrgMutation = useCreateOrganization();
  const updateUserMutation = useUpdateUser();

  // Join
  const [joinQuery, setJoinQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');
  const { data: orgs = [] } = useOrganizations();

  const filteredOrgs = useMemo(() => {
    if (!joinQuery.trim()) return orgs.slice(0, 5);
    const q = joinQuery.toLowerCase();
    return orgs.filter((o: any) =>
      o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [joinQuery, orgs]);

  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!orgName.trim() || !currentUserId) return;
    setSubmitting(true);
    try {
      const slug = orgSlug.trim() || orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const org: any = await createOrgMutation.mutateAsync({ name: orgName.trim(), slug, creatorId: currentUserId });
      await updateUserMutation.mutateAsync({
        userId: currentUserId,
        orgId: org._id,
        role: 'owner',
      });
      switchOrg(org._id, org.name);
      onComplete();
    } catch (err: any) {
      console.error('Failed to create org:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedOrgId || !currentUserId) return;
    setJoinError('');
    setSubmitting(true);
    try {
      await updateUserMutation.mutateAsync({
        userId: currentUserId,
        orgId: selectedOrgId,
        role: 'member',
      });
      const org = (orgs as any[]).find((o: any) => o._id === selectedOrgId);
      switchOrg(selectedOrgId, org?.name);
      onComplete();
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join organization');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'create') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <h3>Create Organization</h3>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Name</label>
              <input
                className="oc-input"
                type="text"
                placeholder="e.g. Acme Corp"
                value={orgName}
                onChange={e => {
                  setOrgName(e.target.value);
                  if (!orgSlug || orgSlug === orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
                    setOrgSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }
                }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Slug</label>
              <input
                className="oc-input"
                type="text"
                placeholder="e.g. acme-corp"
                value={orgSlug}
                onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setMode('select')} disabled={submitting}>Back</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!orgName.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <h3>Join Organization</h3>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>
                Search organizations
              </label>
              <input
                className="oc-input"
                type="text"
                placeholder="Type name or slug..."
                value={joinQuery}
                onChange={e => {
                  setJoinQuery(e.target.value);
                  setSelectedOrgId(null);
                  setJoinError('');
                }}
                autoFocus
              />
              {joinQuery && filteredOrgs.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  zIndex: 10,
                  maxHeight: 240,
                  overflow: 'auto',
                }}>
                  {filteredOrgs.map((o: any) => (
                    <div
                      key={o._id}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        background: selectedOrgId === o._id ? 'var(--bg-hover)' : 'transparent',
                      }}
                      onClick={() => {
                        setSelectedOrgId(o._id);
                        setJoinQuery(o.name);
                        setJoinError('');
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <span style={{ fontWeight: 500 }}>{o.name}</span>
                      <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>@{o.slug}</span>
                      {selectedOrgId === o._id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                    </div>
                  ))}
                </div>
              )}
              {joinQuery && filteredOrgs.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 6 }}>
                  No organizations found matching "{joinQuery}"
                </div>
              )}
            </div>
            {joinError && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>{joinError}</div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setMode('select')} disabled={submitting}>Back</button>
            <button className="btn btn-primary" onClick={handleJoin} disabled={!selectedOrgId || submitting}>
              {submitting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>Welcome to DevLink</h3>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 8 }}>
            To get started, you need to be part of an organization. You can create a new one or join an existing one.
          </div>
          {orgs.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginBottom: 4 }}>
              {orgs.length} organization{orgs.length !== 1 ? 's' : ''} available on this server
            </div>
          )}
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMode('create')}>
            <span style={{ marginRight: 8 }}>+</span> Create Organization
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setMode('join')}>
            Join Existing Organization
          </button>
        </div>
      </div>
    </div>
  );
}
