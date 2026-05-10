import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

// Create a QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Lazy persister that only accesses localStorage in browser
let persisterInstance: ReturnType<typeof createSyncStoragePersister> | null = null;

export function getPersister() {
  if (!persisterInstance && typeof window !== 'undefined') {
    persisterInstance = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'devlink-query-cache',
      throttleTime: 1000,
    });
  }
  return persisterInstance;
}

// For backward compatibility - will be null on server
export const persister = typeof window !== 'undefined' 
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: 'devlink-query-cache',
      throttleTime: 1000,
    })
  : null as any;

// Export the PersistQueryClientProvider for use in main.tsx
export { PersistQueryClientProvider };
