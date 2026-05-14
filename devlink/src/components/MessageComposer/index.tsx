import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUIStore } from '@/lib/store';
import { useSendMessage, useUser, useUsers } from '@/hooks/useData';
import { Paperclip, Bold, Italic, Code, Link2, Smile, Zap, RefreshCw, Eye, EyeOff } from 'lucide-react';

const urlRegex = /https?:\/\/[^\s<>"']+(?:\/[^\s<>"']*)?/gi;

function extractUrls(text: string): string[] {
  if (!text.includes('://')) return [];
  const matches = text.match(urlRegex);
  if (!matches) return [];
  const raw = [...new Set(matches.map(u => u.replace(/[.,;!?)]+$/, '')))];
  return raw.filter(u => { try { new URL(u); return true; } catch { return false; } });
}

function safeUrlMeta(url: string) {
  try { const u = new URL(url); return { hostname: u.hostname, ok: true as const }; }
  catch { return { hostname: url, ok: false as const }; }
}

export function MessageComposer() {
  const sendMessageMutation = useSendMessage();
  const setMessageDraft = useUIStore((state) => state.setMessageDraft);
  const clearMessageDraft = useUIStore((state) => state.clearMessageDraft);
  const selectedChannelIdFromStore = useUIStore((s) => s.selectedChannelId);
  const activeTabId = useUIStore((s) => s.activeTabId);
  const openTabs = useUIStore((s) => s.openTabs);
  const currentUserId = useUIStore((s) => s.currentUserId);
  const addToast = useUIStore((state) => state.addToast);
  const messageDrafts = useUIStore((s) => s.messageDrafts);
  const currentOrgSlug = useUIStore((s) => s.currentOrgSlug);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showLinkPreviews, setShowLinkPreviews] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionStartRef = useRef<number>(-1);
  const { data: allUsers = [] } = useUsers();

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const currentChannelId = activeTab?.type === 'channel' ? activeTabId : selectedChannelIdFromStore;

  const quickEmojis = ['😀', '😂', '😍', '👍', '🎉', '🚀', '💡', '❤️', '🔥', '😎', '🤔', '👏'];

  // Get current user data to display the real username
  const { data: currentUserData } = useUser(currentUserId || undefined);
  const userName = currentUserData?.name?.split(' ')[0] || currentUserId?.substring(0, 8) || 'guest';

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    });
  }, [message]);

  // Load/save drafts for the current channel
  useEffect(() => {
    const draft = currentChannelId ? messageDrafts[currentChannelId] || '' : '';
    setMessage(draft);
  }, [currentChannelId, messageDrafts]);

  // persist drafts as the user types (debounced)
  useEffect(() => {
    if (!currentChannelId) return;
    const tid = setTimeout(() => {
      if (message.trim()) setMessageDraft(currentChannelId, message);
      else clearMessageDraft(currentChannelId);
    }, 300);
    return () => clearTimeout(tid);
  }, [message, currentChannelId, setMessageDraft, clearMessageDraft]);

  const filteredUsers = mentionQuery
    ? allUsers.filter((u: any) => u.username?.toLowerCase().includes(mentionQuery.toLowerCase()) && u.id !== currentUserId)
    : [];

  const insertMention = (username: string) => {
    const before = message.slice(0, mentionStartRef.current);
    const after = message.slice(mentionStartRef.current);
    const rest = after.replace(/^@[a-z0-9_]*/i, '');
    setMessage(`${before}@${username} ${rest}`);
    setMentionOpen(false);
    setMentionQuery('');
    mentionStartRef.current = -1;
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setMessage(val);

    // Detect @mention trigger
    const textBeforeCursor = val.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@([a-z0-9_]*)$/i);
    if (atMatch) {
      mentionStartRef.current = atMatch.index!;
      setMentionQuery(atMatch[1] || '');
      setMentionOpen(true);
      setMentionIndex(0);
    } else {
      setMentionOpen(false);
      setMentionQuery('');
      mentionStartRef.current = -1;
    }
  };

  const handleSend = useCallback(async () => {
    if (!message.trim() || !currentChannelId || !currentUserId) return;
    if (sendMessageMutation.isPending) return; // prevent double-send

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        channelId: currentChannelId,
        content: message.trim(),
        authorId: currentUserId,
      });
      clearMessageDraft(currentChannelId);
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
  }, [message, currentChannelId, currentUserId, sendMessageMutation, clearMessageDraft, addToast]);

  const handleRetry = useCallback(() => {
    if (!message.trim() || !currentChannelId || !currentUserId) return;
    sendMessageMutation.mutate({
      channelId: currentChannelId,
      content: message.trim(),
      authorId: currentUserId,
    });
  }, [message, currentChannelId, currentUserId, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionOpen && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex].username);
        return;
      }
      if (e.key === 'Escape') {
        setMentionOpen(false);
        setMentionQuery('');
        mentionStartRef.current = -1;
        return;
      }
    }
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

  const detectedUrls = useMemo(
    () => showLinkPreviews ? extractUrls(message) : [],
    [message, showLinkPreviews]
  );

  return (
    <div className="composer">
      <div className="composer-prompt-line">
        <span className="prompt-user">{userName}</span>
        <span className="prompt-at">@</span>
        <span className="prompt-host">{currentOrgSlug}</span>
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
        <button
          className={`toolbar-btn ${showLinkPreviews ? 'toolbar-btn-active' : ''}`}
          title={showLinkPreviews ? 'Hide link previews' : 'Show link previews'}
          onClick={() => setShowLinkPreviews(p => !p)}
        >
          {showLinkPreviews ? <Eye size={14} /> : <EyeOff size={14} />}
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
        {detectedUrls.length > 0 && (
          <div className="composer-link-preview">
            {detectedUrls.slice(0, 1).map((url, i) => {
              const meta = safeUrlMeta(url);
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="composer-link-preview-card">
                  <div className="clp-body">
                    <div className="clp-header">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${meta.hostname}&sz=16`}
                        alt=""
                        className="clp-favicon"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="clp-domain">{meta.hostname}</span>
                    </div>
                    <div className="clp-title">{url.length > 60 ? url.slice(0, 60) + '...' : url}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
        <div className="composer-input-wrap">
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={currentChannelId ? "Message #channel..." : "Select a channel to send a message..."}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isSending || !currentChannelId}
          />
          {mentionOpen && filteredUsers.length > 0 && (
            <div className="mention-dropdown">
              {filteredUsers.slice(0, 8).map((u: any, i: number) => (
                <div
                  key={u.id}
                  className={`mention-item ${i === mentionIndex ? 'active' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(u.username); }}
                >
                  <span className="mention-item-name">@{u.username}</span>
                  <span className="mention-item-full">{u.name}</span>
                </div>
              ))}
            </div>
          )}
          <button
            className={`composer-send ${hasError ? 'composer-send-error' : ''}`}
            onClick={hasError ? handleRetry : handleSend}
            disabled={!message.trim() || isSending || !currentChannelId}
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