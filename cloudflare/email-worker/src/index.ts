import PostalMime from 'postal-mime';

// The few Cloudflare types this worker uses, declared here so no extra type package is needed.
interface ForwardableEmailMessage {
  readonly from: string;
  readonly to: string;
  readonly raw: ReadableStream<Uint8Array>;
  readonly rawSize: number;
  setReject(reason: string): void;
}
interface Env {
  INBOUND_URL: string;
  INBOUND_SECRET: string; // wrangler secret
  ALLOWED_SENDERS?: string;
}

const MAX_RAW = 5 * 1024 * 1024; // refuse emails over 5 MB (attachments included)

/** Plain text from an HTML email: drop scripts and styles, keep line breaks, strip tags, decode common entities. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const norm = (s: string) => s.trim().toLowerCase();

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const allowed = (env.ALLOWED_SENDERS ?? '').split(',').map(norm).filter(Boolean);
    if (message.rawSize > MAX_RAW) return message.setReject('Message too large');

    const mail = await PostalMime.parse(await new Response(message.raw).arrayBuffer());

    // The envelope sender is what the sending server claims; the From header is what the message shows. Accept either.
    if (allowed.length && ![message.from, mail.from?.address ?? ''].some((a) => allowed.includes(norm(a)))) {
      return message.setReject('Sender not allowed');
    }

    const text = (mail.text?.trim() || htmlToText(mail.html ?? '')).trim();
    if (!text) return message.setReject('The email has no readable text');

    const res = await fetch(env.INBOUND_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-inbound-secret': env.INBOUND_SECRET },
      body: JSON.stringify({ from: mail.from?.address ?? message.from, subject: mail.subject ?? '', date: mail.date ?? null, text }),
    });
    // A server problem is worth retrying (throwing makes Cloudflare report a temporary failure); anything else is final.
    if (res.status >= 500) throw new Error(`App returned ${res.status}`);
    if (!res.ok) message.setReject(`Could not deliver (${res.status})`);
  },
};
