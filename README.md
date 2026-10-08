# Travel Companion

The one app you open while travelling: where you're going today, how you're getting there and where you're sleeping tonight. Paste itineraries, booking emails or notes and Claude turns them into days, stops, commutes, stays and journeys, then edits them from plain-English requests.

Built from the Claude Design handoff in [`docs/design/`](docs/design/HANDOFF.md). Spacing and copy follow the mockup; the visual style is claymorphism and the typeface is Nunito Sans at the owner's request (see Design and Fonts).

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel. A web-first, installable PWA shell.
- **`/api/edit`**: a server route that calls Claude with the `@anthropic-ai/sdk`. It uses one `apply_trip_ops` tool, validates the returned ops with zod and returns a **patch** (`{ summary, ops }`), never the whole trip. The API key never reaches the browser.
- Trips are stored in `localStorage` (`tc-trips-v1`), so the app keeps working without signal. They can also be synced to a Redis database so every device shows the same trips (see Syncing between devices). Each Claude edit keeps a version in history, so Undo can step back several times.

## Deploying on Vercel

1. Import the repo into Vercel. The Next.js preset needs no config changes.
2. Add the environment variable **`ANTHROPIC_API_KEY`** (Project → Settings → Environment Variables).
3. Optional: **`ANTHROPIC_WORKSPACE_ID`** (`wrkspc_...`). An API key belongs to exactly one Anthropic workspace, and each response says which workspace served it. If this is set, `/api/edit` returns an error (and logs it) when a response comes from any other workspace, which catches the wrong workspace's key being deployed. It checks the key; it can't choose the workspace, so to use a different workspace, create the API key in that workspace. The check happens after the request is sent, so it stops and flags a mismatch but can't prevent that one call.
4. Optional, to sync trips between devices (see below): connect a database and add **`APP_SECRET`**.
5. Optional: **`CLAUDE_MODEL`** overrides the model (default `claude-sonnet-5-5`, following the handoff's "sonnet").

**Checking the setup:** after deploying, open `/api/health` on your site. It makes one free token-counting call and reports whether the key works, which workspace served it, and, if it fails, why (no key set, key rejected, wrong workspace, unknown model, rate limit). Add `?deep=1` to send a tiny real request (a few tokens) with the same settings as the app's edit route: if the plain check passes but the deep one fails, the problem is in the request settings rather than the key. Replies also show `setup` (where requests are sent, and whether the key looks like a normal API key or has stray quotes or spaces) and, on errors, `answeredBy` (whether the reply carries Anthropic's request ID or came from some other proxy or gateway). Errors include Anthropic's `requestId`, which support needs; the server log carries it too. It never returns the key. Changing an environment variable in Vercel only takes effect after a redeploy.

The Claude route sets `maxDuration = 300`, which fits Vercel's default Fluid Compute limits. Pasting a long itinerary into an empty trip can take a while.

## Syncing between devices

Without setup the app is local only: trips live in each browser's `localStorage`, so a phone and a laptop have separate copies and clearing the browser's data deletes them. To share them:

