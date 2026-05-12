import { useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import { useUIStore } from './store';
import { useChannels as useConvexChannels, useUsers as useConvexUsers, useMessages as useConvexMessages } from '../hooks/useData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EMPTY_ARRAY: any[] = [];

type NotificationPreferences = {
  desktopNotifications: boolean;
  soundAlerts: boolean;
  messagePreview: boolean;
  channelNotifications: boolean;
};

type SecurityPreferences = {
  twoFAEnabled: boolean;
  githubLinked: boolean;
};

type Preferences = {
  theme: 'dark' | 'light';
  fontSize: number;
  showThreads: boolean;
  sidebarVisible: boolean;
  notifications: NotificationPreferences;
  security: SecurityPreferences;
};

const PREFERENCES_KEY = 'devlink-preferences';
const defaultPreferences: Preferences = {
  theme: 'dark',
  fontSize: 13,
  showThreads: false,
  sidebarVisible: true,
  notifications: {
    desktopNotifications: true,
    soundAlerts: true,
    messagePreview: true,
    channelNotifications: false,
  },
  security: {
    twoFAEnabled: false,
    githubLinked: false,
  },
};

let preferencesState: Preferences = defaultPreferences;
const preferenceListeners = new Set<() => void>();

const isBrowser = typeof window !== 'undefined';

function getStoredPreferences(): Preferences {
  if (!isBrowser) return defaultPreferences;
  const saved = window.localStorage.getItem(PREFERENCES_KEY);
  if (!saved) return defaultPreferences;

  try {
    const parsed = JSON.parse(saved) as Partial<Preferences>;
    return {
      ...defaultPreferences,
      ...parsed,
      notifications: {
        ...defaultPreferences.notifications,
        ...(parsed.notifications || {}),
      },
      security: {
        ...defaultPreferences.security,
        ...(parsed.security || {}),
      },
    };
  } catch {
    return defaultPreferences;
  }
}

function applyPreferences(preferences: Preferences) {
  if (!isBrowser) return;
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.style.setProperty('--font-size', `${preferences.fontSize}px`);
}

function setPreferencesState(updates: Partial<Preferences> | ((prev: Preferences) => Preferences)) {
  const nextPreferences = typeof updates === 'function'
    ? updates(preferencesState)
    : { ...preferencesState, ...updates };

  preferencesState = {
    ...preferencesState,
    ...nextPreferences,
    notifications: {
      ...preferencesState.notifications,
      ...(nextPreferences.notifications || {}),
    },
    security: {
      ...preferencesState.security,
      ...(nextPreferences.security || {}),
    },
  };

  if (isBrowser) {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferencesState));
    applyPreferences(preferencesState);
  }

  preferenceListeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  preferenceListeners.add(listener);
  return () => preferenceListeners.delete(listener);
}

function getSnapshot() {
  return preferencesState;
}

export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored !== preferencesState) {
      preferencesState = stored;
      applyPreferences(preferencesState);
      preferenceListeners.forEach((listener) => listener());
    }
  }, []);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferencesState(updates);
  };

  const toggleSidebar = () => {
    setPreferencesState((prev) => ({ ...prev, sidebarVisible: !prev.sidebarVisible }));
  };

  const toggleThreads = () => {
    setPreferencesState((prev) => ({ ...prev, showThreads: !prev.showThreads }));
  };

  return { preferences, updatePreferences, toggleSidebar, toggleThreads };
}

export function useChannels() {
  const currentOrgId = useUIStore((state) => state.currentOrgId);
  const currentUserId = useUIStore((state) => state.currentUserId);
  // Pass orgId only if it looks like a real Convex ID (not a mock like 'o1')
  const queryOrgId = currentOrgId && !currentOrgId.match(/^o\d+$/) ? currentOrgId : undefined;
  const { data: channelsData, isLoading, isError } = useConvexChannels(queryOrgId, currentUserId || undefined);

  // Ensure channels is always an array, never undefined
  const channels = useMemo(() => {
    if (!channelsData) return EMPTY_ARRAY;
    // Map Convex format to expected format
    return channelsData.map((c: any) => ({
      id: c._id,
      name: c.name,
      type: c.type,
      description: c.description,
      members: c.members || EMPTY_ARRAY,
      unreadCount: c.unreadCount || 0,
    }));
  }, [channelsData]);

  return { channels, isLoading, isError };
}

export function useUsers() {
  const { data: usersData, isLoading, isError } = useConvexUsers();

  // Ensure users is always an array, never undefined
  const users = useMemo(() => {
    if (!usersData) return EMPTY_ARRAY;
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

// Debounce hook for production-ready rate limiting
export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timeoutRef = useRef<number | null>(null);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      fn(...args);
      timeoutRef.current = null;
    }, delay);
  }, [fn, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}