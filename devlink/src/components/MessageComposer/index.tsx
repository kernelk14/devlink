import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '@/lib/store';
import { useSendMessage } from '@/hooks/useData';
import { Paperclip, Bold, Italic, Code, Link2, Smile, Zap, RefreshCw } from 'lucide-react';

export function MessageComposer() {
  const sendMessageMutation = useSendMessage();
  const setMessageDraft = useUIStore((state) => state.setMessageDraft);
  const clearMessageDraft = useUIStore((state) => state.clearMessageDraft);
  const selectedChannelId = useUIStore((s) => s.selectedChannelId);
  const currentUserId = useUIStore((s) => s.currentUserId);
  const addToast = useUIStore((state) => state.addToast);
  const messageDrafts = useUIStore((s) => s.messageDrafts);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
    const draft = selectedChannelId ? messageDrafts[selectedChannelId] || '' : '';
    setMessage(draft);
  }, [selectedChannelId, messageDrafts]);

  // persist drafts as the user types (debounced)
  useEffect(() => {
    if (!selectedChannelId) return;
    const tid = setTimeout(() => {
      if (message.trim()) setMessageDraft(selectedChannelId, message);
      else clearMessageDraft(selectedChannelId);
    }, 300);
    return () => clearTimeout(tid);
  }, [message, selectedChannelId, setMessageDraft, clearMessageDraft]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !selectedChannelId || !currentUserId) return;
    if (sendMessageMutation.isPending) return; // prevent double-send

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        channelId: selectedChannelId,
        content: message.trim(),
        authorId: currentUserId,
      });
      clearMessageDraft(selectedChannelId);
      setMessage('');
      setShowEmoji(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to send message. Check connection.',
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  }, [message, selectedChannelId, currentUserId, sendMessageMutation, clearMessageDraft, addToast]);

  const handleRetry = useCallback(() => {
    if (!message.trim() || !selectedChannelId || !currentUserId) return;
    sendMessageMutation.mutate({
      channelId: selectedChannelId,
      content: message.trim(),
      authorId: currentUserId,
    });
  }, [message, selectedChannelId, currentUserId, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
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

  const hasError = sendMessageMutation.isError;

  return (
    <div className="composer">
      <div className="composer-prompt-line">
        <span className="prompt-user">{currentUserId?.substring(0, 8) || 'guest'}</span>
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
            placeholder={selectedChannelId ? "Message #channel..." : "Select a channel to send a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isSending || !selectedChannelId}
          />
          <button
            className={`composer-send ${hasError ? 'composer-send-error' : ''}`}
            onClick={hasError ? handleRetry : handleSend}
            disabled={!message.trim() || isSending || !selectedChannelId}
            title={hasError ? "Retry (click)" : "Send (Ctrl+Enter)"}
          >
            {hasError ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : isSending ? (
              <span className="sending-dot" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        {sendMessageMutation.isPending && (
          <div className="composer-sending-indicator">
            <span className="sending-text">Sending...</span>
          </div>
        )}
        {sendMessageMutation.isError && (
          <div className="composer-error-hint" style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>
            Failed to send. {sendMessageMutation.error?.message || 'Please check your connection and try again.'}
          </div>
        )}
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
          {hasError && <span className="hint-text" style={{ color: 'var(--red)' }}> · Failed — click button to retry</span>}
        </div>
      </div>
    </div>
  );
}