1. **Add a database.** In the Vercel project: Storage → Marketplace → **Upstash Redis** → connect it to the project. (Vercel KV became this.) Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`; a database made directly on Upstash uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, which also work.
2. **Set `APP_SECRET`** to a long random string (`openssl rand -base64 24`). The app has no user accounts, so this access code is what stops anyone who finds the URL from reading or overwriting your trips. Syncing stays off, and the API refuses requests, until it is set.
3. **Redeploy**, then on each device open Settings → **Sync between devices**, enter the access code and press **Turn on**.

How it behaves:

- `localStorage` is still the working copy, so the app works offline. Changes are pushed about a second after you make them, and other devices pick them up when the app returns to the foreground or comes back online. Settings → Sync shows the state and has **Sync now** and **Turn off**.
- The synced data is the trips and the trip list. Undo history and settings (colours, timeline style) stay on each device.
- The first device to sync uploads its trips. A new device that has not changed the sample trips adopts what is in the cloud.
- If this device and the cloud both changed (for example you edited offline on two devices), nothing is overwritten. A toast points you to Settings, which asks you to **Keep cloud copy** or **Keep this device**; the other one is replaced.
- Storage is one JSON document under the key `travelmate:state:v1` with a revision number. `GET /api/state` returns it and `PUT /api/state` saves it only if the revision the client sent is still current (otherwise 409), both requiring the `x-access-code` header. The code is stored in the browser once entered, in `localStorage`.
- `/api/edit` (the Claude calls) is not behind the access code; anyone who can reach the site can use it and spend your Anthropic credit.

## Forwarding booking emails

Forward a booking confirmation (flight, train, hotel) to an address on your own domain and it shows up in the app, ready to add to a trip. It needs syncing set up first (the database and `APP_SECRET`), a domain on Cloudflare, and a free Cloudflare account.

```
you forward an email ─▶ trips@yourdomain ─▶ Cloudflare Email Routing ─▶ Email Worker ─▶ /api/inbound ─▶ inbox (Redis)
app: "2 emails waiting" ─▶ pick a trip ─▶ the usual edit sheet, prefilled ─▶ Apply with Claude (Undo works)
```

1. Add `INBOUND_SECRET` on Vercel (any long random string) and redeploy.
2. Deploy the worker and create the address: follow [`cloudflare/email-worker/README.md`](cloudflare/email-worker/README.md). The worker needs your app's URL, the same `INBOUND_SECRET` and the address you forward from.
3. Forward an email to the new address. Within a few seconds the Trips screen shows a banner (the app checks on start-up, when it returns to the foreground and every minute).

Notes:

- **Nothing is applied automatically.** An email only sits in the inbox. You choose the trip, the change goes through the same edit sheet and Claude call as pasted text, and the email is removed once you apply it. **Dismiss** deletes one without using it. Email text is untrusted input, so the review step is the safeguard against a crafted email.
- Only the email's text is read (HTML is converted to text). Attachments such as PDF tickets are ignored.
- The worker accepts only senders listed in `ALLOWED_SENDERS`, drops emails over 5 MB and never forwards the email anywhere else. The inbox keeps the 50 newest.
- Forwarding work bookings sends their contents to Cloudflare, your database and Anthropic. Check your company's rules first. Manually forwarding is usually allowed where automatic forwarding rules are blocked.

## Local development

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

**Testing the now line before the trip:** append `?today=2026-12-25&time=10:30` to the URL to pin the clock. Without it, the app uses the device's real date and time.

## What's where

| Path | What |
| --- | --- |
| `components/App.tsx` | State, navigation, persistence, the Claude call, Undo/Reset |
| `components/screens/` | Trips (home), Today, Trip overview, Map |
| `components/Sheets.tsx` | Activity, Stay, Day, Journeys, Stays, Edit trip, Settings sheets |
| `components/{DaySummary,ActivityCard,CommuteLeg}.tsx` | The three reusable components from the handoff |
| `app/api/state/route.ts`, `lib/server/state-store.ts` | Sync API: the trips in Redis, guarded by `APP_SECRET`, with a revision check |
| `app/api/inbound/route.ts`, `app/api/inbox/route.ts`, `lib/server/inbox-store.ts`, `lib/inbox.ts`, `components/useInbox.ts` | Email inbox: receive from the worker, list and dismiss, in-app banner |
| `cloudflare/email-worker/` | Cloudflare Email Worker that passes forwarded emails to `/api/inbound` (deployed separately) |
| `lib/sync.ts`, `components/useSync.ts` | Client side of syncing: change tracking, background push and pull, conflict choice |
| `lib/ops.ts` | Op schema (zod) and `applyOps()` |
| `lib/prompt.ts` | System prompt (from the handoff, adapted for tool use and "plan from pasted text") |
| `lib/extras.ts` | Presentation data the mockup hard-coded for Egypt (route box, whole-trip map, sea/Nile) |
| `data/` | Sample trips from the handoff |
| `docs/design/` | Original handoff README and HTML prototype, for reference |

## Layouts

- **Below 900px wide (phones):** the mobile design from the handoff, with a slim icon tab bar (Today, Trip, Map) pinned to the bottom edge. On Today, swipe left for the next day and right for the previous one (`lib/useSwipe.ts`, no animation: the day just changes); the day strip scrolls sideways on its own.
- **900px and wider (desktop):** the tab bar becomes a collapsible left sidebar with icons and names (Trips, then Today, Trip and Map for the open trip, and Settings). The centre column keeps the same cards but at the phone's size (1x, and 1.1x on screens 1400px and wider). Sheets open as a drawer on the right instead of from the bottom. The sidebar's collapsed state is remembered.
- The breakpoint lives in two places that must match: `app/globals.css` and `DESKTOP_QUERY` in `components/App.tsx`.

## Design: claymorphism

The app uses a claymorphic look: soft, puffy, borderless objects on a warm cream base, lit from the top-left. Everything is defined in `lib/theme.ts` (the `C`, `TAGC`, `TAGBG`, `CLAY` and `R` objects) plus the matching rules in `app/globals.css`, so re-theming means editing those two files.

- **Palette:** cream base `#F4EBDD`, clay cards `#FCF7EE`, warm brown ink `#3A2F2A`. Tags are deep text on a pastel pill (blue for flights and arrivals, green for stays, orange for meals, red for visits). Text colours are chosen to stay readable on cream.
- **Background:** not the cream: a faint mist of the primary colour (`--bg`), two soft washes of the primary and secondary in opposite corners, and a very faint tile of map contour lines (an SVG mask, so the lines take the primary colour). It is set on `.phone` in `app/globals.css` and follows the chosen preset. The cards, sidebar and sheets stay warm cream so they stand out from it.
- **Clay shadows (`CLAY`):** `raised` and `soft` combine an outer drop shadow with an inner top-left highlight and an inner bottom-right shade; `inset` is the pressed or well look (inputs, the "guided" pill, the active tab); `accent` is the same raised shadow tinted from `--accent`.
- **Shapes (`R`):** 24px cards, 16px controls, pill buttons and chips, 32px sheets. No hairline borders; depth comes from shadow. The phone tab bar floats as a rounded clay pill.
- **Primary and secondary colours:** Settings → Colours offers four presets, each a primary and a secondary: Teal & coral (default), Indigo & peach, Terracotta & sage and Violet & mint (`PRESETS` in `lib/theme.ts`). The primary is `--accent` and carries white text: the hero card, primary buttons, selected days, the active tab and the tinted shadows. The secondary is `--accent2`, a pastel that always carries dark ink text: secondary buttons, the NEXT badge, the active tab's fill and the now-line. Accents saved from earlier palettes are mapped to the closest preset on load.
- **Logo:** a clay tile in the primary colour with a coral dot (the secondary); `public/icon.svg` is the teal & coral version for the home-screen icon.
- **Map:** Leaflet tiles are tinted warm, markers are shaded "beads" and the zoom control is a clay pill.
- Cards lift on hover and press down when tapped; this is switched off for `prefers-reduced-motion`.

