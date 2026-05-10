import { useEffect, useState, useMemo } from 'react';
import { useUIStore } from './store';
import { useChannels as useConvexChannels, useUsers as useConvexUsers, useMessages as useConvexMessages } from '../hooks/useData';

export function useChannels() {
  const currentOrgId = useUIStore((state) => state.currentOrgId);
  const currentUserId = useUIStore((state) => state.currentUserId);
  // Pass orgId only if it looks like a real Convex ID (not a mock like 'o1')
  const queryOrgId = currentOrgId && !currentOrgId.match(/^o\d+$/) ? currentOrgId : undefined;
  const { data: channelsData, isLoading, isError } = useConvexChannels(queryOrgId, currentUserId || undefined);
  
  // Ensure channels is always an array, never undefined
  const channels = useMemo(() => {
    if (!channelsData) return [];
    // Map Convex format to expected format
    return channelsData.map((c: any) => ({
      id: c._id,
      name: c.name,
      type: c.type,
      description: c.description,
      members: c.members || [],
      unreadCount: c.unreadCount || 0,
    }));
  }, [channelsData]);
  
  return { channels, isLoading, isError };
}

export function useUsers() {
  const { data: usersData, isLoading, isError } = useConvexUsers();
  
  // Ensure users is always an array, never undefined
  const users = useMemo(() => {
    if (!usersData) return [];
    // Map Convex format to expected format
    return usersData.map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      username: u.username,
      avatar: u.avatar,
      status: u.status,
      statusMessage: u.statusMessage,
      color: u.color,
    }));
  }, [usersData]);
  
  return { users, isLoading, isError };
}

export function usePreferences() {
  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'dark' | 'light',
    fontSize: 13,
    showThreads: false,
    sidebarVisible: true,
    settings: {},
  });

  const updatePreferences = (updates: Partial<typeof preferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const toggleSidebar = () => {
    setPreferences((prev) => ({ ...prev, sidebarVisible: !prev.sidebarVisible }));
  };

  const toggleThreads = () => {
    setPreferences((prev) => ({ ...prev, showThreads: !prev.showThreads }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('devlink-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('devlink-preferences', JSON.stringify(preferences));
  }, [preferences]);

  return { preferences, updatePreferences, toggleSidebar, toggleThreads };
}

export function useAuth() {
  const isAuthenticated = useUIStore((state) => state.isAuthenticated);
  const login = useUIStore((state) => state.login);
  const logout = useUIStore((state) => state.logout);
  const currentUserStatus = useUIStore((state) => state.currentUserStatus);

  const user = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      name: 'Alex Chen',
      email: 'alex@devlink.io',
      status: currentUserStatus,
    };
  }, [isAuthenticated, currentUserStatus]);

  return {
    user,
    isAuthenticated,
    login: (username: string, password: string) => {
      return login(username, 'hook-user');
    },
    logout,
  };
}

export function useMessages(channelId: string) {
  const { data: messagesData, isLoading, isError } = useConvexMessages(channelId);
  
  // Ensure messages is always an array, never undefined
  const messages = useMemo(() => {
    if (!messagesData) return [];
    // Map Convex format to expected format
    return messagesData.map((m: any) => ({
      id: m._id,
      channelId: m.channelId,
      authorId: m.authorId,
      content: m.content,
      timestamp: new Date(m.createdAt).toISOString(),
      isEdited: m.isEdited,
      isPinned: m.isPinned,
      reactions: m.reactions || [],
      replies: m.replies || 0,
    }));
  }, [messagesData]);
  
  return { messages, isLoading, isError };
}

export function useKeyboardShortcuts() {
  const { toggleSettings, toggleShortcutsModal } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
      
      if (isMeta && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
      
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        toggleShortcutsModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSettings, toggleShortcutsModal]);
}

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const toasts = useUIStore((state) => state.toasts);

  return { toasts, addToast, removeToast };
}