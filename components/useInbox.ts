import { useCallback, useEffect, useState } from 'react';
import { fetchInbox, removeInboxItem, type InboxItem } from '@/lib/inbox';

const POLL_MS = 60_000;

/** Emails waiting in the inbox. Checked on start-up, when the app returns to the foreground or comes online, and every minute. */
export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      setItems(await fetchInbox());
    } catch {
      // Offline or the server is not set up: keep what is showing; the next check will try again.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const visible = () => document.visibilityState !== 'hidden' && void refresh();
    const t = setInterval(visible, POLL_MS);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', visible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', visible);
    };
  }, [refresh]);

  const dismiss = useCallback(
    async (id: string) => {
      setItems((l) => l.filter((i) => i.id !== id)); // hide it straight away
      try {
        await removeInboxItem(id);
      } catch {
        void refresh(); // it is still on the server, so bring it back
      }
    },
    [refresh],
  );

  return { items, refresh, dismiss };
}
