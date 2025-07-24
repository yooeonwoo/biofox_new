/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';
import type * as auth from '../auth.js';
import type * as commissions from '../commissions.js';
import type * as fileStorage from '../fileStorage.js';
import type * as migration from '../migration.js';
import type * as notifications from '../notifications.js';
import type * as orderMutations from '../orderMutations.js';
import type * as orders from '../orders.js';
import type * as profiles from '../profiles.js';
import type * as realtime from '../realtime.js';
import type * as realtime_optimized from '../realtime_optimized.js';
import type * as relationships from '../relationships.js';
import type * as userMutations from '../userMutations.js';
import type * as users from '../users.js';
import type * as utils from '../utils.js';
import type * as validation from '../validation.js';

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  commissions: typeof commissions;
  fileStorage: typeof fileStorage;
  migration: typeof migration;
  notifications: typeof notifications;
  orderMutations: typeof orderMutations;
  orders: typeof orders;
  profiles: typeof profiles;
  realtime: typeof realtime;
  realtime_optimized: typeof realtime_optimized;
  relationships: typeof relationships;
  userMutations: typeof userMutations;
  users: typeof users;
  utils: typeof utils;
  validation: typeof validation;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;
