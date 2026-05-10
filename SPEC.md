# DevLink - Corporate Messaging Platform for Developers

## Concept & Vision

DevLink is a sleek, developer-focused messaging platform that feels like home for programmers. It combines the efficiency of terminal workflows with modern chat UX — fast, keyboard-driven, and aesthetically aligned with the tools developers already love. Think "if Discord and VS Code had a child."

Dark mode primary, monospace accents, syntax-highlighted code sharing, and a distraction-free interface that puts conversations first.

## Design Language

### Aesthetic Direction
IDE-inspired dark theme with electric blue accents. Clean lines, minimal chrome, information-dense but not cluttered. Feels like a premium dev tool, not a generic SaaS product.

### Color Palette
- `--bg-primary`: #0d1117 (deep dark)
- `--bg-secondary`: #161b22 (card/panel bg)
- `--bg-tertiary`: #21262d (hover states)
- `--bg-input`: #0d1117 (input fields)
- `--border`: #30363d (subtle borders)
- `--text-primary`: #e6edf3 (main text)
- `--text-secondary`: #8b949e (muted text)
- `--text-tertiary`: #6e7681 (timestamps, meta)
- `--accent`: #58a6ff (primary actions, links)
- `--accent-hover`: #79b8ff (hover state)
- `--success`: #3fb950 (online status, success)
- `--warning`: #d29922 (warnings)
- `--error`: #f85149 (errors, unread badge)
- `--code-bg`: #1a1f26 (inline code background)

### Typography
- **Headings**: JetBrains Mono (monospace, technical feel)
- **Body**: Inter (readable, professional)
- **Code/Meta**: JetBrains Mono

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48
- Border radius: 6px (subtle rounding)
- Message spacing: 8px between messages, 24px between message groups (different authors)

### Motion Philosophy
- Transitions: 150ms ease-out for micro-interactions
- Message appear: subtle fade + slide up (200ms)
- Panel transitions: smooth slide (250ms ease-out)
- Typing indicators: gentle pulse animation
- No excessive animation — speed is respect for developers' time

### Visual Assets
- **Icons**: Lucide React (consistent, minimal stroke icons)
- **Avatars**: Generated initials with gradient backgrounds
- **Code blocks**: Syntax highlighting with Prism.js styling
- **Decorative**: Minimal — maybe subtle grid pattern in empty states

## Layout & Structure

### Three-Column Layout
```
┌─────────────┬──────────────────┬─────────────────┐
│  Channels   │   Messages       │   User Panel    │
│  Sidebar    │   Main Area      │   (Contextual)  │
│  (240px)    │   (flex-1)       │   (280px)       │
└─────────────┴──────────────────┴─────────────────┘
```

- **Left Sidebar**: Channel list (TanStack Table), DM shortcuts, search trigger
- **Main Area**: Virtualized message list (TanStack Virtual), message composer
- **Right Panel**: Thread details, user info, or channel members (contextual)

### Responsive Strategy
- Desktop-first (1200px+ optimal)
- Tablet: Collapse right panel to overlay
- Mobile: Single column with navigation drawer

## Features & Interactions

### Core Features

1. **Channel Navigation**
   - Public channels list with description tooltips
   - Direct messages with recent activity indicator
   - Create channel modal (name, description, private toggle)
   - Join/leave channels

2. **Messaging**
   - Real-time message display (simulated with optimistic updates)
   - Thread replies (open in right panel)
   - Code block rendering with syntax highlighting
   - @mentions with autocomplete
   - Message reactions (emoji picker)
   - Edit/delete own messages
   - Reply/quote functionality

3. **Message Composer**
   - Rich text input with markdown support
   - Code block insertion with language selector
   - File attachment simulation
   - Emoji picker
   - Keyboard shortcuts (Ctrl+Enter to send)

4. **User Presence**
   - Online/away/offline status
   - Status custom message
   - Last seen timestamp

5. **Search**
   - Global search across messages
   - Filter by channel, author, date range
   - Jump to message

### Interaction Details

- **Message hover**: Show action buttons (react, reply, more)
- **Channel click**: Instant switch, scroll to bottom
- **New message**: Smooth scroll to bottom, subtle notification badge
- **Code block**: Click to copy, syntax highlighting by language
- **Mention click**: Navigate to user's profile context

### Edge Cases
- Empty channel: "No messages yet. Start the conversation!"
- Failed message send: Show retry button, red indicator
- Long messages: Collapse with "Show more" after 10 lines
- Disconnected: Banner with reconnection attempt

## Component Inventory

### ChannelSidebar
- Logo/brand mark at top
- Search input (Cmd+K trigger)
- Channel list with icons, unread badges
- DM section with user avatars
- Current user status indicator at bottom
- States: collapsed (icon only), expanded

### MessageList
- Virtualized with TanStack Virtual
- Date separators
- Message groups by author
- States: loading (skeleton), empty, populated, loading-more

### MessageBubble
- Avatar, author name, timestamp
- Message content with markdown/code rendering
- Action bar on hover
- States: default, edited, deleted, failed, highlighted

### MessageComposer
- Textarea with auto-resize
- Toolbar: bold, italic, code, link, attach, emoji
- Send button
- Character count (optional)
- States: empty, typing, sending, disabled

### ThreadPanel
- Original message preview
- Thread replies list
- Reply composer
- States: closed, open, loading

### UserCard
- Avatar, name, status
- Status message
- Quick actions (message, mention)
- States: online, away, offline, expanded

### ChannelHeader
- Channel name, description
- Member count, pinned count
- Search, notifications, settings icons
- States: default, searching

## Technical Approach

### Stack
- **Framework**: React 18 + Vite + TypeScript
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Forms**: TanStack Form
- **Tables**: TanStack Table (channel list)
- **Virtualization**: TanStack Virtual (message list)
- **State**: TanStack Store (Zustand adapter)
- **Styling**: CSS Modules with CSS variables

### Data Layer (Mock)
- In-memory store simulating backend
- Mock users, channels, messages
- Optimistic updates for instant feedback
- Simulated latency (200-500ms)

### Key Architecture Decisions
- Message list virtualized for performance with large histories
- Forms use TanStack Form for validation and field management
- TanStack Query handles caching and background refetch
- Zustand for ephemeral UI state (selected channel, panel visibility)

### File Structure
```
src/
├── components/
│   ├── ChannelSidebar/
│   ├── MessageList/
│   ├── MessageBubble/
│   ├── MessageComposer/
│   ├── ThreadPanel/
│   └── ui/
├── hooks/
├── lib/
│   ├── api.ts (mock API)
│   └── store.ts
├── routes/
├── styles/
└── types/
```
