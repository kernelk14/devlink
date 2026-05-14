import { useUIStore, type Toast } from '../../lib/store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}${toast.onClick ? ' toast-clickable' : ''}`}
          onClick={() => { toast.onClick?.(); removeToast(toast.id); }}
        >
          <span className="toast-icon">{getIcon(toast.type)}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}>
            <X size={16} />
          </button>
        </div>
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          top: 52px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 3000;
          pointer-events: none;
        }
        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          animation: slideIn 200ms ease-out;
          pointer-events: auto;
          max-width: 400px;
          cursor: default;
        }
        .toast-clickable { cursor: pointer; }
        .toast-clickable:hover { border-color: var(--accent); }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .toast-icon {
          flex-shrink: 0;
        }
        .toast-success .toast-icon { color: var(--success); }
        .toast-error .toast-icon { color: var(--error); }
        .toast-warning .toast-icon { color: var(--warning); }
        .toast-info .toast-icon { color: var(--accent); }
        .toast-message {
          flex: 1;
          font-size: 14px;
          color: var(--text-primary);
        }
        .toast-close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        .toast-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}