import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '@/lib/store';
import { useUser, useOrCreateDM, useMessages } from '@/hooks/useData';
import { useSendMessage } from '@/hooks/useData';
import { Avatar } from '../ui/Avatar';
import { ArrowLeft, Send, Smile, MoreHorizontal } from 'lucide-react';
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

  const { selectedDMUserId, setSelectedDMUser, currentUserId, currentOrgId, addToast } = useUIStore();
  const { data: otherUser, isLoading: userLoading } = useUser(selectedDMUserId || undefined);
  const orCreateDMMutation = useOrCreateDM();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(conversationId ?? undefined);
  const sendMessageMutation = useSendMessage();

  // Initialize or re-init DM conversation when DM user changes
  useEffect(() => {
    if (selectedDMUserId && currentUserId && currentOrgId) {
      // Reset conversation when switching users
      if (prevDMUserId.current !== selectedDMUserId) {
        prevDMUserId.current = selectedDMUserId;
        setConversationId(null);

        async function initDM() {
          try {
            if (!selectedDMUserId) return;
            const result = await orCreateDMMutation.mutateAsync({
              user1Id: currentUserId,
              user2Id: selectedDMUserId,
              orgId: currentOrgId,
            });
            // Handle both string and Id return types
            const id = typeof result === 'string' ? result : (result as any).toString?.() || result;
            if (id) {
              setConversationId(id);
            }
          } catch (err: any) {
            console.error('Failed to init DM:', err);
            addToast({ type: 'error', message: 'Failed to start direct message: ' + (err.message || 'Unknown error') });
          }
        }
        initDM();
      }
    }
  }, [selectedDMUserId, currentUserId, currentOrgId, orCreateDMMutation, addToast]);

  // Reset when panel closes
  useEffect(() => {
    if (!selectedDMUserId) {
      setConversationId(null);
      prevDMUserId.current = null;
      setMessage('');
    }
  }, [selectedDMUserId]);

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

  const handleSend = useCallback(() => {
    if (!message.trim() || !conversationId || !currentUserId) return;

    sendMessageMutation.mutate({
      channelId: conversationId,
      content: message.trim(),
      authorId: currentUserId,
    }, {
      onSuccess: () => {
        setMessage('');
        setShowEmoji(false);
      },
      onError: (err: any) => {
        addToast({ type: 'error', message: 'Failed to send DM: ' + (err.message || 'Check connection') });
      },
    });
  }, [message, conversationId, currentUserId, sendMessageMutation, addToast]);

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

  const formatTime = (date: Date) => {
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  if (!selectedDMUserId) return null;

  const isLoading = userLoading || messagesLoading || orCreateDMMutation.isPending;
  const otherUserName = otherUser?.name || 'User';

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
          onClick={() => addToast({ type: 'info', message: `DM info with ${otherUserName}` })}
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
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 12 }}>
              <span className="prompt-symbol">$</span>
              <span style={{ color: 'var(--fg-dim)' }}> dm --with </span>
              <span style={{ color: 'var(--cyan)' }}>{otherUserName}</span>
              <div style={{ marginTop: 8 }}>// no messages yet, start the conversation</div>
            </div>
          ) : messages.map((msg: any, idx: number) => {
            const isMine = msg.authorId === currentUserId;
            const prevMsg = messages[idx - 1];
            const showAvatar = !prevMsg || prevMsg.authorId !== msg.authorId;

            return (
              <div key={msg._id} className={`dm-message ${isMine ? 'mine' : 'theirs'} ${showAvatar ? '' : 'no-avatar'}`}>
                {!isMine && showAvatar && (
                  <Avatar name={otherUserName} size="sm" />
                )}
                {!isMine && !showAvatar && <div className="dm-avatar-space" />}
                <div className="dm-message-content">
                  {showAvatar && !isMine && (
                    <span className="dm-sender-name">{otherUserName}</span>
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
        <div className="dm-composer-inner">
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
            className="oc-input"
            disabled={isLoading}
          />
          <div className="dm-composer-actions">
            <button type="button" className="dm-tool-btn" onClick={() => setShowEmoji(!showEmoji)}>
              <Smile size={18} />
            </button>
            <button
              type="button"
              className="dm-send-btn"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
            >
              <Send size={18} />
            </button>
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