import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const resetNewUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return { success: false, message: "User not found" };

    await ctx.db.patch(user._id, {
      is_new_user: true,
      orgId: undefined,
    });

    return { success: true, userId: user._id, name: user.name, email: user.email };
  },
});
