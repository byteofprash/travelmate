# Travel Companion

The one app you open while travelling: where you're going today, how you're getting there and where you're sleeping tonight. Paste itineraries, booking emails or notes and Claude turns them into days, stops, commutes, stays and journeys, then edits them from plain-English requests.

Built from the Claude Design handoff in [`docs/design/`](docs/design/HANDOFF.md). Spacing and copy follow the mockup; the visual style is claymorphism and the typeface is Nunito Sans at the owner's request (see Design and Fonts).

## Stack

- **Next.js (App Router) + TypeScript**, deployed with Docker on Hetzner. A web-first, installable PWA shell.
- **`/api/edit`**: a server route that calls Claude with the `@anthropic-ai/sdk`. It uses one `apply_trip_ops` tool, validates the returned ops with zod and returns a **patch** (`{ summary, ops }`), never the whole trip. The API key never reaches the browser.
- **`/api/new-trip`**: creates a whole new trip from pasted text. It calls Claude once (`create_trip` tool), which returns the trip's name, start and end dates, a one-line summary and the ops to build it; `lib/newtrip.ts` validates that and builds the trip. Day dates and weekdays are always recomputed from the start date, and the end date is widened if the plan runs past it. Both routes share `lib/server/claude.ts`.
- Trips are stored in `localStorage` (`tc-trips-v1`), so the app keeps working without signal. They can also be synced to a Redis database so every device shows the same trips (see Syncing between devices). Each Claude edit keeps a version in history, so Undo can step back several times.

## Deploying on Hetzner

The app runs as one Docker container at **https://travel.byteofprash.com**, behind the shared Traefik + Cloudflare Tunnel stack in `~/infra` (no ports are published; Traefik routes by hostname over the `proxy` Docker network).

1. On the server, clone the repo to `~/travelmate` and `cd` into it.
2. Create `.env` next to `docker-compose.yml` (it is git-ignored) from `.env.example`. **`ANTHROPIC_API_KEY`** and **`APP_SECRET`** are required; `APP_SECRET` is the access code (see Access code below). Nothing works without it. Add the Upstash vars for syncing and `INBOUND_SECRET` for email forwarding if you use them. Optional: **`ANTHROPIC_WORKSPACE_ID`** (`wrkspc_...`), which makes `/api/edit` return an error (and log it) when a response comes from any other workspace; it checks the key, it can't choose the workspace. Optional: **`CLAUDE_MODEL`** overrides the model (default `claude-sonnet-5-5`).
3. Start it: `docker compose up -d --build`.
4. Cloudflare Zero Trust → Networks → Tunnels → the tunnel → add a published application route: subdomain `travel`, domain `byteofprash.com`, type HTTP, URL `traefik:80`.
5. Optional: add a Cloudflare Access self-hosted application for `travel.byteofprash.com`. If you do, add a **Bypass** policy for the path `/api/inbound`, otherwise the email worker is blocked (that route has its own `INBOUND_SECRET`). The app's own access code still applies on top.
6. Check Traefik is routing: `docker logs traefik` should show the request with router `travelmate@docker`.

**Updating:** `git pull && docker compose up -d --build`. Logs: `docker compose logs -f travelmate`. Changing `.env` needs `docker compose up -d` to take effect. `NEXT_PUBLIC_MAP_TILES` / `NEXT_PUBLIC_MAP_ATTRIBUTION` are baked in at build time, so set them in `.env` and rebuild.

**Checking the setup:** after deploying, request `/api/health` with your access code, e.g. `curl -H "x-access-code: YOUR_CODE" https://travel.byteofprash.com/api/health` (it is locked like everything else, so it cannot be opened in a plain browser tab). It makes one free token-counting call and reports whether the key works, which workspace served it, and, if it fails, why (no key set, key rejected, wrong workspace, unknown model, rate limit). Add `?deep=1` to send a tiny real request (a few tokens) with the same settings as the app's edit route: if the plain check passes but the deep one fails, the problem is in the request settings rather than the key. Replies also show `setup` (where requests are sent, and whether the key looks like a normal API key or has stray quotes or spaces) and, on errors, `answeredBy` (whether the reply carries Anthropic's request ID or came from some other proxy or gateway). Errors include Anthropic's `requestId`, which support needs; the server log carries it too. It never returns the key. 

