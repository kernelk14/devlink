import { useState, useEffect } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useChannels, useMessages } from '@/lib/hooks';
import { useAddReaction } from '@/hooks/useData';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Smile } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Avatar } from '@/components/ui/Avatar';

export function MessageList() {
  const { selectedChannelId } = useUIStore();
  const { channels } = useChannels();
  const { messages } = useMessages(selectedChannelId);
  const addReactionMutation = useAddReaction();
  const currentUser = getCurrentUser();

  const channel = channels.find(c => c.id === selectedChannelId);
  const channelMessages = messages;

  const renderDateDivider = (date: Date) => {
    let label = format(date, 'EEEE, MMMM d, yyyy');
    if (isToday(date)) label = 'Today';
    else if (isYesterday(date)) label = 'Yesterday';

    return (
      <div className="msg-date-divider">
        <span className="msg-date-line">{'// ─── '}{label}{' ─── //'}</span>
      </div>
    );
  };

  const renderMessage = (message: any, index: number) => {
    const prev = channelMessages[index - 1];
    const needsDivider = !prev || !isSameDay(new Date(prev.timestamp), new Date(message.timestamp));
    const userName = message.user?.name?.split(' ')[0] || 'unknown';
    const prevMsg = channelMessages[index - 1];
    const sameAuthor = prevMsg && prevMsg.user?.name === message.user?.name;

    return (
      <div key={message.id} className="msg-entry">
        {needsDivider && renderDateDivider(new Date(message.timestamp))}
        <div className="msg-line">
          <div className="msg-avatar-col">
            {!sameAuthor && (
              <Avatar name={message.user?.name || '?'} size="sm" />
            )}
          </div>
          <span className={`msg-prompt ${sameAuthor ? 'msg-prompt-continue' : ''}`}>
            <span className="msg-username">{userName}</span>
            <span className="msg-at">@</span>
            <span className="msg-host">devlink</span>
            <span className="msg-colon">:</span>
            <span className="msg-path">~/{channel?.name || 'general'}</span>
            <span className="msg-symbol">$</span>
          </span>
          <div className="msg-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="inline-code" {...props}>{children}</code>;
                  }
                  const lang = className?.replace('language-', '') || '';
                  return <CodeBlock code={String(children).trimEnd()} lang={lang} />;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.reactions && message.reactions.length > 0 && (
              <div className="msg-reactions">
                {message.reactions.map((r: any, i: number) => (
                  <button 
                    key={i} 
                    className="reaction-badge" 
                    onClick={() => {
                      if (currentUser?.id) {
                        addReactionMutation.mutate({
                          messageId: message.id,
                          emoji: r.emoji,
                          userId: currentUser.id,
                        });
                      }
                    }}
                  >
                    <span>{r.emoji}</span>
                    <span className="reaction-count">{r.count}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="msg-meta">
              <span className="msg-time">{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
              <button className="msg-action-btn" title="Copy">
                <Copy size={11} />
              </button>
              <button className="msg-action-btn" title="React">
                <Smile size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (channelMessages.length === 0) {
    return (
      <div className="msg-container">
        <div className="msg-empty">
          <div className="msg-empty-line">
            <span className="prompt-user">system</span>
            <span className="prompt-at">@</span>
            <span className="prompt-host">devlink</span>
            <span className="prompt-symbol">$</span>
            <span className="msg-empty-cmd"> cat #{channel?.name || 'channel'}</span>
          </div>
          <div className="msg-empty-output">
            <span style={{ color: 'var(--fg-dim)' }}>// no messages found in this channel</span>
          </div>
          <div className="msg-empty-output">
            <span style={{ color: 'var(--fg-dim)' }}>// start the conversation</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-container scroll-area">
      <div className="msg-list">
        {channelMessages.map((msg, i) => renderMessage(msg, i))}
      </div>
    </div>
  );
}
