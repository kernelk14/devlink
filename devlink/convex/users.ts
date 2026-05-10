import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { userStatus } from "./schema";

// Get all users
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    status: v.optional(userStatus),
    statusMessage: v.optional(v.string()),
    color: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
      
    if (existing) {
      return existing._id;
    }

    // Insert new user
    const userId = await ctx.db.insert("users", {
      ...args,
      status: args.status ?? "offline",
      createdAt: now,
      updatedAt: now,
    });

    // If they have an orgId, add them to the #general channel automatically
    if (args.orgId) {
      const generalChannel = await ctx.db
        .query("channels")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
        .filter((q) => q.eq(q.field("name"), "general"))
        .first();

      if (generalChannel) {
        const userIdStr = userId.toString();
        if (!generalChannel.members.includes(userIdStr)) {
          await ctx.db.patch(generalChannel._id, {
            members: [...generalChannel.members, userIdStr],
            updatedAt: now,
          });
        }
      }
    }

    return userId;
  },
});

// Update user status
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: userStatus,
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: args.status,
      statusMessage: args.statusMessage,
      updatedAt: now,
    });
    return await ctx.db.get(args.userId);
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const now = Date.now();
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: now,
    });
    return await ctx.db.get(userId);
  },
});
// Connect with another user
export const connectUser = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const contacts = user.contacts || [];
    if (!contacts.includes(args.targetUserId)) {
      await ctx.db.patch(args.userId, {
        contacts: [...contacts, args.targetUserId],
        updatedAt: Date.now(),
      });
    }
    return await ctx.db.get(args.userId);
  },
});
