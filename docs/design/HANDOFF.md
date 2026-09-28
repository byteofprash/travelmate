# Handoff: Travel Companion (mobile)

## Overview
A personal travel organiser: the one app you open while travelling to see where you're going today, how you're getting there and where you're sleeping tonight. Users paste free text (tour itineraries, booking emails, notes). An LLM (Anthropic Claude) turns it into structured days, activities, commutes, stays and journeys, and later edits it through natural-language requests.

Sample content: a 9-day Egypt trip (23–31 Dec 2026), plus three trips with no plans yet (Copenhagen & Malmö, London, Vietnam).

## About the design files
Everything in `prototype/` is a **design reference built in HTML**: a working prototype showing the intended look and behaviour. It is **not production code**. Recreate it in the target stack. If none exists yet, a good fit is **React Native (Expo)** or **SwiftUI** for a native phone app, or **Next.js + a PWA shell** if web-first matters more. Open `prototype/Travel Companion.dc.html` in a browser to click through it. The sibling files must stay alongside it.

`data/` holds the real data model as JSON. Start the implementation from these files.

## Fidelity
**High fidelity.** Colours, type, spacing, radii and copy are final. Recreate them pixel-for-pixel. The iPhone bezel (`ios-frame.jsx`) is presentation-only and should not be shipped.

---

## Information architecture
```
Trips (home, no tab bar)
└─ Trip (tab bar: Today · Trip · Map)
   ├─ Today   — day strip + theme card + timeline (+ now line)
   ├─ Trip    — route overview + day cards + "Edit trip"
   └─ Map     — Day / Whole trip toggle
Sheets (bottom, over any screen): Activity detail/edit · Stay detail · Day detail ·
Journeys list · Stays list · Edit trip (Claude)
```
Screen size of the reference: 402 × 874 (iPhone 16 Pro class). The status-bar safe area is ~58px at the top, and the tab bar is 84px tall including a 22px home-indicator inset.

---

## Screens

### 1. Trips (home)
- Scrolls vertically; padding-top 58px.
- Kicker `AUTUMN & WINTER 2026`: Geist Mono 500, 11px, letter-spacing .08em, uppercase, #6E665B.
- Title `Trips`: Newsreader 400, 44px/1, letter-spacing −.02em, 14px below the kicker.
- Sub `4 upcoming · 21 nights away`: Geist 13.5px, #6E665B.
- Trips are grouped by month. The month header is Newsreader italic 18px #4A443B, followed by a 1px rule (rgba(31,27,22,.12)) filling the remaining width. Margins are 22px above and 10px below.
- **Trip card**: grid `54px | 1fr`, gap 14, padding 16, radius 18, border 1px rgba(31,27,22,.09), gap 10 between cards.
  - Left: start day (Newsreader 30px) over the month (Geist Mono 10px, .08em).
  - Right: kicker `27–30 Oct · 3 nights` (Mono 10px uppercase), name (Newsreader 25px/1.05), meta (Geist 12.5px), then a rule and a status row (`No plans yet · Add bookings or notes`, or `9 days planned · 4 stays · 8 journeys`) with `→`.
  - A trip with plans uses the dark card: bg #26211B, text #F3EEE4, muted #C9BFAF, rule rgba(243,238,228,.14). An empty trip uses the light card: bg #FBF8F2, text #1F1B16, muted #6E665B.
  - The first upcoming trip shows a `NEXT` chip: Mono 9.5px, padding 4×7, radius 5, background = accent.
- Tapping a trip with plans opens its Today tab. Tapping an empty trip should open Edit trip for that trip (the prototype only shows a toast).

### 2. Today
Top to bottom:
1. **Header row**, padding `2px 16px 0 22px`.
   - Left, two Mono 11px lines: `‹ TRIPS · EGYPT` (tappable, goes back to Trips) and `DAY 3 OF 9`.
   - Right, two 42px circular icon buttons: border 1px rgba(31,27,22,.16), bg #FBF8F2, gap 8. The **plane** opens the Journeys sheet and the **bed** opens the Stays sheet. Icons are 1.6px-stroke line icons at 19–20px; use a real icon set (Lucide `plane` and `bed`).
