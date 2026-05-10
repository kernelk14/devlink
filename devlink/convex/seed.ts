import { mutation } from "./_generated/server";

// Seed initial data for development
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Check if we already have data
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { seeded: false, message: "Database already has data" };
    }

    // Create default organization
    const orgId = await ctx.db.insert("organizations", {
      name: "DevLink Inc",
      slug: "devlink",
      memberCount: 7,
      createdAt: now,
      updatedAt: now,
    });

    // Create users
    const users = await Promise.all([
      ctx.db.insert("users", {
        name: "Sarah Chen",
        username: "sarahc",
        email: "sarah@devlink.io",
        status: "online",
        statusMessage: "Building cool stuff",
        color: "var(--purple)",
        orgId: orgId.toString(),
        role: "owner",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "Marcus Johnson",
        username: "marcusj",
        email: "marcus@devlink.io",
        status: "online",
        statusMessage: "Code review mode",
        color: "var(--blue)",
        orgId: orgId.toString(),
        role: "member",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "Elena Rodriguez",
        username: "elenar",
        email: "elena@devlink.io",
        status: "away",
        color: "var(--green)",
        orgId: orgId.toString(),
        role: "member",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "James Kim",
        username: "jamesk",
        email: "james@devlink.io",
        status: "offline",
        statusMessage: "AFK",
        color: "var(--orange)",
        orgId: orgId.toString(),
        role: "member",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "Priya Patel",
        username: "priyap",
        email: "priya@devlink.io",
        status: "online",
        statusMessage: "Deploying to prod",
        color: "var(--pink)",
        orgId: orgId.toString(),
        role: "admin",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "Alex Thompson",
        username: "alext",
        email: "alex@devlink.io",
        status: "online",
        color: "var(--cyan)",
        orgId: orgId.toString(),
        role: "member",
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("users", {
        name: "Nina Kowalski",
        username: "ninak",
        email: "nina@devlink.io",
        status: "online",
        statusMessage: "In the zone",
        color: "var(--yellow)",
        orgId: orgId.toString(),
        role: "member",
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    // Create channels
    const channels = await Promise.all([
      ctx.db.insert("channels", {
        name: "general",
        type: "public",
        description: "Company-wide announcements and general discussion",
        orgId: orgId.toString(),
        members: users.map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 2,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "engineering",
        type: "public",
        description: "Engineering team discussions",
        orgId: orgId.toString(),
        members: users.slice(0, 5).map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 1,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "frontend",
        type: "public",
        description: "Frontend development",
        orgId: orgId.toString(),
        members: users.slice(0, 4).map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 1,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "backend",
        type: "public",
        description: "Backend services",
        orgId: orgId.toString(),
        members: users.slice(0, 3).map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 0,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "devops",
        type: "public",
        description: "CI/CD and deployments",
        orgId: orgId.toString(),
        members: users.slice(0, 3).map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 1,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "random",
        type: "public",
        description: "Non-work banter",
        orgId: orgId.toString(),
        members: users.map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 0,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("channels", {
        name: "code-review",
        type: "private",
        description: "PR reviews and feedback",
        orgId: orgId.toString(),
        members: users.slice(0, 3).map((u) => u.toString()),
        unreadCount: 0,
        pinnedCount: 1,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    // Add some initial messages to general channel
    const generalChannelId = channels[0];
    const hourAgo = now - 3600000;
    const halfHourAgo = now - 1800000;
    const tenMinAgo = now - 600000;
    const fiveMinAgo = now - 300000;

    await Promise.all([
      ctx.db.insert("messages", {
        channelId: generalChannelId.toString(),
        authorId: users[0].toString(),
        content: "Hey team, just pushed the new feature to staging. Can someone review it?",
        isEdited: false,
        isPinned: false,
        reactions: [],
        replies: 0,
        createdAt: hourAgo,
      }),
      ctx.db.insert("messages", {
        channelId: generalChannelId.toString(),
        authorId: users[1].toString(),
        content: "I'll take a look! Also, does anyone have time to pair on the auth refactor later today?",
        isEdited: false,
        isPinned: false,
        reactions: [],
        replies: 0,
        createdAt: halfHourAgo,
      }),
      ctx.db.insert("messages", {
        channelId: generalChannelId.toString(),
        authorId: users[2].toString(),
        content: "I've been looking at the API endpoints. We should consider adding pagination.\n\n```typescript\nconst result = await api.get('/users', { page: 1, limit: 20 });\n```",
        isEdited: false,
        isPinned: false,
        reactions: [],
        replies: 0,
        createdAt: tenMinAgo,
      }),
      ctx.db.insert("messages", {
        channelId: generalChannelId.toString(),
        authorId: users[0].toString(),
        content: "Great point! I can work on that this sprint. @Marcus Johnson I can pair on the auth refactor at 2pm if that works for you?",
        isEdited: false,
        isPinned: false,
        reactions: [{ emoji: "👍", count: 2, users: [users[1].toString(), users[4].toString()] }],
        replies: 0,
        createdAt: fiveMinAgo,
      }),
    ]);

    return {
      seeded: true,
      message: "Database seeded successfully",
      orgId: orgId.toString(),
      userCount: users.length,
      channelCount: channels.length,
    };
  },
});
