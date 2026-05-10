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

    // Check if DM already exists
    const allDMs = await ctx.db
      .query("directMessages")
      .collect();

    const existing = allDMs.find(dm => {
      const p = dm.participantIds.sort();
      return p[0] === participants[0] && p[1] === participants[1];
    });

    if (existing) return existing._id.toString();

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

// Get all DM conversations for a user
export const getMyDMs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allDMs = await ctx.db
      .query("directMessages")
      .collect();

    // Filter DMs that include the given userId
    return allDMs.filter(dm => dm.participantIds.includes(args.userId));
  },
});