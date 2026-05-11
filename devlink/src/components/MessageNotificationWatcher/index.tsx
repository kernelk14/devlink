import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { useMessages, useUsers } from '@/hooks/useData';

interface Props {
  tabId: string;
  channelId?: string;
  isActive: boolean;
  name: string;
  type: 'channel' | 'dm';
}

export function MessageNotificationWatcher({ tabId, channelId, isActive, name, type }: Props) {
  const { data: messages = [] } = useMessages(channelId);
  const { data: allUsers = [] } = useUsers();
  const lastIdRef = useRef<string | undefined>(undefined);
  const usersRef = useRef(allUsers);
  usersRef.current = allUsers;

  const { addToast, setTabNotification, currentUserId } = useUIStore();

  useEffect(() => {
    if (!channelId || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // First data load: record the latest message ID as baseline
    if (lastIdRef.current === undefined) {
      lastIdRef.current = lastMsg._id;
      return;
    }

    // Last message ID changed — new message arrived
    if (lastMsg._id !== lastIdRef.current) {
      lastIdRef.current = lastMsg._id;

      if (lastMsg.authorId !== currentUserId && !isActive) {
        const sender = usersRef.current.find((u: any) => u.id === lastMsg.authorId);
        const senderName = sender?.name || 'Unknown';
        const preview = lastMsg.content?.slice(0, 80) || '';
        const label = type === 'dm' ? senderName : `#${name}`;
        const body = type === 'dm' ? preview : `${senderName}: ${preview}`;

        addToast({ type: 'info', message: `[${label}] ${body}` });

        setTabNotification(tabId);
      }
    }
  }, [messages, channelId, currentUserId, tabId, isActive, name, type, addToast, setTabNotification]);

  return null;
}
