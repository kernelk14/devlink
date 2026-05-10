import { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { Bell, MessageSquare, AtSign, Zap, X } from 'lucide-react';

interface NotificationSettingsModalProps {
  onClose: () => void;
}

export function NotificationSettingsModal({ onClose }: NotificationSettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box notification-settings">
        <div className="modal-header">
          <div className="modal-title">
            <Bell size={16} />
            <span>notifications</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400 }}>// config</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="terminal-block" style={{ marginBottom: 24 }}>
            <div className="terminal-line">
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-muted)' }}> notify.enable --all</span>
            </div>
          </div>

          <div className="notification-category">
            <div className="notification-category-title">
              <MessageSquare size={14} style={{ color: 'var(--cyan)' }} />
              <span>messages</span>
            </div>
            
            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">Direct Messages</div>
                <div className="notification-option-desc">Notify on private messages</div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">Channel Messages</div>
                <div className="notification-option-desc">Notify when mentioned in channels</div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">Thread Replies</div>
                <div className="notification-option-desc">Notify on thread activity</div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="notification-category">
            <div className="notification-category-title">
              <AtSign size={14} style={{ color: 'var(--purple)' }} />
              <span>mentions</span>
            </div>
            
            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">@channel / @here</div>
                <div className="notification-option-desc">Notify on channel mentions</div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">@username</div>
                <div className="notification-option-desc">Notify when someone mentions you</div>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="notification-category">
            <div className="notification-category-title">
              <Zap size={14} style={{ color: 'var(--yellow)' }} />
              <span>activity</span>
            </div>
            
            <div className="notification-option">
              <div className="notification-option-info">
                <div className="notification-option-title">New Channel Activity</div>
                <div className="notification-option-desc">Notify on new channels created</div>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            cancel
          </button>
          <button className="btn btn-primary">
            save
          </button>
        </div>
      </div>
    </div>
  );
}