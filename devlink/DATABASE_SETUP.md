# DevLink Database Architecture

## Overview

DevLink now uses a **hybrid database architecture** combining:

1. **Convex** - Real-time backend database (cloud-hosted)
2. **TanStack Query** - Local caching with persistence (offline support)

This gives you the best of both worlds:
- ✅ Real-time updates from Convex
- ✅ Offline support via TanStack Query persistence
- ✅ Optimistic UI updates with automatic rollback on errors
- ✅ Automatic cache management
- ✅ Type-safe data layer

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        DevLink App                           │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│       │                                                      │
│       ▼                                                      │
│  TanStack Query (useData.ts hooks)                          │
│  ├─ Caches data locally                                      │
│  ├─ Handles optimistic updates                             │
│  ├─ Persists to localStorage                                │
│  └─ Syncs with Convex backend                              │
│       │                                                      │
│       ▼                                                      │
│  Convex (convex/ folder)                                     │
│  ├─ Real-time queries                                        │
│  ├─ Mutations (create, update, delete)                      │
│  └─ Server-side business logic                            │
│       │                                                      │
│       ▼                                                      │
│  Convex Cloud (Database)                                     │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
devlink/
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema
│   ├── users.ts              # User queries/mutations
│   ├── channels.ts           # Channel queries/mutations
│   ├── messages.ts           # Message queries/mutations
│   ├── organizations.ts      # Organization queries/mutations
│   ├── seed.ts               # Seed data script
│   └── http.ts               # HTTP actions
│
├── src/
│   ├── hooks/
│   │   └── useData.ts        # TanStack Query hooks
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   └── index.ts      # Data layer exports
│   │   ├── queryClient.ts    # TanStack Query config
│   │   └── store.ts          # Zustand UI state only
│   │
│   └── main.tsx              # Providers setup
```

## Usage Examples

### Fetching Data

```typescript
import { useUsers, useChannels, useMessages } from './hooks/useData';

function MyComponent() {
  // Automatically cached and persisted
  const { data: users, isLoading, isError } = useUsers();
  const { data: channels } = useChannels('org-id');
  const { data: messages } = useMessages('channel-id');
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;
  
  return <div>{users?.length} users</div>;
}
```

### Mutations (with Optimistic Updates)

```typescript
import { useSendMessage, useAddReaction } from './hooks/useData';

function MessageComposer({ channelId, userId }) {
  const sendMessage = useSendMessage();
  
  const handleSend = (content: string) => {
    sendMessage.mutate({
      channelId,
      content,
      authorId: userId,
    });
  };
  
  return (
    <div>
      <input onSubmit={handleSend} />
      {sendMessage.isPending && <span>Sending...</span>}
    </div>
  );
}
```

### Available Hooks

**Users:**
- `useUsers()` - Get all users
- `useUser(userId)` - Get single user
- `useCreateUser()` - Create a user
- `useUpdateUserStatus()` - Update user status (with optimistic update)

**Channels:**
- `useChannels(orgId?)` - Get all channels
- `useChannel(channelId)` - Get single channel
- `useCreateChannel()` - Create a channel

**Messages:**
- `useMessages(channelId)` - Get channel messages
- `useSendMessage()` - Send message (with optimistic update)
- `useAddReaction()` - Add reaction (with optimistic update)
- `useEditMessage()` - Edit message (with optimistic update)

**Organizations:**
- `useOrganizations()` - Get all orgs
- `useOrganization(orgId)` - Get single org
- `useCreateOrganization()` - Create an org

## Offline Support

TanStack Query persistence stores data in `localStorage`:
- Data persists across browser restarts
- Works offline (reads from cache)
- Automatically syncs when back online
- Configured in `src/lib/queryClient.ts`

## Optimistic Updates

All mutations include optimistic updates:
1. UI updates immediately (before server response)
2. If server fails, changes are rolled back automatically
3. User sees instant feedback

Example: Adding a reaction
```typescript
// UI updates instantly
queryClient.setQueryData(['messages', channelId], (old) => {
  return old.map(msg => {
    if (msg._id === messageId) {
      return { ...msg, reactions: [...msg.reactions, newReaction] };
    }
    return msg;
  });
});

// Server request happens in background
await addReactionConvex({ messageId, emoji, userId });

// If fails, automatic rollback to previous state
```

## Convex Setup

### 1. Install Convex CLI

```bash
npm install -g convex
# or
pnpm add -g convex
```

### 2. Initialize Convex Project

```bash
cd /home/khyle/Codes/system8/devlink
convex dev
```

This will:
- Create a Convex project
- Deploy the schema
- Generate the `_generated` folder
- Provide a `VITE_CONVEX_URL` for `.env`

### 3. Configure Environment

Copy `.env.example` to `.env` and add your Convex URL:

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### 4. Seed Initial Data

```bash
convex run seed:seed
```

## Data Flow

1. **Component renders** → Calls `useQuery()` hook
2. **TanStack Query checks cache** → Returns cached data immediately
3. **Convex subscription starts** → Fetches fresh data from server
4. **Cache updates** → UI re-renders with new data
5. **Data persists** → Saved to localStorage for offline use

## Zustand Store (UI State Only)

The Zustand store (`src/lib/store.ts`) now only handles UI state:
- Selected channel/thread
- Modal open/close states
- Current user session
- Message drafts
- Starred channels
- Failed message tracking

**No longer stores:** Users, channels, messages (now in Convex + TanStack Query)

## Benefits

| Feature | Before (Mock) | After (Convex + TanStack Query) |
|---------|----------------|--------------------------------|
| Real-time | ❌ | ✅ |
| Offline | ❌ | ✅ |
| Persistence | localStorage only | Cloud + localStorage |
| Multi-user | ❌ | ✅ |
| Optimistic UI | Manual | Automatic |
| Type Safety | Partial | Full |
| Cache Management | Manual | Automatic |

## Troubleshooting

### "VITE_CONVEX_URL not found"
- Run `convex dev` to get your URL
- Add it to `.env` file

### "Convex functions not found"
- Make sure `convex dev` is running
- Check that `_generated` folder exists

### "Data not persisting"
- Check localStorage has `devlink-query-cache` key
- Verify `PersistQueryClientProvider` is in `main.tsx`

## Next Steps

1. ✅ Run `convex dev` to initialize
2. ✅ Copy `VITE_CONVEX_URL` to `.env`
3. ✅ Seed the database: `convex run seed:seed`
4. ✅ Start the dev server: `pnpm dev`
5. ✅ Test sending messages offline
6. ✅ Verify data syncs when back online
