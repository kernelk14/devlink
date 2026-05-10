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
    const existing = await ctx.db
      .query("directMessages")
      .withIndex("by_participants", (q) => q.eq("participantIds", participants))
      .first();
      
    if (existing) return existing._id;
    
    // Create new DM conversation
    const now = Date.now();
    return await ctx.db.insert("directMessages", {
      participantIds: participants,
      orgId: args.orgId,
      lastActivity: now,
      createdAt: now,
    });
  },
});

// Get all DM conversations for a user
export const getMyDMs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("directMessages")
      .collect(); // Simple fetch for now, we'll filter in JS or add index later
  },
});