2. **Day strip**: horizontal scroll, padding 14/22, gap 6.
   - Each chip is 44px wide, padding 8/9, radius 12: weekday (Mono 10px, uppercase), date (Newsreader 19px), and a 4px dot.
   - Selected: bg #26211B, text #F3EEE4. In the trip: bg #FBF8F2. Outside the trip: transparent at 35% opacity and not tappable.
   - The dot (accent colour) marks the real "today".
3. **Day heading**, padding 22px 22px 0.
   - Label `Today · Fri 25 December`: Geist 500, 12px, accent colour. It reads just `Fri 25 December` on other days.
   - H1 is the day title: Newsreader 38px/1.02, letter-spacing −.015em, `text-wrap:balance`.
   - Then a chip row: a mode chip (`GUIDED` / `SELF-PLANNED`, Mono 10.5px, 1px border, radius 6) followed by the one-line summary (Geist 13px, #6E665B).
4. **DaySummary card**: see Components. Margin 20px 16px 0. Tapping it opens the Day sheet.
5. **Timeline**: padding `26px 16px 8px 0`. Rows use grid `62px | 18px | 1fr`.
   - **Stop row**:
     - Time: Mono 500, 13px, right-aligned, 22px top padding.
     - Dot: 11px circle with a 2px ring in the tag colour, filled #F3EEE4, 21px top padding.
     - An ActivityCard in the third column, margin `4px 0 4px 8px`.
   - **Leg row**: see the CommuteLeg component.
   - **Now line** (only on the day that is actually today):
     - A 22px-tall row: time in Mono 600, 11.5px, #D23B2E.
     - An 11px dot in #D23B2E with a 3px halo at rgba(210,59,46,.18).
     - A 2px #D23B2E line across the content column, starting 4px left.
     - It is inserted after the last row whose start time ≤ now, and re-evaluated every 30s.
   - A "Show commutes" setting hides every leg row.

### 3. Trip (overview)
- Header: `‹ ALL TRIPS` (back) on the left, and a dark pill `Edit trip` on the right (bg #26211B, Geist 500 12.5px, padding 9×12) that opens the Edit trip sheet.
- `Egypt`: Newsreader 40px. Below it, `23–31 December · 9 days · 4 cities · 4 stays` in Geist 13.5px #6E665B.
- **Route box**: 1px border, radius 18, padding 16/18.
  - Rows alternate between a city (Newsreader 19px, with the nights count right-aligned in Mono 11.5px) and a leg line (`↓ PRIVATE CAR · 4 HR 15 MIN`, Mono 10.5px uppercase, accent colour).
  - Content: Munich → Hurghada → Luxor → Aswan → Cairo → Munich.
- **Day cards**, gap 10:
  - Grid `52px | 1fr`, padding 14/16, radius 16, bg #FBF8F2.
  - Left: weekday, date (Newsreader 28px) and a `TODAY` marker.
  - Right: `DAY 3 · GUIDED` (Mono 10px/1.3, nowrap), the title (Newsreader 20px), highlights (visit titles joined by ` · `, Geist 12.5px), then a rule and `Tonight: <stay name>`.
  - Tapping a card opens Today on that day.

### 4. Map
- Full-bleed paper map (#EFE8DC) with a 40px grid texture (rgba(31,27,22,.05)). The prototype draws a schematic: sea polygon #D6E0DB, the Nile as a polyline in #B9D0CC, and routes in the accent colour. **Replace it with a real map SDK** (Mapbox with a custom muted style, or Apple MapKit) using the same palette.
- Top overlay, starting at 58px:
  - A segmented pill `Day | Whole trip` (bg rgba(251,248,242,.92), active segment #26211B with #F3EEE4 text, nowrap) and a scale chip.
  - In Day mode, a horizontally scrolling row of day chips `D3 · 25`.
- **Day mode**:
  - Numbered markers: 26px circles, 2.5px #F3EEE4 border. Accent fill for activities, #2F6F73 for stays.
  - Stops at the same coordinates share one marker.
  - Labels are Newsreader 15px, flipped to the left when the marker is at x > 200, capped at 150px with an ellipsis, and hidden when within 30px of an earlier marker.
  - The route is a dashed `5 6` polyline through the stops plus any `via` waypoints.
- **Whole-trip mode**: one marker per city. Road legs are solid and flights are dotted `2 7`. Tapping a city opens Day mode on that city's first day.
- Bottom: the title (`Day 3 · Luxor West Bank`, Newsreader 22px) and a horizontal carousel of 210px cards (number badge, time, title, subtitle). Tapping a card opens the activity sheet.

### Sheets (shared behaviour)
- Scrim rgba(31,27,22,.38) that fades over .25s; tapping it closes the sheet.
- Panel: bg #F7F3EB, radius 28 on the top corners, max-height 86%, scrolls internally, 38×5 grab handle.
- Slides in with `transform: translateY(105%) → 0` over .32s, easing `cubic-bezier(.2,.8,.2,1)`.
- Content padding 10px 22px, bottom padding 34px.

**Activity sheet**
- Tag and date (Mono 10.5px, tag colour), then the title (Newsreader 30px) and subtitle.
- Two fields side by side: an editable START time input and a read-only DURATION.
- Key/value rows: GETTING THERE (the leg before), AFTERWARDS (the leg after) and ARRANGED BY (tour vs. you).
- NOTES textarea.
- Buttons: `Show on map` (outline) and `Save changes` (dark).
- Tapping a stop that is an overnight stay opens the Stay sheet instead.

**Stay sheet**
- `STAY · LUXOR`, then the name (30px) and area.
- A row of night chips, one per trip day; nights here are dark.
- Rows: CHECK-IN, CHECK-OUT, NIGHTS, CONFIRMATION, PHONE, BOOKED VIA.
- A note box: bg #EFE8DC, Newsreader italic 14.5px.
- Buttons: `Show on map` and `Done`.

**Day sheet**
- Kicker, then the theme (Newsreader italic 32px) and the story paragraph (Newsreader 14.5px/1.5, #4A443B).
- Three stat tiles.
- THE PLAN: each stop's time and title.
- BRING: pill chips.
- A tonight row (bg #EFE8DC) that links to the Stay sheet.

**Journeys sheet**
- `ALL JOURNEYS · 23–31 DEC`, then `Journeys` and a short explanation.
- One card per flight or long transfer: date block | `FLIGHT · LUFTHANSA` + `Munich → France` | duration.
- The card for the current day has bg #EFE8DC. Tapping a card opens that day.

**Stays sheet**
- `8 NIGHTS · 4 STAYS`, then one card per stay: city, nights, name, `in → out`.
- Tonight's stay is highlighted. Tapping a card opens its Stay sheet.

**Edit trip sheet (Claude)**
- Title and explanation, then three example-prompt chips that fill the textarea when tapped.
- A textarea, and the primary button `Apply with Claude`. While a request runs, the button reads `Updating your trip…` at 55% opacity and is disabled; it is also disabled when the textarea is empty.
- Error line (#B03A2E): `Couldn’t update the trip. Try rephrasing, or try again in a moment.`
- Result box (bg #EFE8DC): `3 CHANGES` plus one human-readable sentence per change, and an `Undo` link.
- Footer: a `View trip data (JSON)` toggle (a dark `<pre>` box) and `Reset to original`.

### Toast
Centred at top 56px: a dark pill with Geist 500 12.5px text. It fades and slides in from 10px above over .3s and hides after 2.2s. Messages: `Saved`, `Trip updated`, `Change undone`.

---

## Reusable components
These are in `prototype/*.dc.html`, and each takes plain data props.

**DaySummary** `{ kicker='Theme of the day', theme, blurb, stats:[{k,v}]×3, onOpen }`
- Card: bg #26211B, radius 20, padding 18/18/16.
- Kicker Mono 10.5px .1em #C9BFAF, with `→` at the right.
- Theme: Newsreader *italic* 27px/1.08.
- Blurb: Geist 13px/1.45 #D8CFC1.
- Stats: 3-column grid below a rule (rgba(243,238,228,.14)). Each stat is a label (Mono 9.5px #A89E8F) over a value (Geist 14px, ellipsis).
- Stats are derived: SIGHTS = number of `Visit` stops, ON THE ROAD = sum of non-flight leg durations, STARTS = first timed item.

**ActivityCard** `{ variant:'cards'|'ledger', tag, tagColor?, title, subtitle, duration, note?, onOpen }`
- `cards` variant:
  - bg #FBF8F2, 1px border rgba(31,27,22,.09), radius 16, padding 13/14/14, shadow 0 1px 2px rgba(31,27,22,.04). Hover changes the bg to #FFFDF8.
  - Top row: tag (Mono 10.5px uppercase, tag colour) and duration (Mono 11.5px #6E665B).
  - Title: Newsreader 20px/1.15. Subtitle: Geist 12.5px.
  - If there's a note, it sits below a rule in Geist 12.5px #4A443B.
- `ledger` variant: no card, with a bottom rule instead. Title Newsreader 24px, a meta line, and the note in Newsreader italic 14px.
- Tag colours: Visit #A8492A · Meal #8A6A2F · Stay #2F6F73 · Flight / Arrival #4A5B8C · Pick-up #4A443B.

**CommuteLeg** `{ mode:'car'|'walk'|'train'|'metro'|'flight', duration, time?, detail }`
- Grid `62 | 18 | 1fr`, min-height 44.
- Time: optional, Mono 11.5px #6E665B.
- Rail: a 1.5px dashed line in rgba(31,27,22,.28).
- `CAR · 35 MIN`: Mono 500, 10.5px, .07em, uppercase. Walk is #2F6F73; the other modes are #4A443B / #4A5B8C.
- Detail: Geist 12.5px #6E665B.

---

## Data model
Store trips as **JSON**. JSON is native to JS and Swift, strict, and what the LLM produces reliably. YAML import/export can be added later for hand-editing.

`data/trips-index.json`: the list of trips `{id, name, start, end, nights, summary, status:'empty'|'planned'}`.

`data/egypt-trip.json`, a full trip:
```ts
Trip = { id, year, month, days: Day[], stays: Record<string, Stay>, journeys: Journey[] }
Day = { num, d /*day of month*/, wd, title, mode:'Guided'|'Self-planned', stay: stayId|null,
        summary, theme, blurb, story, bring: string[], draft?, items: (Stop|Leg)[] }
Stop = { kind:'stop', id, time:'HH:MM'|'—', title, sub, tag:'Visit'|'Meal'|'Stay'|'Flight'|'Arrival'|'Pick-up',
         dur?, note?, ll?: [lat, lon], stay?: stayId /* opens the Stay sheet */ }
Leg = { kind:'leg', mode:'car'|'walk'|'train'|'metro'|'flight', dur, text, time?, via?: [lat,lon][] }
Stay = { id, city, name, area, inShort, outShort, nights: dayIndex[], conf, phone, by, notes, ll, day }
Journey = { day /*0-based*/, mode:'Flight'|'Car'|'Train', by, from, to, dur }
```
Recommended changes for production:
- Replace `d` / `wd` / `inShort` with ISO dates (`date: '2026-12-25'`, `checkIn: '2026-12-24T17:30'`) and derive the display strings.
- Store the timezone per day (`tz: 'Africa/Cairo'`) so the now line uses local trip time.
- Values of `"—"`, `"Add confirmation"` and `"Add phone"` are placeholders for missing data. Render them as "add" prompts, not as values.
- Only one trip is loaded in the prototype. Production needs a `trips` table plus a per-trip document.

## Claude integration (Edit trip)
- The system prompt is in `data/claude-edit-system-prompt.txt`.
- Request: `{ model: sonnet, max_tokens: 12000, system, messages:[{role:'user', content: 'Current trip JSON:\n' + trip + '\n\nRequest:\n' + text}] }`.
- Claude returns `{ summary: string[], ops: Op[] }`, a **patch, not the whole trip**. This keeps output small and fast, and makes the change list and Undo easy.
- Ops: `update_item`, `add_item` (with `after_id`), `remove_item`, `update_day`, `add_day`, `remove_day`, `update_stay`, `add_stay`, `remove_stay`, `add_journey`, `update_journey`, `remove_journey`. The reference implementation is `applyOps()` in the main prototype file.
- For production:
  - Call the API from a **server** and never ship the key to the client.
  - Use **tool use with a JSON schema** (one `apply_trip_ops` tool) instead of parsing free text.
  - Validate the ops with zod or pydantic before applying them.
  - Keep a version history, not just one undo step.
  - Use the same pipeline to create a trip from pasted text: an empty trip plus `add_day` / `add_stay` ops.
- Persistence in the prototype: `localStorage['tc-trip-v1']`. Production: a database plus an offline cache (the app must work without signal).

## State (per trip view)
`tab` ('home'|'today'|'trip'|'map') · `dayIdx` · `mapMode` ('day'|'trip') · `sheet` ({type:'stop'|'stay'|'day'|'journeys'|'stays'|'add', id?}) · `edits` (local time/note overrides; fold these into the trip in production) · `draftTime`/`draftNote` · `editText`/`editBusy`/`editErr`/`editResult`/`prevTrip` · `toast`.

## Settings (from the prototype's tweaks)
- `accent`: default #A8492A (terracotta); alternatives #2F6F73, #4A5B8C, #8A6A2F.
- `cardStyle`: `cards` | `ledger`.
- `showTransport`: show or hide commute legs.
- `liveClock` / `simulatedHour`: for testing the now line only; don't ship them.

## Design tokens
- **Paper** #F3EEE4 (app bg) · **Sheet** #F7F3EB · **Card** #FBF8F2 (hover #FFFDF8) · **Sand** #EFE8DC (map bg / info boxes) · **Chip-draft** #EADFCB / #6B4E1F
- **Ink** #1F1B16 · **Ink-2** #4A443B · **Muted** #6E665B · **Muted-2** #8A8174 · **Dark surface** #26211B, with text #F3EEE4, #C9BFAF, #D8CFC1, #A89E8F
- **Accent** #A8492A · **Nile/stay** #2F6F73 · **Flight** #4A5B8C · **Meal** #8A6A2F · **Now** #D23B2E · **Error** #B03A2E
- **Rules**: rgba(31,27,22,.08 / .09 / .10 / .12 / .16 / .18). Scrim rgba(31,27,22,.38).
- **Type**: Newsreader (headings and serif body, 400, italic for themes), Geist (UI, 400/500/600), Geist Mono (times, kickers, labels, 400/500), all from Google Fonts.
  - Scale: 44 / 40 / 38 / 32 / 30 / 27 / 25 / 24 / 22 / 20 / 19 / 18 / 17 / 16 / 15 / 14.5 / 14 / 13.5 / 13 / 12.5 / 12 / 11.5 / 11 / 10.5 / 10 / 9.5.
  - Kickers are always Mono, uppercase, letter-spacing .06–.1em.
- **Radius**: 5, 6, 10, 12, 14, 16, 18, 20, 28 (sheets), 999 (pills).
- **Spacing**: screen side padding 22 (text) / 16 (cards); card padding 13–18; list gaps 6 / 8 / 10 / 12.
- **Shadows**: card 0 1px 2px rgba(31,27,22,.04); map card 0 6px 18px rgba(31,27,22,.08).

## Assets
No images. Icons are inline line SVGs (plane, bed); use Lucide or SF Symbols instead. The map is a hand-projected schematic; replace it with a map SDK.

## Files
- `prototype/Travel Companion.dc.html`: the main prototype, with all screens, sheets, data, the Claude call and `applyOps`.
- `prototype/DaySummary.dc.html`, `ActivityCard.dc.html`, `CommuteLeg.dc.html`: the reusable components.
- `prototype/ios-frame.jsx`, `support.js`: runtime and device bezel, reference only.
- `data/egypt-trip.json`, `data/trips-index.json`, `data/claude-edit-system-prompt.txt`.

## Known gaps / next steps
1. The day strip is fixed to December 2026. Derive it from the trip's ISO dates.
2. The empty trips (Copenhagen & Malmö, London, Vietnam) need the "create from text" flow, which uses the same Claude pipeline.
3. Offline-first storage, and ideally a lock-screen or home-screen widget for "Now / Next".
4. Forwarding booking emails into a trip (an inbound email address) is a natural next input.
5. Times for the Egypt tour are estimates, because the source text had none.