## Fonts

The whole app uses one family, **Nunito Sans** (SIL Open Font License 1.1), bundled through `@fontsource-variable/nunito-sans`. It falls back to the bundled Liberation Sans (`public/fonts/`, licence included) for glyphs Nunito Sans lacks, such as the → arrow, and then to Arial-metric fonts. The family name is set in one place, `lib/theme.ts`, plus the `font-family` lines in `app/globals.css`.

## Differences from the prototype

- Tapping an empty trip opens **Plan this trip**, which uses the same Claude pipeline to build the trip from pasted text. The prototype only showed a toast here.
- Dates come from each trip's ISO start date, so the day strip and labels are no longer hard-coded to December 2026. "Today" is the real date.
- The prototype's design-tool tweaks (accent colour, cards or ledger timeline, show commutes) are under **Settings** at the bottom of the Trips screen.
- The START time field is a 24-hour `HH:MM` text field, because browsers show `<input type="time">` in 12-hour format in some locales.
- Placeholder values such as "Add confirmation" and "Add phone" are shown muted, as prompts.

## Maps

The Map tab uses **OpenStreetMap** through Leaflet, with the tiles tinted warm to match the cream palette. Google Maps was ruled out because it needs a billing account and API key and charges beyond a free allowance. There's no key to configure. Day mode fits the day's stops with dashed routes; Whole trip mode shows one marker per city, with road legs solid and flights dotted.

The public OpenStreetMap tile server has a [usage policy](https://operations.osmfoundation.org/policies/tiles/) meant for light use. If the app gets real traffic, point `NEXT_PUBLIC_MAP_TILES` (and `NEXT_PUBLIC_MAP_ATTRIBUTION`) at a tile provider such as MapTiler or Stadia, whose free tiers need a key.

## Next steps (from the handoff)

- Add server-side storage (a `trips` table plus a per-trip document) and sync, keeping the local cache for offline use.
- Store a timezone per day, so the now line uses the trip's local time.
- Forward booking emails into a trip, and add a "Now / Next" widget.
- `/api/edit` has no authentication. Add auth or rate limiting before sharing the URL widely, because every request spends your Anthropic credits.
