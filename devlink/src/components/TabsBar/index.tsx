import { useUIStore } from '@/lib/store';
import { X, Hash, MessageSquare, User } from 'lucide-react';
import { useMarkChannelRead, useMarkDMRead } from '@/hooks/useData';

interface TabsBarProps {
  channels: Array<{ _id: string; name: string; unreadCount?: number; unread?: string[] }>;
}

export function TabsBar({ channels }: TabsBarProps) {
  const { openTabs, activeTabId, closeTab, setActiveTab, setSelectedChannel, setSelectedDMUser, tabNotifications, currentUserId } = useUIStore();
  const markChannelRead = useMarkChannelRead();
  const markDMRead = useMarkDMRead();

  if (openTabs.length === 0) return null;

  const handleTabClick = (tab: typeof openTabs[0]) => {
    setActiveTab(tab.id);
    if (tab.type === 'channel') {
      setSelectedChannel(tab.id);
      const channel = channels.find(c => c._id === tab.id);
      const hasUnread = channel?.unread?.includes(currentUserId || '');
      if (hasUnread) markChannelRead.mutate({ channelId: tab.id });
    } else if (tab.type === 'dm') {
      setSelectedDMUser(tab.id);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="tabs-bar">
       <div className="tabs-list">
          {openTabs.map((tab) => {
            // Find unread count for channel tabs
            let unreadCount = 0;
            let hasUnread = false;
            if (tab.type === 'channel') {
              const channel = channels.find(c => c._id === tab.id);
              unreadCount = channel?.unreadCount || 0;
              hasUnread = channel?.unread?.includes(currentUserId || '') || false;
            }
            
            return (
              <div
                key={tab.id}
                className={`tab-item ${activeTabId === tab.id ? 'active' : ''} ${tabNotifications[tab.id] ? 'tab-notification' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                <span className="tab-icon">
                  {tab.type === 'channel' ? <Hash size={12} /> : tab.type === 'dm' ? <MessageSquare size={12} /> : <User size={12} />}
                </span>
                <span className="tab-name">{tab.name}</span>
                {hasUnread && unreadCount > 0 && (
                  <span className="tab-unread-badge">{unreadCount}</span>
                )}
                <button
                  className="tab-close"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
       </div>
    </div>
  );
}