import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all organizations
export const getOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

// Get organization by ID
export const getOrganization = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});

// Get organization by slug
export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get organization by code
export const getOrganizationByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

// Create a new organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    code: v.string(),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    avatar: v.optional(v.string()),
    creatorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      code: args.code,
      visibility: args.visibility ?? "public",
      avatar: args.avatar,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-create a #general channel for the new org
    const orgIdStr = orgId.toString();
    const members = args.creatorId ? [args.creatorId] : [];
    const channelId = await ctx.db.insert("channels", {
      name: "general",
      type: "public",
      orgId: orgIdStr,
      members,
      lastActivity: now,
      createdAt: now,
      updatedAt: now,
    });

    // Welcome message
    if (args.creatorId) {
      await ctx.db.insert("messages", {
        channelId: channelId.toString(),
        authorId: args.creatorId,
        content: `Welcome to #general! This is the start of the ${args.name} organization.`,
        isEdited: false,
        reactions: [],
        replies: 0,
        createdAt: now,
      });
    }

    return await ctx.db.get(orgId);
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    code: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orgId, ...updates } = args;
    const now = Date.now();
    await ctx.db.patch(orgId, {
      ...updates,
      updatedAt: now,
    });
    return await ctx.db.get(orgId);
  },
});
