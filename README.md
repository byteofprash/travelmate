# Travel Companion

The one app you open while travelling: where you're going today, how you're getting there and where you're sleeping tonight. Paste itineraries, booking emails or notes and Claude turns them into days, stops, commutes, stays and journeys, then edits them from plain-English requests.

Built from the Claude Design handoff in [`docs/design/`](docs/design/HANDOFF.md). Colours, spacing, radii and copy follow the mockup; the typeface was changed to Liberation Sans at the owner's request (see Fonts).

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel. A web-first, installable PWA shell.
- **`/api/edit`**: a server route that calls Claude with the `@anthropic-ai/sdk`. It uses one `apply_trip_ops` tool, validates the returned ops with zod and returns a **patch** (`{ summary, ops }`), never the whole trip. The API key never reaches the browser.
- Trips are stored in `localStorage` (`tc-trips-v1`), so the app keeps working without signal. Each Claude edit keeps a version in history, so Undo can step back several times.

## Deploying on Vercel

1. Import the repo into Vercel. The Next.js preset needs no config changes.
2. Add the environment variable **`ANTHROPIC_API_KEY`** (Project → Settings → Environment Variables).
3. Optional: **`CLAUDE_MODEL`** overrides the model (default `claude-sonnet-5-5`, following the handoff's "sonnet").

The Claude route sets `maxDuration = 300`, which fits Vercel's default Fluid Compute limits. Pasting a long itinerary into an empty trip can take a while.

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
| `lib/ops.ts` | Op schema (zod) and `applyOps()` |
| `lib/prompt.ts` | System prompt (from the handoff, adapted for tool use and "plan from pasted text") |
| `lib/extras.ts` | Presentation data the mockup hard-coded for Egypt (route box, whole-trip map, sea/Nile) |
| `data/` | Sample trips from the handoff |
| `docs/design/` | Original handoff README and HTML prototype, for reference |

## Layouts

- **Below 900px wide (phones):** the mobile design from the handoff, with a slim icon tab bar (Today, Trip, Map) pinned to the bottom edge.
- **900px and wider (desktop):** the tab bar becomes a collapsible left sidebar with icons and names (Trips, then Today, Trip and Map for the open trip, and Settings). The centre column keeps the same cards but at the phone's size (1x, and 1.1x on screens 1400px and wider). Sheets open as a drawer on the right instead of from the bottom. The sidebar's collapsed state is remembered.
- The breakpoint lives in two places that must match: `app/globals.css` and `DESKTOP_QUERY` in `components/App.tsx`.

## Fonts

The whole app uses one family, **Liberation Sans** (SIL Open Font License 1.1, so it's fine to bundle). The web-font files and the licence are in `public/fonts/`, and `app/globals.css` loads them, using an installed copy first if there is one. Liberation Sans has no Medium weight, so the "500" weights in the design render as Regular and only 600+ renders as Bold. The family name is set in one place, `lib/theme.ts`, plus the `font-family` lines in `app/globals.css`.

## Differences from the prototype

- Tapping an empty trip opens **Plan this trip**, which uses the same Claude pipeline to build the trip from pasted text. The prototype only showed a toast here.
- Dates come from each trip's ISO start date, so the day strip and labels are no longer hard-coded to December 2026. "Today" is the real date.
- The prototype's design-tool tweaks (accent colour, cards or ledger timeline, show commutes) are under **Settings** at the bottom of the Trips screen.
- The START time field is a 24-hour `HH:MM` text field, because browsers show `<input type="time">` in 12-hour format in some locales.
- Placeholder values such as "Add confirmation" and "Add phone" are shown muted, as prompts.

## Next steps (from the handoff)

- Replace the schematic map with a map SDK (for example Mapbox with a muted style using the same palette). This needs an access token.
- Add server-side storage (a `trips` table plus a per-trip document) and sync, keeping the local cache for offline use.
- Store a timezone per day, so the now line uses the trip's local time.
- Forward booking emails into a trip, and add a "Now / Next" widget.
- `/api/edit` has no authentication. Add auth or rate limiting before sharing the URL widely, because every request spends your Anthropic credits.
