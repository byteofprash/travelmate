import { authedFetch } from './access';

/** Client side of the email inbox (see /api/inbox). */
export interface InboxItem {
  id: string;
  from: string;
  subject: string;
  date: string | null;
  text: string;
  receivedAt: string;
}

export async function fetchInbox(): Promise<InboxItem[]> {
  const res = await authedFetch('/api/inbox', { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { items: InboxItem[] }).items;
}

export async function removeInboxItem(id: string): Promise<void> {
  const res = await authedFetch(`/api/inbox?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(String(res.status));
}
