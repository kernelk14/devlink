import type { User } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Sarah Chen', username: 'sarahc', email: 'sarah@devlink.io', status: 'online', statusMessage: 'Building cool stuff' },
  { id: 'u2', name: 'Marcus Johnson', username: 'marcusj', email: 'marcus@devlink.io', status: 'online', statusMessage: 'Code review mode' },
  { id: 'u3', name: 'Elena Rodriguez', username: 'elenar', email: 'elena@devlink.io', status: 'away' },
  { id: 'u4', name: 'James Kim', username: 'jamesk', email: 'james@devlink.io', status: 'offline', statusMessage: 'AFK' },
  { id: 'u5', name: 'Priya Patel', username: 'priyap', email: 'priya@devlink.io', status: 'online', statusMessage: 'Deploying to prod' },
  { id: 'u6', name: 'Alex Thompson', username: 'alext', email: 'alex@devlink.io', status: 'online' },
  { id: 'u7', name: 'Nina Kowalski', username: 'ninak', email: 'nina@devlink.io', status: 'online', statusMessage: 'In the zone' },
];

export const currentUser = mockUsers[0];

export interface ChannelData {
  id: string;
  name: string;
  type: 'public' | 'private' | 'announcement';
  description?: string;
  members?: string[];
  unreadCount?: number;
  threads?: any[];
  memberCount?: number;
  pinnedCount?: number;
}

export const mockChannels: ChannelData[] = [
  { id: 'c1', name: 'general', type: 'public', description: 'Company-wide announcements and general discussion', members: [], threads: [], memberCount: 7, pinnedCount: 2 },
  { id: 'c2', name: 'engineering', type: 'public', description: 'Engineering team discussions', members: [], threads: [], memberCount: 5, pinnedCount: 1 },
  { id: 'c3', name: 'frontend', type: 'public', description: 'Frontend development', members: [], threads: [], memberCount: 4, pinnedCount: 1 },
  { id: 'c4', name: 'backend', type: 'public', description: 'Backend services', members: [], threads: [], memberCount: 3, pinnedCount: 0 },
  { id: 'c5', name: 'devops', type: 'public', description: 'CI/CD and deployments', members: [], threads: [], memberCount: 3, pinnedCount: 1 },
  { id: 'c6', name: 'random', type: 'public', description: 'Non-work banter', members: [], threads: [], memberCount: 7, pinnedCount: 0 },
  { id: 'c7', name: 'code-review', type: 'private', description: 'PR reviews and feedback', members: [], threads: [], memberCount: 3, pinnedCount: 1 },
];

export interface ThreadData {
  id: string;
  channelId: string;
  parentMessageId: string;
  user: any;
  content: string;
  timestamp: string;
  replies: any[];
}

export const mockMessages: any[] = [
  { id: 'm1', channelId: 'c1', user: { id: 'u1', name: 'Alex Chen', color: 'var(--purple)' }, content: 'Hey team, just pushed the new feature to staging. Can someone review it?', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'm2', channelId: 'c1', user: { id: 'u2', name: 'Sarah Kim', color: 'var(--blue)' }, content: "I'll take a look! Also, does anyone have time to pair on the auth refactor later today?", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'm3', channelId: 'c1', user: { id: 'u3', name: 'Jordan Lee', color: 'var(--green)' }, content: "I've been looking at the API endpoints. We should consider adding pagination.\n\n```typescript\nconst result = await api.get('/users', { page: 1, limit: 20 });\n```", timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'm4', channelId: 'c1', user: { id: 'u1', name: 'Alex Chen', color: 'var(--purple)' }, content: 'Great point! I can work on that this sprint. @Sarah Kim I can pair on the auth refactor at 2pm if that works for you?', timestamp: new Date(Date.now() - 300000).toISOString(), reactions: [{ emoji: '👍', count: 2 }] },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let messageIdCounter = 200;

export const api = {
  async getChannels(): Promise<ChannelData[]> {
    await delay(300);
    return mockChannels;
  },

  async getMessages(channelId: string): Promise<any[]> {
    await delay(400);
    return mockMessages.filter(m => m.channelId === channelId);
  },

  async sendMessage(channelId: string, content: string, authorId: string): Promise<any> {
    await delay(200);
    const message: any = {
      id: `m${++messageIdCounter}`,
      channelId,
      authorId,
      content,
      createdAt: new Date(),
      isEdited: false,
      reactions: [],
      replies: 0,
    };
    mockMessages.push(message);
    return message;
  },

  async getUsers(): Promise<User[]> {
    await delay(200);
    return mockUsers;
  },

  async getUser(userId: string): Promise<User | undefined> {
    await delay(100);
    return mockUsers.find(u => u.id === userId);
  },

  async createChannel(name: string, type: 'public' | 'private' | 'announcement', description?: string): Promise<ChannelData> {
    await delay(150);
    const newChannel: ChannelData = {
      id: `c${Date.now()}`,
      name,
      type,
      description,
      members: [],
      threads: [],
      memberCount: 1,
      pinnedCount: 0,
    };
    mockChannels.push(newChannel);
    return newChannel;
  },
};