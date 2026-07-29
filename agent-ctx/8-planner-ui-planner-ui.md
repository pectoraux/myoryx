# Task 8-planner-ui — Work Record

Agent: planner-ui
File owned: `src/components/kernel/mobility-planning-engine.tsx` (rewritten end-to-end, ~2480 lines)

## What shipped

A production-grade Mobility Planning Engine UI that exposes the kernel as a real
planning tool (Google Calendar meets Bloomberg Terminal for mobility).

### Top bar
- "Mobility Planning Engine" pill + title + subtitle.
- Emerald "Add plan" button on the right (opens the inline editor).
- Optimization status banner (cyan gradient): brain icon (animated wiggle),
  "{X} intents being optimized · {Y} suggestions found", emerald "{Z} potential
  savings" chip, red "{N} conflicts" badge that expands into a conflict list
  (each conflict shows severity, type, detail, and AI resolution).

### View toggle
- Predictable Trips | Short Notice Trips — framer-motion `layoutId="mpe-view-active"`
  sliding indicator with emerald active ring.

### 4 sub-views (tabs below the view toggle)
1. **Timeline** (default): vertical timeline 05:00–23:00 with hour gridlines.
   Each event is a card anchored to its time slot via absolute positioning;
   horizontal connector line back to the time axis. Greedy lane-packing
   (`assignLanes`) prevents overlapping cards from stacking. Color-coded by
   priority (critical=rose, high=amber, normal=emerald, low=zinc — left border
   + chip + dot). Recurring events show a repeat icon. "NOW" line (emerald,
   animated pulsing dot) at current time. Auto-scrolls to current time on
   mount. Cards show title, route, time, priority chip, est. cost (Wallet
   icon), suggestion count (Sparkles). Out-of-window events clamp with
   "↤ out of view" tag.
2. **Day**: 7-column strip (Sun–Sat) with sticky day headers + per-day event
   count. Each event card shows time, route, priority chip, suggestion count.
   Horizontally scrollable on mobile (min-w-[640px]).
3. **Week**: 7-day × 18-hour grid (rows=hours 5–22, cols=days Sun–Sat). Compact
   event chips per cell. Sticky header. Scrolls both directions on mobile.
4. **List**: legacy-style cards — time block (left), title + priority chip,
   route, recurring days, est. cost, intent type, suggestion count. Hover
   reveals a trash button. Clicking selects (opens detail dialog).

### Event editor (inline expandable form)
- Title, Origin, Destination inputs.
- Time input + recurring days (S M T W T F S toggle buttons) — only for
  predictable view.
- Priority segmented control (low/normal/high/critical) with priority-color
  chips.
- Plan span segmented control (hourly/daily/weekly/monthly).
- **Arrival flexibility slider** (0–60 min) with live "±N min window" label
  and a gradient-filled track (accent-emerald-500).
- Notes input.
- Save/Cancel buttons. POSTs full body (incl. planSpan, travelWindow.flexibilityMin,
  notes, policy.allowedModes) to `/api/kernel/calendar` on save, then refetches
  events + intents + conflicts.

### Selected event detail dialog (flagship)
Modal overlay with bottom-sheet-on-mobile / centered-on-desktop animation.
- Sticky header: icon, title, priority chip, time, route, recurring days,
  intent type, remove + close buttons.
- 3-stat summary grid: Est. cost (cyan), Top saving (emerald), Status (animated
  spinner if not optimized, check if optimized).
- **Cost-over-time AreaChart** (recharts):
  - `<ResponsiveContainer>` `<AreaChart>` with `data=predictions`.
  - XAxis=24 hours (HH:MM), YAxis=₵ cost (auto-domain with 10% padding).
  - Emerald gradient fill (`linearGradient id="costFill"`).
  - CartesianGrid (subtle), XAxis interval=2.
  - **ReferenceLine** at "NOW" (amber dashed, top label "NOW").
  - **ReferenceDot** for cheapest slot (emerald, label `₵{cost}` below).
  - **ReferenceDot** for peak slot (rose, label `₵{cost}` above).
  - Custom `<ChartTooltip>` shows time, fare, surge multiplier, demand level
    (color-coded), confidence %.
  - Legend below the chart explains the 4 markers.
  - "−{X}% if shifted" badge in the chart header.
  - Falls back to fetching `/api/kernel/cost?intentId=` if intent lacks
    costOverTime — uses a per-intentId cache to avoid synchronous setState
    in effect (lint-clean).
