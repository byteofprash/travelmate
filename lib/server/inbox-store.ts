import type { Redis } from '@upstash/redis';

/**
 * Emails waiting to be added to a trip. They arrive from the Cloudflare email worker (see /api/inbound) and stay
 * here until the user adds one to a trip or dismisses it. One small JSON document, newest first.
 */
const KEY = 'travelmate:inbox:v1';
export const MAX_ITEMS = 50;
export const MAX_TEXT = 20_000;

export interface InboxItem {
  id: string;
  from: string;
  subject: string;
  date: string | null; // when the email says it was sent
  text: string; // plain text, trimmed
  receivedAt: string;
}

export async function readInbox(r: Redis): Promise<InboxItem[]> {
  return (await r.get<InboxItem[]>(KEY)) ?? [];
}
export async function writeInbox(r: Redis, items: InboxItem[]) {
  await r.set(KEY, items.slice(0, MAX_ITEMS));
}
