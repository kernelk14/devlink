"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const fetchLinkPreview = action({
  args: { url: v.string() },
  handler: async (_ctx, args) => {
    try {
      const res = await fetch(args.url, {
        headers: { "User-Agent": "DevLink/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      const html = await res.text();

      const getMeta = (property: string): string | null => {
        const patterns = [
          new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, 'i'),
          new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${property}["']`, 'i'),
        ];
        for (const p of patterns) {
          const m = html.match(p);
          if (m) return m[1];
        }
        return null;
      };

      const title = getMeta("og:title") || getMeta("twitter:title") || getMeta("title") || "";
      const description = getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || "";
      const image = getMeta("og:image") || getMeta("twitter:image") || "";
      const favicon = getMeta("icon") || html.match(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']*)["']/i)?.[1] || "";

      return {
        url: args.url,
        title: title.slice(0, 200),
        description: description.slice(0, 400),
        image,
        favicon,
      };
    } catch {
      return null;
    }
  },
});
