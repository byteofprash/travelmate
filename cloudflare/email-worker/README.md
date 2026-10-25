# Email worker

Receives booking emails sent to a Cloudflare Email Routing address and hands them to the app's `/api/inbound`,
which puts them in the in-app inbox. Nothing is added to a trip until you choose a trip and press Apply in the app.

## Set up

1. **Deploy the worker** (needs Node 20+ and a free Cloudflare account):
   ```bash
   cd cloudflare/email-worker
   npm install
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put INBOUND_SECRET     # paste the same value you set as INBOUND_SECRET in the server's `.env`
   ```
   Then add the two plain variables, `INBOUND_URL` (`https://travel.byteofprash.com/api/inbound`) and `ALLOWED_SENDERS` (the address you
   forward from), in the dashboard: Worker → Settings → Variables and Secrets. (The deploy keeps dashboard values: see `keep_vars` in
   `wrangler.toml`. You can also put them in `wrangler.toml` under `[vars]`, but then they are committed to the repo.)
   If you deploy from GitHub instead of the command line, skip the commands and set `INBOUND_URL`, `ALLOWED_SENDERS` and the
   `INBOUND_SECRET` secret in the same place.
2. **Turn on Email Routing** for your domain: Cloudflare dashboard → your domain → Email → Email Routing → Enable
   (it adds the MX and SPF records for you).
3. **Create the address:** Email Routing → Routing rules → Create address → e.g. `trips@yourdomain.com` →
   Action **Send to a Worker** → `travelmate-email`.
4. **On the server**, add `INBOUND_SECRET` (any long random string, e.g. `openssl rand -base64 24`) to `.env` and run `docker compose up -d`. If Cloudflare Access protects the app, it must bypass `/api/inbound`.
5. Forward a booking email to `trips@yourdomain.com`. Within a few seconds it appears in the app (Trips screen).

Sending to this address does not forward the email anywhere else; the worker only reads it.

## Troubleshooting

**The sender gets `550 5.1.1 Address does not exist`.** The email never reached the worker: Cloudflare has no routing rule for that address. Check, in the Cloudflare dashboard under your domain → Email → Email Routing:

1. Routing rules has a custom address that matches what you sent to, character for character, and it is active. (Or turn on the catch-all rule with the same action, as a test.)
2. That rule's action is **Send to a Worker** and the worker is `travelmate-email`. A deployed worker only receives mail through a rule that targets it.
3. Email Routing is enabled, and the domain's MX records are Cloudflare's (`route1`, `route2`, `route3` on `mx.cloudflare.net`). If the domain also has MX records for another mail provider, mail goes there instead. Use a subdomain for this.
4. If you just created the rule, wait a few minutes.

**The email is rejected by the worker** (the sender gets a bounce with one of these):

| Message | Meaning |
| --- | --- |
| `Sender not allowed` | The sender is not in `ALLOWED_SENDERS`. Use exactly the address you forward from. |
| `Could not deliver (401 bad-secret)` | The app got the request but `INBOUND_SECRET` on Cloudflare does not match the one in the server's `.env` (check for typos and extra characters, then `docker compose up -d`). |
| `Could not deliver (401 blocked-by-vercel-protection)` | Something in front of the app (Cloudflare Access, or a protected Vercel deployment) is blocking the request before it reaches the app. Add a Bypass policy for `/api/inbound`. |
| `Could not deliver (404)` | `INBOUND_URL` has the wrong address or path. It must end in `/api/inbound`. |
| `Worker setting INBOUND_URL is not set` / `Worker secret INBOUND_SECRET is not set` | The worker is missing that setting. Add it in the dashboard (Worker → Settings → Variables and Secrets). |
| `Could not deliver (503 …)` | `no-secret`: `INBOUND_SECRET` is not set in `.env`. `no-storage`: no database is connected. Add them and restart the container. (503 is retried, so the sender sees a temporary failure rather than a bounce.) |
| `The email has no readable text` | The email has no text part (for example, image only). |
| `Message too large` | Over 5 MB. |

**It is delivered but nothing shows in the app.** Open Settings → Sync and check the access code and status: the inbox is behind the same access code as syncing. Then check `docker compose logs travelmate` for `/api/inbound`.
