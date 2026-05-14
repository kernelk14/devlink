"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const register = action({
  args: {
    name: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(args.password, salt);
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username,
      email: args.email,
      status: "offline",
      passwordHash,
      salt,
      is_new_user: true,
      createdAt: now,
      updatedAt: now,
    });

    return { _id: userId, name: args.name, email: args.email };
  },
});

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      const lowerEmail = args.email.toLowerCase();
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", lowerEmail))
        .first();
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.passwordHash || !user.salt) {
      throw new Error("Account has no password set. Try GitHub login or register a new account.");
    }

    const hash = hashPassword(args.password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    return { _id: user._id, name: user.name, email: user.email };
  },
});
