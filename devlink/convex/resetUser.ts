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

export const updateOrgCodes = mutation({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const gen = () => {
      const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${rand(4)}-${rand(3)}-${rand(4)}`;
    };
    const results: string[] = [];
    for (const org of orgs) {
      const newCode = gen();
      await ctx.db.patch(org._id, { code: newCode });
      results.push(`${org.name}: ${newCode}`);
    }
    return results;
  },
});

export const ensureGeneralChannels = mutation({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    const results: string[] = [];

    for (const org of orgs) {
      let general = await ctx.db
        .query("channels")
        .withIndex("by_name", (q) => q.eq("name", "general"))
        .filter((q) => q.eq(q.field("orgId"), org._id.toString()))
        .first();

      const now = Date.now();
      if (!general) {
        const channelId = await ctx.db.insert("channels", {
          name: "general",
          type: "public",
          orgId: org._id.toString(),
          members: [],
          lastActivity: now,
          createdAt: now,
          updatedAt: now,
        });
        general = await ctx.db.get(channelId);
        results.push(`Created #general for ${org.name} (${org.slug})`);
      }

      // Add org members to the channel
      const orgMembers = await ctx.db
        .query("users")
        .withIndex("by_org", (q) => q.eq("orgId", org._id.toString()))
        .collect();

      const memberIds = orgMembers.map(u => u._id.toString());
      const existingMembers = general?.members || [];
      const newMembers = memberIds.filter(id => !existingMembers.includes(id));

      if (newMembers.length > 0) {
        await ctx.db.patch(general!._id, {
          members: [...existingMembers, ...newMembers],
        });
        results.push(`Added ${newMembers.length} member(s) to ${org.name}'s #general`);
      }
    }

    return { results };
  },
});
