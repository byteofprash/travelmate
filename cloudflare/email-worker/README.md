# Email worker

Receives booking emails sent to a Cloudflare Email Routing address and hands them to the app's `/api/inbound`,
which puts them in the in-app inbox. Nothing is added to a trip until you choose a trip and press Apply in the app.

## Set up

1. **Deploy the worker** (needs Node 20+ and a free Cloudflare account):
   ```bash
   cd cloudflare/email-worker
   npm install
   # edit wrangler.toml: INBOUND_URL (your Vercel URL + /api/inbound) and ALLOWED_SENDERS (the address you forward from)
   npx wrangler login
   npx wrangler secret put INBOUND_SECRET     # paste the same value you set as INBOUND_SECRET on Vercel
   npx wrangler deploy
   ```
2. **Turn on Email Routing** for your domain: Cloudflare dashboard → your domain → Email → Email Routing → Enable
   (it adds the MX and SPF records for you).
3. **Create the address:** Email Routing → Routing rules → Create address → e.g. `trips@yourdomain.com` →
   Action **Send to a Worker** → `travelmate-email`.
4. **On Vercel**, add `INBOUND_SECRET` (any long random string, e.g. `openssl rand -base64 24`) and redeploy.
5. Forward a booking email to `trips@yourdomain.com`. Within a few seconds it appears in the app (Trips screen).

Sending to this address does not forward the email anywhere else; the worker only reads it.
