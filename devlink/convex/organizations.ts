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

// Create a new organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      avatar: args.avatar,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(orgId);
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
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
