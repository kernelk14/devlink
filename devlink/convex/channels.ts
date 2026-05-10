import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { channelType } from "./schema";

// Get all channels for an organization
export const getChannels = query({
  args: { 
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let channels = [];
    if (args.orgId) {
      channels = await ctx.db
        .query("channels")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
        .collect();
    } else {
      channels = await ctx.db.query("channels").collect();
    }
    
    if (args.userId) {
      channels = channels.filter(c => c.members.includes(args.userId!));
    }
    
    return channels;
  },
});

// Get a single channel by ID
export const getChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

// Get channel by name
export const getChannelByName = query({
  args: { name: v.string(), orgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .first();
  },
});

// Create a new channel
export const createChannel = mutation({
  args: {
    name: v.string(),
    type: channelType,
    description: v.optional(v.string()),
    orgId: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      type: args.type,
      description: args.description,
      orgId: args.orgId,
      members: [args.createdBy.toString()],
      unreadCount: 0,
      pinnedCount: 0,
      lastActivity: now,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(channelId);
  },
});

// Update channel
export const updateChannel = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(channelType),
  },
  handler: async (ctx, args) => {
    const { channelId, ...updates } = args;
    const now = Date.now();
    await ctx.db.patch(channelId, {
      ...updates,
      updatedAt: now,
    });
    return await ctx.db.get(channelId);
  },
});

// Join channel
export const joinChannel = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) return null;

    const userIdStr = args.userId.toString();
    if (!channel.members.includes(userIdStr)) {
      await ctx.db.patch(args.channelId, {
        members: [...channel.members, userIdStr],
        updatedAt: Date.now(),
      });
    }
    return await ctx.db.get(args.channelId);
  },
});

// Leave channel
export const leaveChannel = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) return null;

    const userIdStr = args.userId.toString();
    await ctx.db.patch(args.channelId, {
      members: channel.members.filter((id) => id !== userIdStr),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.channelId);
  },
});
