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
    return await ctx.db.insert("users", {
      ...args,
      status: args.status ?? "offline",
      createdAt: now,
      updatedAt: now,
    });
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
