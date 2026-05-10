import { useUIStore } from '../../lib/store';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const shortcuts = [
  { category: 'navigation', items: [
    { keys: ['Ctrl', 'K'], desc: 'open search' },
    { keys: ['Ctrl', ','], desc: 'open settings' },
    { keys: ['?'], desc: 'show shortcuts' },
    { keys: ['Esc'], desc: 'close modal' },
  ]},
  { category: 'messages', items: [
    { keys: ['Ctrl', 'Enter'], desc: 'send message' },
    { keys: ['Shift', 'Enter'], desc: 'new line' },
    { keys: ['@'], desc: 'mention user' },
    { keys: ['#'], desc: 'mention channel' },
  ]},
  { category: 'navigation', items: [
    { keys: ['Alt', '↑/↓'], desc: 'prev/next channel' },
  ]},
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const { toggleShortcutsModal } = useUIStore();

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); toggleShortcutsModal(false); } }}>
      <div className="popup-panel" style={{ width: 460 }}>
        <div className="popup-header">
          <div className="popup-title">
            <Keyboard size={16} style={{ color: 'var(--cyan)' }} />
            <span>shortcuts</span>
            <span style={{ color: 'var(--fg-dim)', fontWeight: 400, fontSize: 12 }}>// keybindings</span>
          </div>
          <button className="popup-close" onClick={() => { onClose(); toggleShortcutsModal(false); }}>
            <X size={16} />
          </button>
        </div>
        <div className="popup-body">
          {shortcuts.map((section) => (
            <div key={section.category} style={{ marginBottom: 20 }}>
              <div className="search-section-title">// {section.category}</div>
              {section.items.map((item) => (
                <div key={item.desc} className="shortcut-item">
                  <span className="shortcut-desc">{item.desc}</span>
                  <span className="shortcut-keys">
                    {item.keys.map((key, i) => (
                      <span key={i}>
                        {i > 0 && <span className="plus">+</span>}
                        <kbd>{key}</kbd>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="popup-footer">
          <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>press ? to toggle</span>
        </div>
      </div>
    </div>
  );
}