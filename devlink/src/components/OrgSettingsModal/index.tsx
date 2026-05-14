import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useOrganization, useUpdateOrganization } from '@/hooks/useData';
import { X, Settings } from 'lucide-react';

interface OrgSettingsModalProps {
  onClose: () => void;
}

export function OrgSettingsModal({ onClose }: OrgSettingsModalProps) {
  const currentOrgId = useUIStore((s) => s.currentOrgId);
  const switchOrg = useUIStore((s) => s.switchOrg);
  const addToast = useUIStore((s) => s.addToast);
  const { data: org } = useOrganization(currentOrgId || undefined);
  const updateOrgMutation = useUpdateOrganization();

  const [name, setName] = useState('');
   const [slug, setSlug] = useState('');
   const [code, setCode] = useState('');
   const [description, setDescription] = useState('');
   const [website, setWebsite] = useState('');
   const [tags, setTags] = useState('');
   const [isPublic, setIsPublic] = useState(true);
   const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setName(org.name || '');
    setSlug(org.slug || '');
    setCode(org.code || '');
    setDescription(org.description || '');
    setWebsite(org.website || '');
    setTags((org.tags || []).join(', '));
    setIsPublic(org.visibility !== 'private');
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!currentOrgId || !org) return;
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
        
      await updateOrgMutation.mutateAsync({
        orgId: currentOrgId as any,
        name: name.trim() || undefined,
        slug: slug.trim() || undefined,
        code: code.trim().toUpperCase() || undefined,
        visibility: isPublic ? 'public' : 'private',
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });
      switchOrg(currentOrgId, name.trim() || org.name, slug.trim() || org.slug, code.trim().toUpperCase() || org.code);
      addToast({ type: 'success', message: 'Organization settings saved' });
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save settings' });
    }
  };

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-panel" style={{ width: 420 }}>
        <div className="popup-header">
          <div className="popup-title">
            <Settings size={16} style={{ color: 'var(--cyan)' }} />
            <span>organization settings</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// {org?.name || ''}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="popup-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Name</label>
            <input className="oc-input" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Slug</label>
            <input className="oc-input" type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Organization Code</label>
            <input className="oc-input" type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="XXXX-XXX-XXXX" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Description</label>
            <textarea
              className="oc-input"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell people what this organization is about..."
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Website URL</label>
            <input
              className="oc-input"
              type="text"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Tags (comma-separated)</label>
            <input
              className="oc-input"
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="tech, startup, team"
            />
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
        </div>
        <div className="popup-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={updateOrgMutation.isPending}>
            {updateOrgMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}