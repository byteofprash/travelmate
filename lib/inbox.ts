/** Client side of the email inbox (see /api/inbox). Needs the same access code as syncing. */
export interface InboxItem {
  id: string;
  from: string;
  subject: string;
  date: string | null;
  text: string;
  receivedAt: string;
}

const headers = (code: string) => ({ 'x-access-code': code });

export async function fetchInbox(code: string): Promise<InboxItem[]> {
  const res = await fetch('/api/inbox', { headers: headers(code), cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { items: InboxItem[] }).items;
}

export async function removeInboxItem(code: string, id: string): Promise<void> {
  const res = await fetch(`/api/inbox?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers(code) });
  if (!res.ok) throw new Error(String(res.status));
}
