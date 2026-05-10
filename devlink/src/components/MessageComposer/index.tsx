import { useState, useRef, useEffect } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useSendMessage, useUser } from '@/hooks/useData';
import { Paperclip, Bold, Italic, Code, Link2, Smile, Zap } from 'lucide-react';

export function MessageComposer() {
  const sendMessageMutation = useSendMessage();
  const setMessageDraft = useUIStore((state) => state.setMessageDraft);
  const clearMessageDraft = useUIStore((state) => state.clearMessageDraft);
  const selectedChannelId = useUIStore((s) => s.selectedChannelId);
  const currentUserId = useUIStore((s) => s.currentUserId);
  const messageDrafts = useUIStore((s) => s.messageDrafts);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickEmojis = ['😀', '😂', '😍', '👍', '🎉', '🚀', '💡', '❤️', '🔥', '😎', '🤔', '👏'];

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Load/save drafts for the current channel
  useEffect(() => {
    // load draft for selected channel when it changes
    const draft = messageDrafts[selectedChannelId] || '';
    setMessage(draft);
  }, [selectedChannelId]);

  // persist drafts as the user types (debounced)
  useEffect(() => {
    const tid = setTimeout(() => {
      if (message.trim()) setMessageDraft(selectedChannelId, message);
      else clearMessageDraft(selectedChannelId);
    }, 300);
    return () => clearTimeout(tid);
  }, [message, selectedChannelId, setMessageDraft, clearMessageDraft]);

  const { data: currentUserData } = useUser(currentUserId || undefined);

  const handleSend = () => {
    if (!message.trim() || !selectedChannelId || !currentUserId) return;
    sendMessageMutation.mutate({
      channelId: selectedChannelId,
      content: message.trim(),
      authorId: currentUserId,
    });
    // clear draft for this channel
    clearMessageDraft(selectedChannelId);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = message.substring(0, start) + emoji + message.substring(start);
      setMessage(newContent);
      setShowEmoji(false);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = message.substring(start, end);
      const newContent = message.substring(0, start) + prefix + selected + suffix + message.substring(end);
      setMessage(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    }
  };

  const userName = currentUserData?.name?.split(' ')[0] || 'user';

  return (
    <div className="composer">
      <div className="composer-prompt-line">
        <span className="prompt-user">{userName}</span>
        <span className="prompt-at">@</span>
        <span className="prompt-host">devlink</span>
        <span className="prompt-symbol">$</span>
        <span className="prompt-cmd"> send --msg</span>
      </div>

      <div className="composer-toolbar">
        <button className="toolbar-btn" title="Bold (Ctrl+B)" onClick={() => insertFormat('**')}>
          <Bold size={14} />
        </button>
        <button className="toolbar-btn" title="Italic (Ctrl+I)" onClick={() => insertFormat('_')}>
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
            placeholder="Message #channel..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="composer-send"
            onClick={handleSend}
            disabled={!message.trim()}
            title="Send (Ctrl+Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
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
          <span className="hint-key">Ctrl+Enter</span>
          <span className="hint-text">to send</span>
          <span className="hint-sep">·</span>
          <span className="hint-key">Shift+Enter</span>
          <span className="hint-text">new line</span>
        </div>
      </div>
    </div>
  );
}
