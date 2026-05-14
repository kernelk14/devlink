import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { X, Link, Copy, Mail, Check } from 'lucide-react';

interface InviteModalProps {
  onClose: () => void;
}

export function InviteModal({ onClose }: InviteModalProps) {
  const currentOrgCode = useUIStore((s) => s.currentOrgCode);
  const currentOrgName = useUIStore((s) => s.currentOrgName);
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${currentOrgCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addToast({ type: 'success', message: 'Invite link copied' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = () => {
    if (!email.trim()) return;
    addToast({ type: 'info', message: `Invite sent to ${email}` });
    setEmail('');
  };

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-panel" style={{ width: 420 }}>
        <div className="popup-header">
          <div className="popup-title">
            <Mail size={16} style={{ color: 'var(--cyan)' }} />
            <span>invite people</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// {currentOrgName}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="popup-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Invite link</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="oc-input" style={{ flex: 1, fontSize: 12, padding: '6px 8px', background: 'var(--bg)' }}>
                <Link size={12} style={{ marginRight: 6, color: 'var(--fg-dim)' }} />
                <span style={{ color: 'var(--fg-dim)' }}>{inviteLink}</span>
              </div>
              <button className="btn btn-secondary" onClick={handleCopyLink} style={{ padding: '6px 10px' }}>
                {copied ? <Check size={14} style={{ color: 'var(--green)' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4, display: 'block' }}>Invite by email</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                className="oc-input"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendInvite(); }}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleSendInvite} disabled={!email.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}