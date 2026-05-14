export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  pinnedCount: number;
  lastActivity?: Date;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  isPinned?: boolean;
  threadId?: string;
  reactions: Reaction[];
  replies: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Thread {
  id: string;
  parentMessageId: string;
  channelId: string;
  replies: Message[];
}

export interface DirectMessage {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  lastActivity: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  code: string;
  visibility?: 'public' | 'private';
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  memberCount: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentOrg: Organization | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchOrg: (orgId: string) => void;
}
