import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all replies for a thread (messages with matching threadId)
export const getThreadReplies = query({
  args: { parentMessageId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.parentMessageId))
      .collect();

    messages.sort((a, b) => a.createdAt - b.createdAt);
    return messages;
  },
});