**When an edit or a new trip fails,** the sheet says why (for example the API key was rejected, the account is out of credit, the model is unknown, Anthropic is busy, or the request timed out) and includes Anthropic's request ID where there is one. The server log (`docker compose logs travelmate`) has the full detail on a line starting `Anthropic API error`. How strictly Claude is held to the format: the tool definition in `lib/server/tool-schemas.ts` spells out every operation with its fields, types, allowed values (`tag`, `mode`, weekdays) and required fields, and the prompt says nested values must be real arrays and objects. Anthropic's `strict: true` mode (which enforces a schema exactly) is deliberately not used: it caps a request at 24 optional fields and 16 union fields, and the itinerary format has many more optional fields than that, so a strict version would be rejected as too complex. Instead every answer is validated in `lib/ops.ts`: a list or object sent as JSON text inside a string (for example `"ops": "[{...}]"`) is parsed, harmless slips (a `null` for an empty field, a number sent as text) are accepted, and otherwise Claude is asked once to correct the answer, told exactly which fields were wrong; only if that fails too does the sheet show the failing field.

The Claude routes set `maxDuration = 300`, which is ignored on a long-running container. Cloudflare's proxy times out at about 100 seconds without a response, so pasting a long itinerary into an empty trip can take a while, but a request that takes longer than that will fail at the tunnel.

## Access code

The app has no user accounts. Instead, **everything works only with a valid access code**, the value of the `APP_SECRET` environment variable:

- **The app is locked.** On a device that has not entered the code, you see only a lock screen: no trips are shown. Enter the code once per device; it is checked with the server and then kept on that device.
- **The server refuses everything else.** `/api/edit`, `/api/new-trip`, `/api/state`, `/api/inbox` and `/api/health` answer 401 without the right `x-access-code` header, and every one of them answers 503 if `APP_SECRET` is not set (the app fails closed). The only other route, `/api/inbound`, is for the email worker and has its own secret (`INBOUND_SECRET`).
- **If the code changes** (you set a new `APP_SECRET` and restart the container), each device locks the next time it talks to the server and asks for the new code. **Settings → Lock this device** locks one device on purpose.
- **Offline:** a device that already entered a valid code opens and works with its saved trips without a connection. A device that never entered one cannot open the app, online or not.
- Choose a long random value (`openssl rand -base64 24`): the server waits briefly before refusing a wrong code, but a short code can still be guessed. The page itself is public; the sample trips are part of the app's code, but nothing is shown or loaded from the cloud until the code is accepted.

## Syncing between devices

Trips are kept in each browser's `localStorage` (so the app works offline) and saved to a Redis database so every device shows the same plans. Without a database the app still works, but a phone and a laptop have separate copies and clearing the browser's data deletes them.

1. **Add a database.** Create an **Upstash Redis** database and put its REST URL and token in `.env` as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (`KV_REST_API_URL` / `KV_REST_API_TOKEN` also work).
2. **Restart** with `docker compose up -d`. Syncing then starts by itself once a device is unlocked. Settings → **Sync and access** shows the state and has **Sync now**.

How it behaves:

- Changes are pushed about a second after you make them, and other devices pick them up when the app returns to the foreground or comes back online.
- The synced data is the trips and the trip list, including trips you create and delete. Undo history and settings (colours, timeline style) stay on each device.
- The first device to sync uploads its trips. A new device that has not changed the sample trips adopts what is in the cloud.
- If this device and the cloud both changed (for example you edited offline on two devices), nothing is overwritten. A toast points you to Settings, which asks you to **Keep cloud copy** or **Keep this device**; the other one is replaced.
- Storage is one JSON document under the key `travelmate:state:v1` with a revision number. `GET /api/state` returns it and `PUT /api/state` saves it only if the revision the client sent is still current (otherwise 409), both requiring the access code.

## Forwarding booking emails

Forward a booking confirmation (flight, train, hotel) to an address on your own domain and it shows up in the app, ready to add to a trip. It needs the database (see Syncing between devices), a domain on Cloudflare, and a free Cloudflare account.

```
you forward an email ─▶ trips@yourdomain ─▶ Cloudflare Email Routing ─▶ Email Worker ─▶ /api/inbound ─▶ inbox (Redis)
app: "2 emails waiting" ─▶ pick a trip ─▶ the usual edit sheet, prefilled ─▶ Apply with Claude (Undo works)
```

