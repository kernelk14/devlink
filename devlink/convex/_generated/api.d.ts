/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as connections from "../connections.js";
import type * as dms from "../dms.js";
import type * as http from "../http.js";
import type * as linkPreviews from "../linkPreviews.js";
import type * as messages from "../messages.js";
import type * as organizations from "../organizations.js";
import type * as resetUser from "../resetUser.js";
import type * as seed from "../seed.js";
import type * as threads from "../threads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  channels: typeof channels;
  connections: typeof connections;
  dms: typeof dms;
  http: typeof http;
  linkPreviews: typeof linkPreviews;
  messages: typeof messages;
  organizations: typeof organizations;
  resetUser: typeof resetUser;
  seed: typeof seed;
  threads: typeof threads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
