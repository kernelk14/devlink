import { useUIStore } from '@/lib/store';
import { X, Hash, MessageSquare } from 'lucide-react';

export function TabsBar() {
  const { openTabs, activeTabId, closeTab, setActiveTab, setSelectedChannel, setSelectedDMUser, tabNotifications } = useUIStore();

  if (openTabs.length === 0) return null;

  const handleTabClick = (tab: typeof openTabs[0]) => {
    setActiveTab(tab.id);
    if (tab.type === 'channel') {
      setSelectedChannel(tab.id);
    } else {
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
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTabId === tab.id ? 'active' : ''} ${tabNotifications[tab.id] ? 'tab-notification' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            <span className="tab-icon">
              {tab.type === 'channel' ? <Hash size={12} /> : <MessageSquare size={12} />}
            </span>
            <span className="tab-name">{tab.name}</span>
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(e, tab.id)}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}