1. Add `INBOUND_SECRET` to `.env` (any long random string) and run `docker compose up -d`.
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
cp .env.example .env.local   # add APP_SECRET (any value; you type it into the lock screen) and ANTHROPIC_API_KEY
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
| `app/api/new-trip/route.ts`, `lib/newtrip.ts`, `lib/server/claude.ts` | Create a trip from text: the route, the schema and builder, and the shared Claude call |
| `lib/ops.ts` | Op schema (zod) and `applyOps()` |
| `lib/prompt.ts` | System prompt (from the handoff, adapted for tool use and "plan from pasted text") |
| `lib/extras.ts` | Presentation data the mockup hard-coded for Egypt (route box, whole-trip map, sea/Nile) |
| `data/` | Sample trips from the handoff |
| `docs/design/` | Original handoff README and HTML prototype, for reference |

## Creating trips

The **New trip** button on the Trips screen opens a sheet with two ways to start:

- **From text:** paste a booking email, a tour itinerary or notes, and press **Create trip with Claude**. Claude names the trip, works out the dates (using today's date to resolve dates written without a year) and builds the days, stays and journeys. If the text does not say where or when, nothing is created and the sheet says what is missing. Only what the text says or implies is used; unknown times show as "—" and unknown details as "Add confirmation" / "Add phone". The trip opens straight away, and Undo works on later edits as usual.
- **Empty:** enter a name and first and last day and press **Create empty trip**; the Plan this trip sheet opens so you can paste text into it.

**Deleting a trip:** open the trip, press **Edit trip**, and choose **Delete this trip** at the bottom of the sheet. It asks you to confirm, then removes the trip and its days, stays and journeys. The deletion syncs to your other devices and cannot be undone. (For a built-in sample trip, **Reset to original** restores it instead; for a trip you created it empties it.)

## Layouts

- **Below 900px wide (phones):** the mobile design from the handoff, with a slim icon tab bar (Trip, Today, Map) pinned to the bottom edge. Opening a trip lands on Trip, the overview; tapping one of its days opens that day in Today. At the top of the overview, two tiles show whether the trip has its **Flights** and **Stays** yet: filled in (raised, tinted, with a check) once there is data, and dashed with an **Add** pill while empty. A filled tile opens the list; an empty one opens the editor with flight- or stay-specific hints.

**Stay addresses:** each stay can carry a street address (`address`). In the Stays list every card shows it with a pin, as a link that opens Google Maps in a new tab (the search is the hotel's name plus its address, which lands on the right listing); the stay's detail page has an ADDRESS row with the same link. While an address is missing the card shows a dashed **Add address** prompt that opens the editor ready for it, with the hotel already named. Claude records an address only when your text states it, exactly as written, and never guesses one. (`lib/derive.ts`: `stayAddress`, `stayMapsUrl`.)

A flight only counts as complete when it has all four of: a **flight number** (like `LH 1234`, `U2 8803` or `EZY1234`; a bare number or an airline name does not count), an **airline** (a name, not a route like "ASW → CAI" or a placeholder), a **date** (the day it is on) and a **departure time** (`HH:MM`). These are read from the journey itself (`number`, `by`, `day`, `time`), never guessed from the itinerary. The Flights tile is dashed in the primary colour while any flight is incomplete, showing "2 of 5 flights complete" and what is still needed; tapping it opens the editor with a list of exactly which flight details are missing, and the Journeys list marks each flight as complete or "Needs …". Only when every flight has all four does the tile fill in. Claude is told to fill `number`, `time` and the airline only when the text states them, and never to invent them. (`lib/derive.ts`: `flightGaps`, `flightStatus`.) On Today, swipe left for the next day and right for the previous one (`lib/useSwipe.ts`, no animation: the day just changes); the day strip scrolls sideways on its own.
- **900px and wider (desktop):** the tab bar becomes a collapsible left sidebar with icons and names (Trips, then Trip, Today and Map for the open trip, and Settings). The centre column keeps the same cards but at the phone's size (1x, and 1.1x on screens 1400px and wider). Sheets open as a drawer on the right instead of from the bottom. The sidebar's collapsed state is remembered.
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
