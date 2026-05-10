import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { useCreateChannel } from '@/hooks/useData';
import { X, Plus, Hash, Lock, Check } from 'lucide-react';

interface CreateChannelModalProps {
  onClose: () => void;
}

export function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const createChannelMutation = useCreateChannel();
  const addToast = useUIStore((state) => state.addToast);
  const setSelectedChannel = useUIStore((state) => state.setSelectedChannel);
  const currentOrgId = useUIStore((state) => state.currentOrgId);
  const currentUser = useUIStore((state) => state.currentUserId);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!channelName.trim() || !currentOrgId) return;
    
    createChannelMutation.mutate({
      name: channelName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: channelType,
      description,
      orgId: currentOrgId,
      createdBy: (currentUser || 'guest') as any,
    }, {
      onSuccess: () => {
        addToast({ type: 'success', message: `Channel #${channelName.trim()} created successfully` });
        onClose();
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to create channel' });
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box create-channel-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={16} />
            <span>create</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400 }}>// channel.new</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="terminal-block" style={{ marginBottom: 24 }}>
            <div className="terminal-line">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> channel.create --type</span>
              <span style={{ color: 'var(--cyan)' }}> {channelType}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> name</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--cyan)' }}>#</span>
              <input
                type="text"
                className="form-input"
                placeholder="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">type</label>
            <div className="channel-type-selector">
              <div 
                className={`channel-type-option ${channelType === 'public' ? 'active' : ''}`}
                onClick={() => setChannelType('public')}
              >
                <div style={{ marginBottom: 8 }}>
                  <Hash size={20} style={{ color: 'var(--fg-dim)' }} />
                </div>
                <div className="channel-type-name">public</div>
                <div className="channel-type-desc">anyone can join</div>
              </div>
              <div 
                className={`channel-type-option ${channelType === 'private' ? 'active' : ''}`}
                onClick={() => setChannelType('private')}
              >
                <div style={{ marginBottom: 8 }}>
                  <Lock size={20} style={{ color: 'var(--purple)' }} />
                </div>
                <div className="channel-type-name">private</div>
                <div className="channel-type-desc">invite only</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> description</span>
              <span style={{ color: 'var(--fg-dim)' }}> (optional)</span>
            </label>
            <textarea
              className="form-input"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={!channelName.trim()}
          >
            <Check size={14} />
            create
          </button>
        </div>
      </div>
    </div>
  );
}