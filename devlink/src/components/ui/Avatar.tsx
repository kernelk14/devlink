interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
}

const sizeClasses = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
  '2xl': 'avatar-2xl',
};

const gradients = [
  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #22d3ee 100%)',
  'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
];

function getGradient(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const statusColors = {
  online: '#4ade80',
  away: '#fbbf24',
  busy: '#f87171',
  dnd: '#ef4444',
  offline: '#666680',
};

export function Avatar({ name, size = 'md', status }: AvatarProps) {
  return (
    <div className={`avatar ${sizeClasses[size]}`}>
      <div className="avatar-inner" style={{ background: getGradient(name) }}>
        <span>{getInitials(name)}</span>
      </div>
      {status && (
        <div className="avatar-status" style={{ background: statusColors[status] }} />
      )}
      <style>{`
        .avatar {
          position: relative;
          display: inline-flex;
          flex-shrink: 0;
        }
        .avatar-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        .avatar-xs .avatar-inner { width: 20px; height: 20px; font-size: 9px; }
        .avatar-sm .avatar-inner { width: 28px; height: 28px; font-size: 11px; }
        .avatar-md .avatar-inner { width: 36px; height: 36px; font-size: 13px; }
        .avatar-lg .avatar-inner { width: 44px; height: 44px; font-size: 15px; }
        .avatar-xl .avatar-inner { width: 56px; height: 56px; font-size: 18px; }
        .avatar-2xl .avatar-inner { width: 72px; height: 72px; font-size: 24px; }
        .avatar-status {
          position: absolute;
          bottom: 0;
          right: 0;
          border-radius: 50%;
          border: 2px solid var(--bg-surface);
        }
        .avatar-xs .avatar-status { width: 7px; height: 7px; border-width: 1px; }
        .avatar-sm .avatar-status { width: 9px; height: 9px; }
        .avatar-md .avatar-status { width: 11px; height: 11px; }
        .avatar-lg .avatar-status { width: 13px; height: 13px; border-width: 3px; }
        .avatar-xl .avatar-status { width: 15px; height: 15px; border-width: 3px; }
        .avatar-2xl .avatar-status { width: 18px; height: 18px; border-width: 3px; }
      `}</style>
    </div>
  );
}