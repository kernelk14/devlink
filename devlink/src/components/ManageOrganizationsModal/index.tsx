import { useState, useMemo } from 'react';
import { useUIStore } from '@/lib/store';
import { useOrganizations, useOrganization, useUpdateOrganization, useCreateOrganization, useOrganizationByCode, useUpdateUser, useCreateChannel } from '@/hooks/useData';
import { X, Building2, Globe, Lock, Check, Plus, Search } from 'lucide-react';
import { OrgSettingsModal } from '@/components/OrgSettingsModal';

interface ManageOrganizationsModalProps {
  onClose: () => void;
}

export function ManageOrganizationsModal({ onClose }: ManageOrganizationsModalProps) {
  const currentOrgId = useUIStore((s) => s.currentOrgId);
  const switchOrg = useUIStore((s) => s.switchOrg);
  const setCurrentUserRole = useUIStore((s) => s.setCurrentUserRole);
  const addToast = useUIStore((s) => s.addToast);
  const currentUserId = useUIStore((s) => s.currentUserId);

  const { data: orgs = [] } = useOrganizations();
  const { data: currentOrg } = useOrganization(currentOrgId || undefined);
  const updateOrgMutation = useUpdateOrganization();
  const createOrgMutation = useCreateOrganization();
  const createChannelMutation = useCreateChannel();
  const updateUserMutation = useUpdateUser();

  const [tab, setTab] = useState<'view' | 'create' | 'join'>('view');

  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    website: '',
    tags: '',
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    code: '',
    description: '',
    website: '',
    tags: '',
    isPublic: true,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [joinMode, setJoinMode] = useState<'browse' | 'code'>('browse');
  const [joinQuery, setJoinQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const [showOrgSettings, setShowOrgSettings] = useState(false);

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

  const handleEditStart = (org: any) => {
    setEditingOrg(org._id);
    setEditForm({
      name: org.name || '',
      description: org.description || '',
      website: org.website || '',
      tags: (org.tags || []).join(', '),
    });
  };

  const handleEditSave = async () => {
    if (!editingOrg) return;
    try {
      const tagsArray = editForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateOrgMutation.mutateAsync({
        orgId: editingOrg as any,
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        website: editForm.website.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      addToast({ type: 'success', message: 'Organization updated successfully' });
      setEditingOrg(null);
    } catch {
      addToast({ type: 'error', message: 'Failed to update organization' });
    }
  };

  const handleSwitchOrg = (orgId: string) => {
    const org = orgs.find((o: any) => o._id === orgId);
    if (org) {
      switchOrg(orgId, org.name, org.slug, org.code);
      addToast({ type: 'info', message: `Switched to ${org.name}` });
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !currentUserId) return;
    setCreateSubmitting(true);
    try {
      const slug = createForm.slug.trim() || createForm.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const genCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${rand(4)}-${rand(3)}-${rand(4)}`;
      };
      const code = createForm.code.trim().toUpperCase() || genCode();
      const tagsArray = createForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const org: any = await createOrgMutation.mutateAsync({
        name: createForm.name.trim(),
        slug,
        code,
        visibility: createForm.isPublic ? 'public' : 'private',
        description: createForm.description.trim(),
        website: createForm.website.trim(),
        tags: tagsArray,
        creatorId: currentUserId,
      });

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
            createdBy: currentUserId,
          });
        } catch {
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
      addToast({ type: 'success', message: `Created organization ${org.name}` });
      setTab('view');
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to create organization' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedOrgId || !currentUserId) return;
    setJoinError('');
    setJoinSubmitting(true);
    try {
      await updateUserMutation.mutateAsync({
        userId: currentUserId,
        orgId: selectedOrgId,
        role: 'member',
      });
      const org = (orgs as any[]).find((o: any) => o._id === selectedOrgId);
      switchOrg(selectedOrgId, org?.name, org?.slug, org?.code);
      setCurrentUserRole('member');
      addToast({ type: 'success', message: `Joined ${org?.name}` });
      setTab('view');
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join organization');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || !currentUserId) return;
    setJoinError('');
    setJoinSubmitting(true);
    try {
      const org = (orgs as any[]).find((o: any) => o.code?.toUpperCase() === joinCode.trim().toUpperCase());
      if (!org) {
        setJoinError('No organization found with that code');
        setJoinSubmitting(false);
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
      setTab('view');
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join organization');
    } finally {
      setJoinSubmitting(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-panel" style={{ width: 520, maxHeight: '80vh' }}>
        <div className="popup-header">
          <div className="popup-title">
            <Building2 size={16} style={{ color: 'var(--cyan)' }} />
            <span>Manage Organizations</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button
            className={`btn ${tab === 'view' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: 0, fontSize: 12 }}
            onClick={() => setTab('view')}
          >
            View
          </button>
          <button
            className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: 0, fontSize: 12 }}
            onClick={() => setTab('create')}
          >
            Create
          </button>
          <button
            className={`btn ${tab === 'join' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: 0, fontSize: 12 }}
            onClick={() => setTab('join')}
          >
            Join
          </button>
        </div>

        <div className="popup-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {tab === 'view' && (
            <>
              {orgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--fg-dim)' }}>
                  No organizations found
                </div>
              ) : editingOrg ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 4 }}>
                    Editing Organization
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Name</label>
                    <input
                      className="oc-input"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea
                      className="oc-input"
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Organization description..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Website</label>
                    <input
                      className="oc-input"
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Tags</label>
                    <input
                      className="oc-input"
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      placeholder="tech, startup, team"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setEditingOrg(null)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleEditSave}
                      disabled={updateOrgMutation.isPending}
                      style={{ flex: 1 }}
                    >
                      {updateOrgMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                orgs.map((org: any) => (
                  <div
                    key={org._id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${org._id === currentOrgId ? 'var(--cyan)' : 'var(--border)'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (org._id !== currentOrgId) {
                        e.currentTarget.style.borderColor = 'var(--fg-muted)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (org._id !== currentOrgId) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        background: 'var(--purple)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Building2 size={18} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{org.name}</span>
                          {org.visibility === 'private' ? (
                            <Lock size={12} style={{ color: 'var(--fg-dim)' }} />
                          ) : (
                            <Globe size={12} style={{ color: 'var(--fg-dim)' }} />
                          )}
                          {org._id === currentOrgId && (
                            <span style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              background: 'var(--cyan)',
                              color: 'var(--bg-main)',
                              borderRadius: 3,
                              fontWeight: 600,
                            }}>
                              current
                            </span>
                          )}
                        </div>
                        {org.description && (
                          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                            {org.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>@{org.slug}</span>
                          {org.code && (
                            <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'monospace' }}>
                              {org.code}
                            </span>
                          )}
                          {org.tags && org.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {org.tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 10,
                                    padding: '1px 4px',
                                    background: 'var(--bg-panel)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 3,
                                    color: 'var(--fg-muted)',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {org.tags.length > 3 && (
                                <span style={{ fontSize: 10, color: 'var(--fg-dim)' }}>
                                  +{org.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {org.website && (
                          <div style={{ marginTop: 4 }}>
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: 11,
                                color: 'var(--cyan)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                              {org.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      {org._id !== currentOrgId && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleSwitchOrg(org._id); }}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                        >
                          Switch
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleEditStart(org); }}
                        style={{ fontSize: 11, padding: '4px 10px' }}
                      >
                        Edit
                      </button>
                      {org._id === currentOrgId && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); setShowOrgSettings(true); }}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                        >
                          Settings
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Name</label>
                <input
                  className="oc-input"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="My Organization"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Slug</label>
                <input
                  className="oc-input"
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="my-organization"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Code</label>
                <input
                  className="oc-input"
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                  placeholder="A3B2-C7D1-E9F4 (auto-generated if empty)"
                />
                <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>Format: XXXX-XXX-XXXX</div>
              </div>
              <div>
                <div
                  onClick={() => setCreateForm({ ...createForm, isPublic: !createForm.isPublic })}
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
                    background: createForm.isPublic ? 'var(--green)' : 'var(--fg-dim)',
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
                      left: createForm.isPublic ? 18 : 2,
                      transition: 'left 150ms',
                    }} />
                  </div>
                  <span>{createForm.isPublic ? 'Public' : 'Private'}</span>
                  <span style={{ color: 'var(--fg-dim)', fontSize: 11, marginLeft: 'auto' }}>
                    {createForm.isPublic ? 'Anyone can find and join' : 'By invite only'}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Description</label>
                <textarea
                  className="oc-input"
                  placeholder="Tell people what this organization is about..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Website URL</label>
                <input
                  className="oc-input"
                  type="text"
                  placeholder="https://example.com"
                  value={createForm.website}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                      setCreateForm({ ...createForm, website: `https://${value}` });
                    } else {
                      setCreateForm({ ...createForm, website: value });
                    }
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Tags (comma-separated)</label>
                <input
                  className="oc-input"
                  type="text"
                  placeholder="startup, technology, team"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={createSubmitting || !createForm.name.trim()}
                style={{ marginTop: 8 }}
              >
                {createSubmitting ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          )}

          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    placeholder="A3B2-C7D1-E9F4"
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

              <button
                className="btn btn-primary"
                onClick={joinMode === 'browse' ? handleJoin : handleJoinByCode}
                disabled={joinMode === 'browse' ? (!selectedOrgId || joinSubmitting) : (!joinCode.trim() || joinSubmitting)}
                style={{ marginTop: 8 }}
              >
                {joinSubmitting ? 'Joining...' : 'Join Organization'}
              </button>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {showOrgSettings && (
        <OrgSettingsModal onClose={() => setShowOrgSettings(false)} />
      )}
    </div>
  );
}
