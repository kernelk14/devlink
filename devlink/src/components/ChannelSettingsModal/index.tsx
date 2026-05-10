import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useChannels } from '@/lib/hooks';
import { X, Hash, Lock, Users, Trash2, Edit, Plus, Check } from 'lucide-react';

interface ChannelSettingsModalProps {
  channelId: string;
  onClose: () => void;
}

export function ChannelSettingsModal({ channelId, onClose }: ChannelSettingsModalProps) {
  const { channels } = useChannels();
  const channel = channels.find(c => c.id === channelId);
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [channelName, setChannelName] = useState(channel?.name || '');
  const [channelDescription, setChannelDescription] = useState(channel?.description || '');

  if (!channel) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 600, height: '80vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Hash size={16} />
            <span>#{channel.name}</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400 }}>settings</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="tab-group">
          <button 
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            general
          </button>
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            members
          </button>
          <button 
            className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            permissions
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="terminal-block" style={{ marginBottom: 24 }}>
                <div className="terminal-line">
                  <span className="prompt-comment"># Channel Configuration</span>
                </div>
                <div className="terminal-line">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> channel.config --id </span>
                  <span style={{ color: 'var(--cyan)' }}>{channel.id}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Hash size={12} style={{ marginRight: 4 }} />
                  channel name
                </label>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => setIsEditing(false)}>
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--cyan)' }}>#</span>
                    <span>{channel.name}</span>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={() => setIsEditing(true)}
                      title="Edit name"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">description</label>
                <textarea
                  className="form-input"
                  placeholder="Add a description..."
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                <div className="form-help">
                  <span className="prompt-symbol">$</span>
                  <span> Describe what this channel is for</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">channel type</label>
                <div className="channel-type-display">
                  {channel.type === 'private' ? (
                    <>
                      <Lock size={14} style={{ color: 'var(--purple)' }} />
                      <span>Private Channel</span>
                    </>
                  ) : channel.type === 'announcement' ? (
                    <>
                      <span style={{ color: 'var(--orange)' }}>!</span>
                      <span>Announcement Channel</span>
                    </>
                  ) : (
                    <>
                      <Hash size={14} style={{ color: 'var(--fg-dim)' }} />
                      <span>Public Channel</span>
                    </>
                  )}
                </div>
              </div>

              <div className="danger-zone" style={{ marginTop: 32, padding: 16, background: 'rgba(247, 118, 142, 0.1)', borderRadius: 4, border: '1px solid rgba(247, 118, 142, 0.3)' }}>
                <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>
                  <Trash2 size={14} style={{ marginRight: 8 }} />
                  Danger Zone
                </div>
                <p style={{ color: 'var(--fg-muted)', marginBottom: 12, fontSize: 12 }}>
                  Deleting a channel is permanent and cannot be undone. All messages will be lost.
                </p>
                <button className="btn btn-danger">
                  <Trash2 size={14} />
                  Delete Channel
                </button>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="settings-section">
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    <Users size={14} style={{ marginRight: 8, color: 'var(--cyan)' }} />
                    Members
                  </h3>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 12 }}>
                    {channel.members?.length || 0} members in this channel
                  </p>
                </div>
                <button className="btn btn-secondary">
                  <Plus size={14} />
                  Add Member
                </button>
              </div>
              
              <div className="members-list">
                <div className="member-item">
                  <div className="avatar avatar-sm" style={{ background: 'var(--purple)' }}>A</div>
                  <div className="member-info">
                    <div className="member-name">Alex Chen</div>
                    <div className="member-role">Admin</div>
                  </div>
                  <button className="btn btn-ghost btn-icon">...</button>
                </div>
                <div className="member-item">
                  <div className="avatar avatar-sm" style={{ background: 'var(--blue)' }}>S</div>
                  <div className="member-info">
                    <div className="member-name">Sarah Kim</div>
                    <div className="member-role">Member</div>
                  </div>
                  <button className="btn btn-ghost btn-icon">...</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="settings-section">
              <div className="terminal-block" style={{ marginBottom: 16 }}>
                <div className="terminal-line">
                  <span className="prompt-symbol">$</span>
                  <span style={{ color: 'var(--fg-muted)' }}> channel.permissions --list</span>
                </div>
              </div>
              
              <div className="permission-group">
                <div className="permission-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>Send Messages</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Members can send messages</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="permission-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>Add Reactions</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Members can add emoji reactions</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="permission-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>Pin Messages</div>
                    <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Members can pin messages</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            cancel
          </button>
          <button className="btn btn-primary">
            save changes
          </button>
        </div>
      </div>
    </div>
  );
}