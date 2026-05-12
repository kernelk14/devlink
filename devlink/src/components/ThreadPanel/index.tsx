import { useState, useMemo, useRef, useEffect } from 'react';
import { useUIStore } from '@/lib/store';
import { useThreadReplies, useSendMessage, useUsers } from '@/hooks/useData';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, MessageSquare, Send, Bold, Italic, Code, Link2, Smile, Paperclip, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';

const quickEmojis = ['😀', '😂', '😍', '👍', '🎉', '🚀', '💡', '❤️', '🔥', '😎', '🤔', '👏'];

export function ThreadPanel() {
  const { selectedThreadId, setSelectedThread, currentOrgName } = useUIStore();
  const [replyText, setReplyText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const sendMessageMutation = useSendMessage();
  const currentUserId = useUIStore((state) => state.currentUserId);
  const { data: allUsers = [] } = useUsers();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch parent message by ID
  const parentMessage: any = useConvexQuery(
    api.messages.getMessage,
    selectedThreadId ? { messageId: selectedThreadId as any } : 'skip'
  );

  // Fetch thread replies
  const replies: any[] = useThreadReplies(selectedThreadId) ?? [];

  const parentAuthor = useMemo(() => {
    if (!parentMessage) return null;
    return allUsers.find((u: any) => u.id === parentMessage.authorId);
  }, [parentMessage, allUsers]);

  const replyAuthors = useMemo(() => {
    const map: Record<string, any> = {};
    for (const reply of replies) {
      if (!map[reply.authorId]) {
        map[reply.authorId] = allUsers.find((u: any) => u.id === reply.authorId);
      }
    }
    return map;
  }, [replies, allUsers]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [replyText]);

  if (!parentMessage) return null;

  const handleReply = () => {
    if (!replyText.trim() || !selectedThreadId || !currentUserId) return;

    sendMessageMutation.mutate({
      channelId: parentMessage.channelId,
      content: replyText.trim(),
      authorId: currentUserId,
      threadId: selectedThreadId,
    });
    setReplyText('');
    setShowEmoji(false);
  };

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = replyText.substring(start, end);
    const newContent = replyText.substring(0, start) + prefix + selected + suffix + replyText.substring(end);
    setReplyText(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = replyText.substring(0, start) + emoji + replyText.substring(start);
      setReplyText(newContent);
      setShowEmoji(false);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const currentUserData = allUsers.find((u: any) => u.id === currentUserId);
  const userName = currentUserData?.name?.split(' ')[0] || currentUserId?.substring(0, 8) || 'user';

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
            <Avatar name={parentAuthor?.name || '?'} size="sm" />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 13 }}>
                {parentAuthor?.username || parentMessage.authorId || 'Unknown'}
              </div>
              <div style={{ color: 'var(--fg-dim)', fontSize: 12 }}>
                {formatDistanceToNow(new Date(parentMessage.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--fg)', paddingLeft: 36, fontSize: 13, lineHeight: 1.5 }}>
            {parentMessage.content}
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
            <span>{replies.length || 0}</span>
            <span>{replies.length === 1 ? 'reply' : 'replies'}</span>
          </div>
        </div>

        {replies.map((reply: any) => {
          const author = replyAuthors[reply.authorId];
          return (
            <div key={reply._id} className="thread-reply">
              <Avatar name={author?.name || '?'} size="sm" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {author?.username || reply.authorId || 'Unknown'}
                  </span>
                  <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div style={{ color: 'var(--fg)', fontSize: 13, lineHeight: 1.5 }}>
                  {reply.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="thread-footer">
        <div className="composer-prompt-line">
          <span className="prompt-user">{userName}</span>
          <span className="prompt-at">@</span>
          <span className="prompt-host">{currentOrgName}</span>
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd"> send --thread</span>
        </div>

        <div className="composer-toolbar">
          <button className="toolbar-btn" title="Bold" onClick={() => insertFormat('**')}>
            <Bold size={14} />
          </button>
          <button className="toolbar-btn" title="Italic" onClick={() => insertFormat('_')}>
            <Italic size={14} />
          </button>
          <button className="toolbar-btn" title="Inline code" onClick={() => insertFormat('`')}>
            <Code size={14} />
          </button>
          <button className="toolbar-btn" title="Link" onClick={() => insertFormat('[', '](url)')}>
            <Link2 size={14} />
          </button>
          <span className="toolbar-sep" />
          <button className="toolbar-btn" title="Code block" onClick={() => insertFormat('\n```\n', '\n```\n')}>
            <Zap size={14} />
          </button>
          <button className="toolbar-btn" title="Attach file">
            <Paperclip size={14} />
          </button>
          <span className="toolbar-sep" />
          <button className="toolbar-btn" title="Emoji" onClick={() => setShowEmoji(!showEmoji)}>
            <Smile size={14} />
          </button>
        </div>

        <div className="composer-body">
          <div className="composer-input-wrap">
            <textarea
              ref={textareaRef}
              className="composer-textarea"
              placeholder="Reply in thread..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              rows={1}
            />
            <button
              className="composer-send"
              onClick={handleReply}
              disabled={!replyText.trim() || sendMessageMutation.isPending}
              title="Send (Enter)"
            >
              <Send size={14} />
            </button>
          </div>
          {showEmoji && (
            <div className="composer-emoji-picker">
              {quickEmojis.map(emoji => (
                <button key={emoji} className="emoji-btn" onClick={() => insertEmoji(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <div className="composer-hint">
            <span className="hint-key">Enter</span>
            <span className="hint-text">to send</span>
            <span className="hint-sep">·</span>
            <span className="hint-key">Shift+Enter</span>
            <span className="hint-text">new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
