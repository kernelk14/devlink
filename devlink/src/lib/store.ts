import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

const mockOrgs = [
  { id: 'o1', name: 'DevLink Inc', slug: 'devlink', role: 'owner', memberCount: 47 },
  { id: 'o2', name: 'Open Source Projects', slug: 'oss', role: 'member', memberCount: 12 },
  { id: 'o3', name: 'Personal Workspace', slug: 'personal', role: 'owner', memberCount: 1 },
];

export type UserStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'announcement';
  description?: string;
  members?: string[];
  unreadCount?: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  color?: string;
  status?: UserStatus;
}

interface UIState {
  selectedChannelId: string;
  selectedThreadId: string | null;
  selectedDMUserId: string | null;
  searchQuery: string;
  isThreadPanelOpen: boolean;
  isSearchOpen: boolean;
  isMembersOpen: boolean;
  isPinnedOpen: boolean;
  isSettingsOpen: boolean;
  isChannelSettingsOpen: boolean;
  isInviteModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isUserProfileOpen: boolean;
  viewingUserId: string | null;
  showCreateChannel: boolean;
  highlightedMessageId: string | null;
  isAuthenticated: boolean;
  currentEmail: string;
  currentOrgId: string;
  currentUserStatus: UserStatus;
  unreadChannels: string[];
  typingUsers: Record<string, string[]>;
  messageDrafts: Record<string, string>;
  savedMessages: string[];
  starredChannels: string[];
  toasts: Toast[];
  currentUserId: string;
  editingMessage: string | null;
  sidebarCollapsed: boolean;
  failedMessages: Set<string>;
  setSelectedChannel: (channelId: string) => void;
  setSelectedDMUser: (userId: string | null) => void;
  setSelectedThread: (threadId: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleThreadPanel: (open?: boolean) => void;
  toggleSearch: (open?: boolean) => void;
  toggleMembers: (open?: boolean) => void;
  togglePinned: (open?: boolean) => void;
  toggleSettings: (open?: boolean) => void;
  toggleChannelSettings: (open?: boolean) => void;
  toggleInviteModal: (open?: boolean) => void;
  toggleShortcutsModal: (open?: boolean) => void;
  toggleUserProfile: (open?: boolean) => void;
  toggleSidebar: (open?: boolean) => void;
  setViewingUser: (userId: string | null) => void;
  setShowCreateChannel: (show: boolean) => void;
  highlightMessage: (messageId: string | null) => void;
  clearHighlight: () => void;
  login: (email: string) => boolean;
  logout: () => void;
  switchOrg: (orgId: string) => void;
  setCurrentUserStatus: (status: UserStatus) => void;
  markChannelRead: (channelId: string) => void;
  markChannelUnread: (channelId: string) => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
  setMessageDraft: (channelId: string, content: string) => void;
  clearMessageDraft: (channelId: string) => void;
  toggleStarredChannel: (channelId: string) => void;
  toggleSavedMessage: (messageId: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setEditingMessage: (id: string | null) => void;
  addFailedMessage: (messageId: string) => void;
  removeFailedMessage: (messageId: string) => void;
  clearFailedMessages: () => void;
}


export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      selectedChannelId: '',
      selectedThreadId: null,
      selectedDMUserId: null,
      searchQuery: '',
      isThreadPanelOpen: false,
      isSearchOpen: false,
      isMembersOpen: false,
      isPinnedOpen: false,
      isSettingsOpen: false,
      isChannelSettingsOpen: false,
      isInviteModalOpen: false,
      isShortcutsModalOpen: false,
      isUserProfileOpen: false,
      viewingUserId: null,
      showCreateChannel: false,
      highlightedMessageId: null,
      isAuthenticated: false,
      currentEmail: '',
      currentOrgId: 'o1',
      currentUserStatus: 'online',
      unreadChannels: [],
      typingUsers: {},
      messageDrafts: {},
      savedMessages: [],
      starredChannels: [],
      toasts: [],
      currentUserId: '',
      editingMessage: null,
       sidebarCollapsed: false,
       failedMessages: new Set<string>(),
       
       setSelectedChannel: (channelId) => set((state) => {
        state.selectedChannelId = channelId;
        state.selectedThreadId = null;
        state.isThreadPanelOpen = false;
        state.isSearchOpen = false;
        state.isMembersOpen = false;
        state.isPinnedOpen = false;
        state.highlightedMessageId = null;
        state.selectedDMUserId = null;
      }),
      
      setSelectedDMUser: (userId) => set((state) => {
        state.selectedDMUserId = userId;
        if (userId) {
          state.selectedChannelId = '';
          const dmKey = `dm-${userId}`;
          state.unreadChannels = state.unreadChannels.filter(c => c !== dmKey);
        }
      }),
      
      setSelectedThread: (threadId) => set((state) => {
        state.selectedThreadId = threadId;
        if (threadId) state.isThreadPanelOpen = true;
      }),
      
      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query;
      }),
      
      toggleThreadPanel: (open) => set((state) => {
        state.isThreadPanelOpen = open ?? !state.isThreadPanelOpen;
      }),
      
      toggleSearch: (open) => set((state) => {
        state.isSearchOpen = open ?? !state.isSearchOpen;
      }),
      
      toggleMembers: (open) => set((state) => {
        state.isMembersOpen = open ?? !state.isMembersOpen;
      }),
      
      togglePinned: (open) => set((state) => {
        state.isPinnedOpen = open ?? !state.isPinnedOpen;
      }),
      
      toggleSettings: (open) => set((state) => {
        state.isSettingsOpen = open ?? !state.isSettingsOpen;
      }),
      
      toggleChannelSettings: (open) => set((state) => {
        state.isChannelSettingsOpen = open ?? !state.isChannelSettingsOpen;
      }),
      
      toggleInviteModal: (open) => set((state) => {
        state.isInviteModalOpen = open ?? !state.isInviteModalOpen;
      }),
      
      toggleShortcutsModal: (open) => set((state) => {
        state.isShortcutsModalOpen = open ?? !state.isShortcutsModalOpen;
      }),
      
      toggleUserProfile: (open) => set((state) => {
        state.isUserProfileOpen = open ?? !state.isUserProfileOpen;
      }),
      
      toggleSidebar: (open) => set((state) => {
        state.sidebarCollapsed = open ?? !state.sidebarCollapsed;
      }),
      
      setViewingUser: (userId) => set((state) => {
        state.viewingUserId = userId;
        state.isUserProfileOpen = userId !== null;
      }),
      
      setShowCreateChannel: (show) => set((state) => {
        state.showCreateChannel = show;
      }),
      
      highlightMessage: (messageId) => set((state) => {
        state.highlightedMessageId = messageId;
        state.isPinnedOpen = false;
        state.isSearchOpen = false;
        state.isMembersOpen = false;
      }),
      
      clearHighlight: () => set((state) => {
        state.highlightedMessageId = null;
      }),
      
      login: (email: string, userId: string) => set((state) => {
        state.isAuthenticated = true;
        state.currentEmail = email;
        state.currentUserId = userId;
      }),

      logout: () => set((state) => {
        state.isAuthenticated = false;
        state.currentEmail = '';
        state.currentUserId = '';
        state.selectedChannelId = '';
        state.selectedDMUserId = null;
        state.currentUserStatus = 'offline';
      }),
      
      switchOrg: (orgId) => set((state) => {
        state.currentOrgId = orgId;
      }),
      
      setCurrentUserStatus: (status) => set((state) => {
        state.currentUserStatus = status;
      }),
      
      markChannelRead: (channelId) => set((state) => {
        state.unreadChannels = state.unreadChannels.filter(id => id !== channelId);
      }),
      
      markChannelUnread: (channelId) => set((state) => {
        if (!state.unreadChannels.includes(channelId)) {
          state.unreadChannels.push(channelId);
        }
      }),
      
      setTyping: (channelId, userId) => set((state) => {
        if (!state.typingUsers[channelId]) {
          state.typingUsers[channelId] = [];
        }
        if (!state.typingUsers[channelId].includes(userId)) {
          state.typingUsers[channelId].push(userId);
        }
      }),
      
      clearTyping: (channelId, userId) => set((state) => {
        if (state.typingUsers[channelId]) {
          state.typingUsers[channelId] = state.typingUsers[channelId].filter(id => id !== userId);
        }
      }),
      
      setMessageDraft: (channelId, content) => set((state) => {
        state.messageDrafts[channelId] = content;
      }),
      
      clearMessageDraft: (channelId) => set((state) => {
        delete state.messageDrafts[channelId];
      }),
      
      toggleStarredChannel: (channelId) => set((state) => {
        const idx = state.starredChannels.indexOf(channelId);
        if (idx >= 0) {
          state.starredChannels.splice(idx, 1);
        } else {
          state.starredChannels.push(channelId);
        }
      }),
      
      toggleSavedMessage: (messageId) => set((state) => {
        const idx = state.savedMessages.indexOf(messageId);
        if (idx >= 0) {
          state.savedMessages.splice(idx, 1);
        } else {
          state.savedMessages.push(messageId);
        }
      }),
      
      addToast: (toast) => set((state) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        state.toasts.push({ ...toast, id });
        
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 4000);
        }
      }),
      
      removeToast: (id) => set((state) => {
        state.toasts = state.toasts.filter(t => t.id !== id);
      }),

      setEditingMessage: (id) => set((state) => {
        state.editingMessage = id;
      }),

      addFailedMessage: (messageId) => set((state) => {
        state.failedMessages.add(messageId);
      }),

      removeFailedMessage: (messageId) => set((state) => {
        state.failedMessages.delete(messageId);
      }),

      clearFailedMessages: () => set((state) => {
        state.failedMessages.clear();
      }),
    })),
    {
      name: 'devlink-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentEmail: state.currentEmail,
        currentOrgId: state.currentOrgId,
        selectedChannelId: state.selectedChannelId,
        selectedDMUserId: state.selectedDMUserId,
        unreadChannels: state.unreadChannels,
        messageDrafts: state.messageDrafts,
        savedMessages: state.savedMessages,
        starredChannels: state.starredChannels,
        currentUserStatus: state.currentUserStatus,
      }),
    }
  )
);

export const useStore = useUIStore;

export function getCurrentUserState(): CurrentUser {
  const state = useUIStore.getState();
  return {
    id: state.currentUserId || 'guest',
    name: state.currentEmail ? state.currentEmail.split('@')[0] : 'Guest',
    email: state.currentEmail || 'guest@devlink.io',
    color: 'var(--purple)',
    status: state.currentUserStatus,
  };
}

export const getCurrentUser = getCurrentUserState;

export { mockOrgs };
