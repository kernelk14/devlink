import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get messages for a channel
export const getMessages = query({
  args: {
    channelId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("messages")
      .withIndex("by_channel_time", (q) => q.eq("channelId", args.channelId));

    // Default to 100 messages
    const limit = args.limit ?? 100;

    let messages = await query.take(limit);
    
    // Sort by createdAt ascending (oldest first for display)
    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  },
});

// Get a single message
export const getMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

// Send a new message
export const sendMessage = mutation({
  args: {
    channelId: v.string(),
    authorId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create the message
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
      isEdited: false,
      isPinned: false,
      reactions: [],
      replies: 0,
      createdAt: now,
    });

    // Update channel's last activity
    const channel = await ctx.db
      .query("channels")
      .withIndex("by_org", (q) => q.eq("orgId", args.channelId))
      .first();
    
    if (channel) {
      await ctx.db.patch(channel._id, {
        lastActivity: now,
        updatedAt: now,
      });
    }

    return await ctx.db.get(messageId);
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      updatedAt: now,
    });
    return await ctx.db.get(args.messageId);
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const reactions = message.reactions ?? [];
    const existing = reactions.find((r) => r.emoji === args.emoji);

    if (existing) {
      if (!existing.users.includes(args.userId)) {
        existing.count++;
        existing.users.push(args.userId);
      }
    } else {
      reactions.push({
        emoji: args.emoji,
        count: 1,
        users: [args.userId],
      });
    }

    await ctx.db.patch(args.messageId, {
      reactions,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.messageId);
  },
});

// Remove reaction from a message
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const reactions = message.reactions ?? [];
    const existing = reactions.find((r) => r.emoji === args.emoji);

    if (existing && existing.users.includes(args.userId)) {
      existing.count--;
      existing.users = existing.users.filter((id) => id !== args.userId);

      if (existing.count <= 0) {
        const idx = reactions.indexOf(existing);
        reactions.splice(idx, 1);
      }
    }

    await ctx.db.patch(args.messageId, {
      reactions,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.messageId);
  },
});

// Pin a message
export const pinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isPinned: true,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});

// Unpin a message
export const unpinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isPinned: false,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});
