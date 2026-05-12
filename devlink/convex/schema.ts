import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const userStatus = v.union(
  v.literal("online"),
  v.literal("away"),
  v.literal("busy"),
  v.literal("dnd"),
  v.literal("offline")
);

export const channelType = v.union(
  v.literal("public"),
  v.literal("private"),
  v.literal("announcement")
);

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    status: userStatus,
    statusMessage: v.optional(v.string()),
    color: v.optional(v.string()),
    orgId: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("guest")
    )),
    contacts: v.optional(v.array(v.string())),
    is_new_user: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_org", ["orgId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    avatar: v.optional(v.string()),
    memberCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  channels: defineTable({
    name: v.string(),
    type: channelType,
    description: v.optional(v.string()),
    orgId: v.string(),
    members: v.array(v.string()),
    unreadCount: v.optional(v.number()),
    pinnedCount: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_name", ["name"]),

  messages: defineTable({
    channelId: v.string(),
    authorId: v.string(),
    content: v.string(),
    isEdited: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    threadId: v.optional(v.string()),
    reactions: v.optional(v.array(v.object({
      emoji: v.string(),
      count: v.number(),
      users: v.array(v.string()),
    }))),
    replies: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId"])
    .index("by_author", ["authorId"])
    .index("by_channel_time", ["channelId", "createdAt"]),

  threads: defineTable({
    parentMessageId: v.string(),
    channelId: v.string(),
    replyCount: v.number(),
    lastReplyAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_parent", ["parentMessageId"])
    .index("by_channel", ["channelId"]),

  directMessages: defineTable({
    participantIds: v.array(v.string()),
    orgId: v.string(),
    lastMessageId: v.optional(v.string()),
    lastActivity: v.number(),
    createdAt: v.number(),
  })
    .index("by_participants", ["participantIds"])
    .index("by_org", ["orgId"])
    .index("by_lastActivity", ["lastActivity"]),

  userPresence: defineTable({
    userId: v.string(),
    orgId: v.string(),
    status: userStatus,
    statusMessage: v.optional(v.string()),
    lastSeen: v.number(),
    typingInChannel: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"]),

  connectionRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver_status", ["receiverId", "status"]),
});
