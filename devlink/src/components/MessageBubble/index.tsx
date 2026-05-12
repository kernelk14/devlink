import { useState } from 'react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../lib/store';
import type { Message, User } from '../../types';
import { Smile, MessageSquare, MoreHorizontal, CornerDownRight } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface MessageBubbleProps {
  message: Message;
  author: User | undefined;
  isFirst: boolean;
  isLast: boolean;
  groupStart?: boolean;
}

export function MessageBubble({ message, author, isFirst, isLast, groupStart }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { setSelectedThread } = useUIStore();

  if (!author) return null;

  const quickReactions = ['👍', '🎉', '🚀', '💡', '❤️', '🔥'];

  return (
    <div
      className={`message-bubble oc-message ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''} ${groupStart ? 'group-start' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {isFirst ? (
        <Avatar name={author.name} size="md" />
      ) : (
        <div className="avatar-spacer" />
      )}

      <div className="message-main oc-message-main">
        {isFirst && (
          <div className="message-header">
            <span className="author-name">{author.username}</span>
            <span className="timestamp">{format(new Date(message.createdAt), 'h:mm a')}</span>
            {message.isEdited && <span className="edited">(edited)</span>}
          </div>
        )}

        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const isInline = !className;
                if (isInline) {
                  return <code className="inline-code" {...props}>{children}</code>;
                }
                const lang = className?.replace('language-', '') || '';
                return (
                  <CodeBlock
                    code={String(children).trimEnd()}
                    lang={lang}
                  />
                );
              },
              strong({ children, ...props }) {
                const text = String(children);
                if (text.startsWith('@')) {
                  return <span className="mention">{text}</span>;
                }
                return <strong {...props}>{children}</strong>;
              },
            }}
          >
            {message.content.replace(/(?<!\w)@([a-z0-9_]+)/gi, '**@$1**')}
          </ReactMarkdown>
        </div>

        {message.reactions.length > 0 && (
          <div className="reactions">
            {message.reactions.map((reaction, i) => (
              <button key={i} className="reaction-btn">
                <span>{reaction.emoji}</span>
                <span className="reaction-count">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {message.replies > 0 && (
          <button
            className="thread-preview"
            onClick={() => setSelectedThread(message.id)}
          >
            <CornerDownRight size={14} />
            <span>{message.replies} {message.replies === 1 ? 'reply' : 'replies'}</span>
            <span className="thread-activity">View thread</span>
          </button>
        )}
      </div>

        {showActions && (
          <div className="message-actions oc-actions">
            <button
              className="action-btn"
              title="Add reaction"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Smile size={16} />
            </button>
            <button
              className="action-btn"
              title="Reply in thread"
              onClick={() => setSelectedThread(message.id)}
            >
              <MessageSquare size={16} />
              {message.replies > 0 && <span className="action-btn-count">{message.replies}</span>}
            </button>
            <button className="action-btn" title="More actions">
              <MoreHorizontal size={16} />
            </button>
          </div>
        )}

      {showReactions && (
        <div className="reaction-picker">
          {quickReactions.map((emoji) => (
            <button key={emoji} className="emoji-btn" onClick={() => setShowReactions(false)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .message-bubble {
          display: flex;
          gap: 14px;
          padding: 8px 16px;
          position: relative;
          transition: background-color 100ms ease;
        }
        .message-bubble.first {
          padding-top: 20px;
        }
        .message-bubble.last {
          padding-bottom: 20px;
        }
        .message-bubble:hover {
          background: rgba(255,255,255,0.02);
        }
        .message-bubble.group-start {
          margin-top: 8px;
        }
        .message-bubble.group-start.first {
          margin-top: 0;
        }
        .avatar-spacer {
          width: 40px;
          flex-shrink: 0;
        }
         .message-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .message-header {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 2px;
        }
         .author-name {
           font-weight: 600;
           color: var(--text-primary);
           font-size: 14px;
         }
         .author-handle {
           font-size: 12px;
           color: var(--text-tertiary);
         }
         .timestamp {
           font-size: 11px;
           color: var(--text-tertiary);
         }
         .edited {
           font-size: 11px;
           color: var(--text-tertiary);
           font-style: italic;
         }
        .message-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
        }
        .message-content > p:first-child {
          margin-top: 0;
        }
         .message-content > p:last-child {
           margin-bottom: 0;
         }
         .message-content table {
          border-collapse: collapse;
          width: 100%;
          font-size: 13px;
          margin: 8px 0;
        }
        .message-content th, .message-content td {
          border: 1px solid var(--border);
          padding: 10px 14px;
          text-align: left;
        }
        .message-content th {
          background: var(--bg-tertiary);
          font-weight: 600;
        }
        .message-content blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 14px;
          margin: 8px 0;
          color: var(--text-secondary);
        }
        .reactions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
         .reaction-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: var(--bg-secondary);
          border-radius: 14px;
          font-size: 13px;
          transition: all 150ms ease-out;
          border: 1px solid transparent;
        }
        .reaction-btn:hover {
          background: var(--bg-input);
          border-color: var(--border);
        }
        .reaction-count {
          font-weight: 500;
        }
         .thread-preview {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          font-size: 12px;
          color: var(--accent);
          transition: all 150ms ease-out;
          border: 1px solid var(--border);
        }
        .thread-preview:hover {
          background: rgba(88, 166, 255, 0.1);
          border-color: var(--accent);
        }
        .thread-activity {
          color: var(--text-secondary);
          margin-left: 2px;
        }
         .message-actions {
           position: absolute;
           top: 50%;
           right: 20px;
           transform: translateY(-50%);
           display: flex;
           background: var(--bg-secondary);
           border: 1px solid var(--border);
           border-radius: 8px;
           padding: 4px;
           gap: 2px;
           animation: fadeIn 150ms ease-out;
           box-shadow: 0 6px 18px rgba(0,0,0,0.45);
           z-index: 10;
         }
         .action-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: var(--text-secondary);
          transition: all 150ms ease-out;
        }
        .action-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .action-btn-count {
          font-size: 10px;
          font-weight: 600;
          margin-left: 2px;
        }
         .reaction-picker {
          position: absolute;
          top: -44px;
          right: 20px;
          display: flex;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 6px;
          gap: 2px;
          animation: fadeIn 150ms ease-out;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          z-index: 11;
        }
        .emoji-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border-radius: 6px;
          transition: all 150ms ease-out;
        }
        .emoji-btn:hover {
          background: var(--bg-tertiary);
          transform: scale(1.15);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-50%) translateY(4px); }
          to { opacity: 1; transform: translateY(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
