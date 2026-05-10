import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get pending requests for a user
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectionRequests")
      .withIndex("by_receiver_status", (q) => 
        q.eq("receiverId", args.userId).eq("status", "pending")
      )
      .collect();
  },
});

// Send a connection request
export const sendRequest = mutation({
  args: { senderId: v.id("users"), receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if already connected
    const sender = await ctx.db.get(args.senderId);
    const receiverIdStr = args.receiverId.toString();
    if (sender?.contacts?.includes(receiverIdStr)) {
      return { success: false, message: "Already connected" };
    }

    // Check if a request already exists
    const existing = await ctx.db
      .query("connectionRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", args.senderId))
      .filter((q) => 
        q.and(
          q.eq(q.field("receiverId"), args.receiverId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existing) {
      return { success: false, message: "Request already pending" };
    }

    await ctx.db.insert("connectionRequests", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Accept a connection request
export const acceptRequest = mutation({
  args: { requestId: v.id("connectionRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") return { success: false };

    const now = Date.now();

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updatedAt: now,
    });

    // Add to each other's contacts
    const sender = await ctx.db.get(request.senderId);
    const receiver = await ctx.db.get(request.receiverId);

    if (sender) {
      const currentContacts = sender.contacts || [];
      const targetIdStr = request.receiverId.toString();
      if (!currentContacts.includes(targetIdStr)) {
        await ctx.db.patch(request.senderId, {
          contacts: [...currentContacts, targetIdStr],
          updatedAt: now,
        });
      }
    }

    if (receiver) {
      const currentContacts = receiver.contacts || [];
      const senderIdStr = request.senderId.toString();
      if (!currentContacts.includes(senderIdStr)) {
        await ctx.db.patch(request.receiverId, {
          contacts: [...currentContacts, senderIdStr],
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

// Reject a connection request
export const rejectRequest = mutation({
  args: { requestId: v.id("connectionRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
