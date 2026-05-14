import { useState, useMemo } from 'react';
import { useUIStore } from '@/lib/store';
import { useCreateOrganization, useUpdateUser, useOrganizations, useCreateChannel } from '@/hooks/useData';
import { Check } from 'lucide-react';

interface OrgSetupModalProps {
  onComplete: () => void;
}

export function OrgSetupModal({ onComplete }: OrgSetupModalProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const currentUserId = useUIStore((s) => s.currentUserId);
  const switchOrg = useUIStore((s) => s.switchOrg);
  const setCurrentUserRole = useUIStore((s) => s.setCurrentUserRole);
  const addToast = useUIStore((s) => s.addToast);

// Create
   const [orgName, setOrgName] = useState('');
   const [orgSlug, setOrgSlug] = useState('');
   const [orgCode, setOrgCode] = useState('');
   const [orgDescription, setOrgDescription] = useState('');
   const [orgWebsite, setOrgWebsite] = useState('');
   const [orgTags, setOrgTags] = useState('');
   const [isPublic, setIsPublic] = useState(true);
   const createOrgMutation = useCreateOrganization();
   const createChannelMutation = useCreateChannel();
   const updateUserMutation = useUpdateUser();

  // Join
  const [joinMode, setJoinMode] = useState<'browse' | 'code'>('browse');
  const [joinQuery, setJoinQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');
  const { data: orgs = [] } = useOrganizations();

  const publicOrgs = useMemo(() =>
    orgs.filter((o: any) => o.visibility !== 'private'),
  [orgs]);

  const filteredOrgs = useMemo(() => {
    if (!joinQuery.trim()) return publicOrgs.slice(0, 5);
    const q = joinQuery.toLowerCase();
    return publicOrgs.filter((o: any) =>
      o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [joinQuery, publicOrgs]);

  const [submitting, setSubmitting] = useState(false);

   const handleCreate = async () => {
     if (!orgName.trim() || !currentUserId) return;
     setSubmitting(true);
     try {
       const slug = orgSlug.trim() || orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
       const genCode = () => {
         const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
         const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
         return `${rand(4)}-${rand(3)}-${rand(4)}`;
       };
       const code = orgCode.trim().toUpperCase() || genCode();
       const tagsArray = orgTags
         .split(',')
         .map((tag) => tag.trim())
         .filter((tag) => tag.length > 0);
       const org: any = await createOrgMutation.mutateAsync({ 
         name: orgName.trim(), 
         slug, 
         code, 
         visibility: isPublic ? 'public' : 'private',
         description: orgDescription.trim(),
         website: orgWebsite.trim(),
         tags: tagsArray,
         creatorId: currentUserId 
       });
       
       // Create default channels
       const defaultChannels = ['general', 'random', 'announcements'];
       for (const channelName of defaultChannels) {
         try {
           await createChannelMutation.mutateAsync({
             name: channelName,
             type: channelName === 'announcements' ? 'announcement' : 'public',
             description: channelName === 'announcements' 
               ? 'Important announcements from the organization' 
               : channelName === 'random'
                 ? 'Random conversations and fun stuff'
                 : 'Main chat for organization members',
             orgId: org._id,
             createdBy: currentUserId
           });
         } catch (channelErr) {
           console.error(`Failed to create ${channelName} channel:`, channelErr);
           // Continue with other channels even if one fails
         }
       }
       
       await updateUserMutation.mutateAsync({
         userId: currentUserId,
         orgId: org._id,
         role: 'owner',
       });
       switchOrg(org._id, org.name, slug, code);
       setCurrentUserRole('owner');
       addToast({ type: 'success', message: `Created organization ${org.name} with default channels` });
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
      switchOrg(selectedOrgId, org?.name, org?.slug, org?.code);
      setCurrentUserRole('member');
      onComplete();
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || !currentUserId) return;
    setJoinError('');
    setSubmitting(true);
    try {
      const org = (orgs as any[]).find((o: any) => o.code?.toUpperCase() === joinCode.trim().toUpperCase());
      if (!org) {
        setJoinError('No organization found with that code');
        setSubmitting(false);
        return;
      }
      await updateUserMutation.mutateAsync({
        userId: currentUserId,
        orgId: org._id,
        role: 'member',
      });
      switchOrg(org._id, org.name, org.slug, org.code);
      setCurrentUserRole('member');
      addToast({ type: 'success', message: `Joined ${org.name}` });
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
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Code</label>
              <input
                className="oc-input"
                type="text"
                placeholder="e.g. A3B2-C7D1-E9F4 (auto-generated if empty)"
                value={orgCode}
                onChange={e => setOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              />
              <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>Format: XXXX-XXX-XXXX — used for quick searching</div>
            </div>
             <div>
               <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Visibility</label>
               <div
                 onClick={() => setIsPublic(!isPublic)}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: 8,
                   cursor: 'pointer',
                   padding: '6px 10px',
                   background: 'var(--bg)',
                   border: '1px solid var(--border)',
                   borderRadius: 4,
                   fontSize: 13,
                 }}
               >
                 <div style={{
                   width: 36,
                   height: 20,
                   borderRadius: 10,
                   background: isPublic ? 'var(--green)' : 'var(--fg-dim)',
                   position: 'relative',
                   transition: 'background 150ms',
                   flexShrink: 0,
                 }}>
                   <div style={{
                     width: 16,
                     height: 16,
                     borderRadius: '50%',
                     background: '#fff',
                     position: 'absolute',
                     top: 2,
                     left: isPublic ? 18 : 2,
                     transition: 'left 150ms',
                   }} />
                 </div>
                 <span>{isPublic ? 'Public' : 'Private'}</span>
                 <span style={{ color: 'var(--fg-dim)', fontSize: 11, marginLeft: 'auto' }}>
                   {isPublic ? 'Anyone can find and join' : 'By invite only'}
                 </span>
               </div>
             </div>
             <div>
               <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Description</label>
               <textarea
                 className="oc-input"
                 placeholder="Tell people what this organization is about..."
                 value={orgDescription}
                 onChange={e => setOrgDescription(e.target.value)}
                 rows={3}
               />
             </div>
             <div>
               <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Website URL</label>
               <input
                 className="oc-input"
                 type="text"
                 placeholder="https://example.com"
                 value={orgWebsite}
                 onChange={e => {
                   const value = e.target.value;
                   // Auto-add https:// if not present and not empty
                   if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                     setOrgWebsite(`https://${value}`);
                   } else {
                     setOrgWebsite(value);
                   }
                 }}
               />
               {orgWebsite && !orgWebsite.startsWith('http://') && !orgWebsite.startsWith('https://') && (
                 <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 2 }}>
                   Note: Will be prefixed with https://
                 </div>
               )}
             </div>
             <div>
               <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Tags (comma-separated)</label>
               <input
                 className="oc-input"
                 type="text"
                 placeholder="e.g. startup, technology, team"
                 value={orgTags}
                 onChange={e => setOrgTags(e.target.value)}
               />
               <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>
                 Use commas to separate tags (e.g. "tech, startup, remote")
               </div>
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
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              className={`btn ${joinMode === 'browse' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 0, fontSize: 12 }}
              onClick={() => { setJoinMode('browse'); setJoinError(''); }}
            >
              Browse Public
            </button>
            <button
              className={`btn ${joinMode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, borderRadius: 0, fontSize: 12 }}
              onClick={() => { setJoinMode('code'); setJoinError(''); }}
            >
              Enter Code
            </button>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {joinMode === 'browse' ? (
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>
                  Search public organizations
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
                        {o.code && <span style={{ color: 'var(--accent)', fontSize: 11, marginLeft: 4 }}>{o.code}</span>}
                        {selectedOrgId === o._id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                      </div>
                    ))}
                  </div>
                )}
                {joinQuery && filteredOrgs.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 6 }}>
                    No public organizations found matching "{joinQuery}"
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>
                  Enter organization code
                </label>
                <input
                  className="oc-input"
                  type="text"
                  placeholder="e.g. A3B2-C7D1-E9F4"
                  value={joinCode}
                  onChange={e => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleJoinByCode(); }}
                  autoFocus
                />
                <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>
                  Required for private organizations
                </div>
              </div>
            )}
            {joinError && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>{joinError}</div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setMode('select')} disabled={submitting}>Back</button>
            {joinMode === 'browse' ? (
              <button className="btn btn-primary" onClick={handleJoin} disabled={!selectedOrgId || submitting}>
                {submitting ? 'Joining...' : 'Join'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleJoinByCode} disabled={!joinCode.trim() || submitting}>
                {submitting ? 'Joining...' : 'Join'}
              </button>
            )}
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
