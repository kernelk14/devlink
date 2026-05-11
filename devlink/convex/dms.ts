import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create a DM conversation between two users
export const getOrCreateDM = mutation({
  args: {
    user1Id: v.string(),
    user2Id: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, args) => {
    const participants = [args.user1Id, args.user2Id].sort();

    // Check if DM already exists using participants index
    const existingDMs = await ctx.db
      .query("directMessages")
      .withIndex("by_participants", (q) => q.eq("participantIds", participants))
      .first();

    if (existingDMs) return existingDMs._id.toString();

    // Create new DM conversation
    const now = Date.now();
    const dmId = await ctx.db.insert("directMessages", {
      participantIds: participants,
      orgId: args.orgId,
      lastActivity: now,
      createdAt: now,
    });

    return dmId.toString();
  },
});

// Get all DM conversations for a user in an org
export const getMyDMs = query({
  args: {
    userId: v.string(),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allDMs = await ctx.db
      .query("directMessages")
      .collect();

    return allDMs
      .filter(dm => dm.participantIds.includes(args.userId))
      .sort((a, b) => b.lastActivity - a.lastActivity);
  },
});

// Get a specific DM by ID
export const getDM = query({
  args: { dmId: v.id("directMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dmId);
  },
});

// Get DMs by org
export const getDMsByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("directMessages")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});