import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore, getCurrentUser } from '@/lib/store';
import { useUser, useOrCreateDM, useMessages, useSendMessage, useUsers } from '@/hooks/useData';
import { Avatar } from '../ui/Avatar';
import { ArrowLeft, Send, Smile, Bold, Italic, Code, Link2, MoreHorizontal } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const quickEmojis = ['😀', '😂', '😍', '👍', '🎉', '🚀', '💡', '❤️', '🔥', '😎', '🤔', '👏'];

export function DMPanel() {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevDMUserId = useRef<string | null>(null);

  const { selectedDMUserId, setSelectedDMUser, currentUserId, currentOrgId, addToast, openTab, setMessageDraft, clearMessageDraft, messageDrafts, setDMConversation } = useUIStore();
  const currentUser = getCurrentUser();
  const { data: otherUser, isLoading: userLoading } = useUser(selectedDMUserId || undefined);
  const { data: allUsers = [] } = useUsers();
  const orCreateDMMutation = useOrCreateDM();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(conversationId ?? undefined);
  const sendMessageMutation = useSendMessage();

  // Initialize DM conversation when DM user changes
  useEffect(() => {
    if (selectedDMUserId && currentUserId && currentOrgId) {
      if (prevDMUserId.current !== selectedDMUserId) {
        prevDMUserId.current = selectedDMUserId;
        setConversationId(null);

        const otherUserData = allUsers.find((u: any) => u.id === selectedDMUserId);
        const userName = otherUserData?.name || 'User';
        openTab({ id: selectedDMUserId, type: 'dm', name: userName });

        async function initDM() {
          const dmUserId = selectedDMUserId;
          const dmOrgId = currentOrgId;
          const dmCurrentUserId = currentUserId;
          if (!dmUserId || !dmCurrentUserId || !dmOrgId) return;
          try {
            const result = await orCreateDMMutation.mutateAsync({
              user1Id: dmCurrentUserId,
              user2Id: dmUserId,
              orgId: dmOrgId,
            });
            const id = typeof result === 'string' ? result : String(result);
            if (id) {
              setConversationId(id);
            }
          } catch (err: any) {
            addToast({ type: 'error', message: 'Failed to start DM: ' + (err.message || 'Unknown error') });
          }
        }
        initDM();
      }
    }
  }, [selectedDMUserId, currentUserId, currentOrgId, orCreateDMMutation, addToast, openTab, allUsers]);

  // Reset when panel closes
  useEffect(() => {
    if (!selectedDMUserId) {
      prevDMUserId.current = null;
      setConversationId(null);
      setMessage('');
    }
  }, [selectedDMUserId]);

  // Store conversationId in global map for notification watcher
  useEffect(() => {
    if (conversationId && selectedDMUserId) {
      setDMConversation(selectedDMUserId, conversationId);
    }
  }, [conversationId, selectedDMUserId, setDMConversation]);

  // Load/save drafts for the current DM user
  useEffect(() => {
    if (!selectedDMUserId) return;
    const draftKey = `dm-${selectedDMUserId}`;
    const draft = messageDrafts[draftKey] || '';
    setMessage(draft);
  }, [selectedDMUserId, messageDrafts]);

  // persist drafts as the user types (debounced)
  useEffect(() => {
    if (!selectedDMUserId) return;
    const draftKey = `dm-${selectedDMUserId}`;
    const tid = setTimeout(() => {
      if (message.trim()) setMessageDraft(draftKey, message);
      else clearMessageDraft(draftKey);
    }, 300);
    return () => clearTimeout(tid);
  }, [message, selectedDMUserId, setMessageDraft, clearMessageDraft]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  // Clear message input after successful send (observing mutation state)
  const prevStatusRef = useRef(sendMessageMutation.status);
  useEffect(() => {
    if (prevStatusRef.current === 'pending' && sendMessageMutation.status === 'success') {
      setMessage('');
      setShowEmoji(false);
    }
    prevStatusRef.current = sendMessageMutation.status;
  }, [sendMessageMutation.status]);

  const handleSend = useCallback(() => {
    if (!message.trim() || !conversationId || !currentUserId) return;
    if (sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      channelId: conversationId,
      content: message.trim(),
      authorId: currentUserId,
    });
  }, [message, conversationId, currentUserId, sendMessageMutation]);

  const handleRetry = useCallback(() => {
    if (!message.trim() || !conversationId || !currentUserId) return;
    sendMessageMutation.mutate({
      channelId: conversationId,
      content: message.trim(),
      authorId: currentUserId,
    });
  }, [message, conversationId, currentUserId, sendMessageMutation]);

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

  const formatTime = (date: Date) => {
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  if (!selectedDMUserId) return null;

  const isLoading = userLoading || messagesLoading || orCreateDMMutation.isPending;
  const otherUserName = otherUser?.name || 'User';
  const sendError = sendMessageMutation.isError;

  return (
    <aside className="dm-panel">
      <div className="dm-header">
        <button className="back-btn" onClick={() => setSelectedDMUser(null)}>
          <ArrowLeft size={18} />
        </button>
        <Avatar
          name={otherUserName}
          size="sm"
          status={(otherUser?.status || 'offline') as any}
        />
        <div className="dm-user-info">
          <span className="dm-user-name">{otherUserName}</span>
          <span className={`dm-user-status ${otherUser?.status || 'offline'}`}>
            {otherUser?.status || 'offline'}
          </span>
        </div>
        <button
          className="dm-menu-btn"
          onClick={() => addToast({ type: 'info', message: `DM with ${otherUserName}` })}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="dm-messages" ref={scrollRef}>
        <div className="dm-messages-inner">
          {isLoading && messages.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 12 }}>
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-dim)' }}> loading...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font)' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginBottom: 8 }}>
                <span className="prompt-symbol" style={{ color: 'var(--green)' }}>$</span>
                <span style={{ color: 'var(--fg-dim)' }}> dm --with </span>
                <span style={{ color: 'var(--cyan)' }}>{otherUserName}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-dim)', lineHeight: 1.8 }}>
                <div>// no messages yet — start the conversation</div>
                <div>
                  type below and press{' '}
                  <span style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    padding: '1px 5px',
                    fontSize: 10,
                    color: 'var(--fg-muted)',
                  }}>Enter</span>
                  {' '}to send,{' '}
                  <span style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    padding: '1px 5px',
                    fontSize: 10,
                    color: 'var(--fg-muted)',
                  }}>Shift+Enter</span>
                  {' '}for new line
                </div>
              </div>
            </div>
          ) : messages.map((msg: any, idx: number) => {
            const isMine = msg.authorId === currentUserId;
            const sender = allUsers.find((u: any) => u.id === msg.authorId);
            const senderName = sender?.name || 'User';
            const prevMsg = messages[idx - 1];
            const showAvatar = !prevMsg || prevMsg.authorId !== msg.authorId;

            return (
              <div key={msg._id} className={`dm-message ${isMine ? 'mine' : 'theirs'} ${showAvatar ? '' : 'no-avatar'}`}>
                {!isMine && showAvatar && (
                  <Avatar name={senderName} size="sm" />
                )}
                {!isMine && !showAvatar && <div className="dm-avatar-space" />}
                <div className="dm-message-content">
                  {showAvatar && !isMine && (
                    <span className="dm-sender-name">{senderName}</span>
                  )}
                  <div className="dm-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  <span className="dm-time">{formatTime(new Date(msg.createdAt))}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dm-composer">
        {sendError && (
          <div style={{ color: 'var(--red)', fontSize: 11, padding: '4px 0', textAlign: 'center' }}>
            Failed to send — type and click Send to retry
          </div>
        )}
        <div className="dm-prompt-line">
          <span className="prompt-user">{currentUser?.name?.split(' ')[0] || 'user'}</span>
          <span className="prompt-at">@</span>
          <span className="prompt-host">devlink</span>
          <span className="prompt-path">:~/{otherUserName}</span>
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd"> send --dm</span>
        </div>
        <div className="dm-toolbar">
          <button className="dm-tool-btn" title="Bold (Ctrl+B)" onClick={() => insertFormat('**')}>
            <Bold size={14} />
          </button>
          <button className="dm-tool-btn" title="Italic (Ctrl+I)" onClick={() => insertFormat('_')}>
            <Italic size={14} />
          </button>
          <button className="dm-tool-btn" title="Inline code" onClick={() => insertFormat('`')}>
            <Code size={14} />
          </button>
          <button className="dm-tool-btn" title="Link" onClick={() => insertFormat('[', '](url)')}>
            <Link2 size={14} />
          </button>
        </div>
        <div className="dm-composer-body">
          <div className="dm-input-wrap">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Message ${otherUserName}...`}
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="dm-textarea"
              disabled={!conversationId}
            />
            <div className="dm-composer-actions">
              <button type="button" className="dm-tool-btn" onClick={() => setShowEmoji(!showEmoji)}>
                <Smile size={18} />
              </button>
              <button
                type="button"
                className="dm-send-btn"
                onClick={handleSend}
                disabled={!message.trim() || !conversationId || sendMessageMutation.isPending}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
        {showEmoji && (
          <div className="dm-emoji-picker">
            {quickEmojis.map(emoji => (
              <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}