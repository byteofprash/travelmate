import { Redis } from '@upstash/redis';

/**
 * Server-side store for the synced trips: one JSON document in Upstash Redis. The credentials are
 * KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and _TOKEN. Either works.
 */
const KEY = 'travelmate:state:v1';

export interface SyncedState {
  index: unknown[];
  trips: Record<string, unknown>;
}
export interface StoredDoc {
  rev: number; // bumped on every write; used to detect writes from another device
  updatedAt: string;
  data: SyncedState;
}

let redis: Redis | null | undefined;
export function client(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export async function readDoc(r: Redis): Promise<StoredDoc | null> {
  return (await r.get<StoredDoc>(KEY)) ?? null;
}
export async function writeDoc(r: Redis, doc: StoredDoc) {
  await r.set(KEY, doc);
}