- **Optimization suggestions** list (sorted by saving desc):
  - 2-column grid (sm+) of suggestion cards.
  - Each card: kind icon (8 kinds supported: shift/pool/return_ride/multimodal/
    subscription/batch/traffic/calendar_adjust with TrafficCone + CalendarClock
    icons for the 2 new kinds) in a tinted square, title, GH₵ saving (emerald),
    detail, label + confidence + CO₂ badge, and an "Apply" button that toasts
    "Suggestion applied".
  - "AI is still optimizing this intent…" empty state (pulsing cyan dot) when
    no suggestions exist yet.

### Empty state
Calendar icon (emerald for predictable, amber for short_notice), "No recurring
/ short-notice trips yet" + "Add your first trip to let the AI optimize it." +
emerald "Add your first trip" button.

### Compact mode (half-snap)
When `compact={true}`:
- Title pill + total potential savings chip.
- Compact view toggle (Predictable / Short — splits on first word for fit).
- Inline editor (same EventEditorBody) when "Add plan" tapped.
- List of next 3 events (sorted by time, filtered to upcoming) — each shows
  time, title, route, and either the top suggestion (kind icon + title + saving)
  or "optimizing…" spinner.
- "Add plan" dashed button at the bottom.
- Tapping an event opens the same detail dialog.

### Technical notes
- `"use client"` component, all sub-components hoisted to module scope to
  satisfy `react-hooks/static-components` lint rule.
- Data fetched with `useEffect` + `fetch` + `useState`; intents + conflicts
  polled every 5s (continuous re-optimization).
- Intent lookup uses both `intentId` and `title` fallback (the seed data uses
  `intentId` link; older flows may not).
- framer-motion: opacity+y staggered entrances on every list/grid; layoutId
  sliding indicator on view toggle; AnimatePresence on editor + detail dialog
  + sub-view transitions.
- recharts: ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceDot — all proper imports.
- Color system: emerald (savings/active), amber (auction/shift/high), cyan
  (intelligence/intent type), rose (conflicts/critical), zinc (low), violet
  (pool), pink (subscription), orange (batch), sky (calendar_adjust).
- Dark-theme-native: bg-background, bg-card/40, border-border/50, ring-1
  accents — opaque card backgrounds since the bottom sheet is already opaque.
- lucide-react icons throughout (24 icons imported).
- All API requests use relative paths (`/api/kernel/...`).

## Verification
- `cd /home/z/my-project && bun run lint` → exit 0, NO errors, NO warnings.
  (Initial run had 1 error + 1 warning: `react-hooks/set-state-in-effect` on
  `setExtra(null)` in CostChartCard effect, plus an unused
  `eslint-disable-next-line react-hooks/exhaustive-deps` line. Fixed by
  refactoring to a per-intentId cache `{ intentId, data }` so the
  "mismatch" case is filtered at read time and there is no synchronous
  setState in effect; removed the now-unnecessary disable comment.)
- `tail -c 4000 dev.log` → most recent entries: `✓ Compiled in 4.2s`,
  `✓ Compiled in 229ms`, `GET / 200 in 340ms (compile: 52ms, render: 288ms)`.
  No compile errors. Pre-existing "EADDRINUSE :::3000" is a duplicate-startup
  attempt by an external process — the actual dev server is running fine.
- Confirmed live API responses for the component:
  - `GET /api/kernel/calendar?userId=demo&view=predictable` → 2 events (Office
    commute, Sunday church) with `intentId` links.
  - `GET /api/kernel/intents?userId=demo` → intents with `suggestions[]`
    (sorted by saving desc), `costOverTime` populated, `estimatedCost` set.
  - `GET /api/kernel/conflicts?userId=demo` → 1 overlap conflict (Sunday
    church ↔ Airport trip, 87 min).
- Did NOT run `bun run build` per instructions.
- Did NOT touch any other file (backend, other components, store, types, etc.).

## Files modified
- `src/components/kernel/mobility-planning-engine.tsx` (REWRITTEN — only file
  touched per ownership rules)
