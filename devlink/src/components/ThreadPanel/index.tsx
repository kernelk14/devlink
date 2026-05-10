import { useState } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels } from '@/lib/hooks';
import { X, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ThreadPanel() {
  const { selectedThreadId, setSelectedThread } = useUIStore();
  const { channels } = useChannels();
  const [replyText, setReplyText] = useState('');

  const activeChannel = channels.find(c => c.threads?.some(t => t.id === selectedThreadId));
  const thread = activeChannel?.threads?.find(t => t.id === selectedThreadId);

  if (!thread) return null;

  const handleReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
  };

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <div className="thread-title">
          <MessageSquare size={16} style={{ color: 'var(--green)' }} />
          <span>Thread</span>
        </div>
        <button 
          className="btn btn-ghost btn-icon"
          onClick={() => setSelectedThread(null)}
        >
          <X size={16} />
        </button>
      </div>

      <div className="thread-body">
        <div className="thread-message">
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div className="avatar avatar-sm" style={{ background: thread.user?.color || 'var(--purple)' }}>
              {thread.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {thread.user?.name || 'Unknown'}
              </div>
              <div style={{ color: 'var(--fg-dim)', fontSize: 12 }}>
                {formatDistanceToNow(new Date(thread.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--fg)', paddingLeft: 36 }}>
            {thread.content}
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ 
            color: 'var(--fg-muted)', 
            fontSize: 12, 
            paddingBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>{thread.replies?.length || 0}</span>
            <span>replies</span>
          </div>
        </div>

        {thread.replies?.map((reply: any, index: number) => (
          <div key={index} className="thread-reply">
            <div className="avatar avatar-sm" style={{ background: reply.user?.color || 'var(--blue)' }}>
              {reply.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {reply.user?.name || 'Unknown'}
                </span>
                <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>
                  {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div style={{ color: 'var(--fg)', fontSize: 13 }}>
                {reply.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="thread-footer">
        <div className="thread-composer oc-composer">
          <input
            type="text"
            className="thread-composer-input oc-input"
            placeholder="Reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
          />
          <button 
            className="btn btn-primary btn-icon oc-send"
            onClick={handleReply}
            disabled={!replyText.trim()}
          >
            <span style={{ fontSize: 16 }}>↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
