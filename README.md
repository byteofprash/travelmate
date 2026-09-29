# Travel Companion

The one app you open while travelling: where you're going today, how you're getting there and where you're sleeping tonight. Paste itineraries, booking emails or notes and Claude turns them into days, stops, commutes, stays and journeys, then edits them from plain-English requests.

Built from the Claude Design handoff in [`docs/design/`](docs/design/HANDOFF.md). Colours, spacing, radii and copy follow the mockup; the typeface was changed to Sono at the owner's request (see Fonts).

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel. A web-first, installable PWA shell.
- **`/api/edit`**: a server route that calls Claude with the `@anthropic-ai/sdk`. It uses one `apply_trip_ops` tool, validates the returned ops with zod and returns a **patch** (`{ summary, ops }`), never the whole trip. The API key never reaches the browser.
- Trips are stored in `localStorage` (`tc-trips-v1`), so the app keeps working without signal. Each Claude edit keeps a version in history, so Undo can step back several times.

## Deploying on Vercel

1. Import the repo into Vercel. The Next.js preset needs no config changes.
2. Add the environment variable **`ANTHROPIC_API_KEY`** (Project → Settings → Environment Variables).
3. Optional: **`CLAUDE_MODEL`** overrides the model (default `claude-sonnet-5-5`, following the handoff's "sonnet").

The Claude route sets `maxDuration = 300`, which fits Vercel's default Fluid Compute limits. Pasting a long itinerary into an empty trip can take a while.

## Authenticating to Anthropic

`/api/edit` (see `lib/anthropic.ts`) uses the first of these that is configured:

1. **API key:** set `ANTHROPIC_API_KEY`. It always wins if present.
2. **Workload identity federation with Vercel's identity token:** no stored secret. The deployment presents Vercel's OIDC token, and Anthropic exchanges it for a short-lived access token that the client refreshes on its own.
3. **Federation with your own identity token:** set `ANTHROPIC_IDENTITY_TOKEN_FILE` (or `ANTHROPIC_IDENTITY_TOKEN`) alongside the federation variables.

To set up option 2:

1. In the Anthropic Console (an org admin does this), add Vercel as a trusted identity issuer, create a service account, and create a federation rule that allows your Vercel project. As I understand Vercel's OIDC tokens, the issuer is `https://oidc.vercel.com/<team-slug>`, the audience is `https://vercel.com/<team-slug>`, and the subject looks like `owner:<team-slug>:project:<project-name>:environment:production`. Check Vercel's OIDC docs to confirm before you set the rule.
2. In Vercel, set `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID` and `ANTHROPIC_SERVICE_ACCOUNT_ID` (and `ANTHROPIC_WORKSPACE_ID` if the rule spans several workspaces). Leave `ANTHROPIC_API_KEY` unset.
3. Redeploy. Locally, run `vercel env pull` so `VERCEL_OIDC_TOKEN` is available.

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

The whole app uses one family, **Sono** (SIL Open Font License 1.1), bundled through `@fontsource-variable/sono`. Sono is monospaced by default, so `app/globals.css` sets its `MONO` axis to 0 (proportional) with `!important`, because the inline `font:` styles used across the app would otherwise reset it. Sono has a real Medium weight, so the design's 500 weights render as designed. It lacks a few glyphs (such as the → arrow), so the stack falls back to the bundled Liberation Sans (`public/fonts/`, licence included) and then Arial-metric fonts. The family name is set in one place, `lib/theme.ts`, plus the `font-family` lines in `app/globals.css`.

## Maps

The Map tab uses **OpenStreetMap** through Leaflet, with the tiles muted to match the paper palette. Google Maps was ruled out because it needs a billing account and API key and charges beyond a free allowance. There's no key to configure. Day mode fits the day's stops with dashed routes; Whole trip mode shows one marker per city, with road legs solid and flights dotted.

The public OpenStreetMap tile server has a [usage policy](https://operations.osmfoundation.org/policies/tiles/) meant for light use. If the app gets real traffic, point `NEXT_PUBLIC_MAP_TILES` (and `NEXT_PUBLIC_MAP_ATTRIBUTION`) at a tile provider such as MapTiler or Stadia, whose free tiers need a key.

## Next steps (from the handoff)

- Add server-side storage (a `trips` table plus a per-trip document) and sync, keeping the local cache for offline use.
- Store a timezone per day, so the now line uses the trip's local time.
- Forward booking emails into a trip, and add a "Now / Next" widget.
- `/api/edit` has no authentication. Add auth or rate limiting before sharing the URL widely, because every request spends your Anthropic credits.
