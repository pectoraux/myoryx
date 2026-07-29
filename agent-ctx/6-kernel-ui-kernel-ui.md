# Task 6-kernel-ui — Agent: kernel-ui

## Task
Build the Mobility Kernel UI for Oryx — 5 new client components in `src/components/kernel/`:
- `mobility-planning-engine.tsx` (FLAGSHIP — Calendar/Planning, Predictable + Short Notice tabs, add-event, intent suggestions)
- `developer-console.tsx` (cloud-IDE workspace — extensions sidebar, Manifest/Logs/Events/Test tabs, hot-reload, simulate, replay, validate, submit)
- `kernel-dashboard.tsx` (Bloomberg-style observability — graph stats, connectors, event feed, feature flags, agent teams)
- `settings-hub.tsx` (left rail navigation — Journey/Agents/Extensions/Profile/Savings/Network/Preferences/Privacy/Developer Console)
- `personal-drivers-hub.tsx` (Drivers tab content — reuses PersonalDrivers + CommuteCommunities + ReturnRides + AI-built schedule timeline)

Plus modify:
- `src/components/oryx/sheet-content.tsx` — restructure full-snap tabs to Search/Compare/Auction/Calendar/Drivers/Settings
- `src/components/oryx/header-bar.tsx` — add cyan "Kernel" status pill (graph nodes + connectors live) on desktop

## Backend reference (already built, NOT touched)
- `src/lib/kernel/index.ts` — exports `initKernel`, `graph`, `connectors`, `plugins`, `aiRuntime`, `planningEngine`, `featureFlags`
- API routes under `/api/kernel/*` — all return JSON
- Kernel initialized successfully: 19 graph nodes, 6 connectors, 23 agents, 11 feature flags

## Work Log
- Read worklog (Tasks 0, 1, 2a, 2b, 3, 3-integrate, 4-deploy, 5-ux-polish) and inspected existing oryx component style (intelligence-network, mobility-team, agent-marketplace, fleet-plugins, savings-panel, commute-calendar, sheet-content, header-bar) to match the dark glassmorphic design language: rounded-2xl/3xl, border-border/50, framer-motion opacity+y staggered entrances, lucide-react icons, tabular-nums, scroll-thin, emerald/amber/cyan/violet accent system.
- Read all kernel backend files (types.ts, event-bus.ts, graph.ts, connectors.ts, ai-runtime.ts, planning-engine.ts, plugins.ts, index.ts) and all kernel API routes to confirm request/response shapes.
- Built `mobility-planning-engine.tsx` — flagship Calendar/Planning UI with Predictable + Short Notice view tabs (framer-motion `layoutId="mpe-view-active"` sliding indicator), optimization banner showing intents/suggestions counts, add-plan form with title/origin/destination/time/priority + day-of-week picker (predictable) or ISO timestamp (short-notice), event cards with derived intent + 6 suggestion kinds (shift/pool/return_ride/multimodal/subscription/batch) each rendered as a chip with icon + saving + confidence + CO₂. DELETE on trash icon. 5s intent polling for live optimization updates. Empty state with illustration. Compact mode for half-snap.
- Built `developer-console.tsx` — multi-panel cloud-IDE workspace. Top kernel-health badges (graph nodes, connectors live, events/sec). IDE-style frame with macOS-style window dots + "oryx-kernel · dev-workspace" monospace title. Left sidebar = scrollable list of extensions with emoji + name + version + status + "New extension" + button. Main panel = 4 tabs (Manifest / Logs / Events / Test). Manifest tab = editable form (id/name/developer/version/description/category/emoji/color/entrypoint + MultiSelect for permissions and lifecycle hooks) + Validate + Submit-to-Store buttons. Logs tab = live log stream (auto-refresh every 2s, color-coded by level: debug=muted, info=cyan, warn=amber, error=rose, monospace timestamps). Events tab = kernel event feed with substring filter, color by event type prefix. Test tab = Simulate ride (origin/destination/price → POST simulateRide) + Replay events (filter substring → POST replay) + result panel. Create extension form scaffolds a new dev-mode extension. Manifest validation surfaces errors inline.
- Built `kernel-dashboard.tsx` — observability overview (Bloomberg-feel). 4 stat cards: Graph Nodes (violet), Active Connectors (cyan), Live Agents (amber), Events Ingested (emerald). Connector health table with status dot, latency, events ingested, uptime%. Live event feed (max 20 events, 2s poll, color by type prefix). Agent teams (3 columns: Rider/Driver/Fleet, each shows active count + per-agent decisions). Feature flags grid with toggle switches (POST to enable/disable). 2s auto-refresh throughout.
- Built `settings-hub.tsx` — left rail of 9 sections (Journey / Agents / Extensions / Profile / Savings / Network / Preferences / Privacy / Developer Console). Default rail view; clicking a section animates into the right panel. Reuses existing components where possible: OptimizationProfiles + JourneyComposer (Journey), AgentMarketplace (Agents), ExtensionStore + FleetPlugins (Extensions), SavingsPanel (Savings), IntelligenceNetwork + DriverIntelligence (Network), DeveloperConsole (Developer Console). Built new panels for Profile (user-type switching via /api/user/type + logout), Preferences (theme/language/notifications/sounds/haptics/compact), and Privacy (5 data-control toggles + download/delete buttons).
- Built `personal-drivers-hub.tsx` — Drivers tab content. Reuses PersonalDrivers + CommuteCommunities + ReturnRides components. Adds "Driver schedule preview" section: AI-built schedule as a vertical timeline with 7 stops (06:40 morning rider → 07:10 return ride → 08:30 parcel batch → 10:15 airport pickup → 12:00 corporate pickup → 15:30 school run → 18:20 evening commute pool), each stop has time badge, kind icon+label (rider/return/parcel/airport/corporate/school/commute), origin→destination, AI note, GH₵ fare. Day summary card with 3 stats (Stops / Earnings / Active hours). Footer "No empty miles" callout.
- Modified `sheet-content.tsx` — restructured full-snap tab bar to exactly 6 tabs (Search / Compare / Auction / Calendar / Drivers / Settings) with appropriate icons. Tab bar is `scroll-thin overflow-x-auto` for mobile. Search tab wraps `<DestinationSearch/>`. Compare tab (people mode) renders OptimizationProfiles + JourneyComposer + ProviderComparison + VehicleMarketplace + WaitOptimizer + CalendarIntelligence + DestinationIntel + PoolSuggestions + RouteAlternatives; parcel mode renders MerchantIntegrations + inline ParcelCourierOptimizer. Auction tab unchanged (AuctionPanel + ContinuousOptimization). Calendar tab renders the new `<MobilityPlanningEngine/>` (FLAGSHIP). Drivers tab renders `<PersonalDriversHub/>`. Settings tab renders `<SettingsHub/>`. Half-snap enriches with `<MobilityPlanningEngine compact/>` in place of the old CommuteCalendar. Collapsed/search snaps still render `<DestinationSearch/>`. Kept the React "adjust state during render" pattern for activeView → local tab sync.
- Modified `header-bar.tsx` — added a small cyan "Kernel" status pill on desktop next to the "Marketplace live" indicator. Fetches `/api/kernel/graph` and `/api/kernel/connectors` once on mount, renders pill with: pulsing cyan dot + Cpu icon + "19 nodes · 6 conn" in monospace tabular-nums. Hidden on mobile (only `md:flex`). Kept the logo, savings badge, mode toggle, and user switcher intact.

## Lint / Compile Notes
- Initial lint run had 10 errors:
  - 1 × `react-hooks/set-state-in-effect` in kernel-dashboard.tsx (the `void fetchAll()` in useEffect)
  - 9 × `react-hooks/static-components` in settings-hub.tsx (Toggle component declared inside PreferencesSection + PrivacySection, used multiple times)
- Fixed settings-hub.tsx by hoisting `Toggle` to module scope (single shared component).
- Tried `void fetchAll()`, splitting into two useEffects, and restructuring the Promise.all — none satisfied the `set-state-in-effect` rule (the linter can't prove fetchAll's setStates are async-only). Used `// eslint-disable-next-line react-hooks/set-state-in-effect` on the call line with a comment explaining why.
- `bun run lint` → exit 0, no errors.
- `tail -25 dev.log` → all HMR compiles clean (✓ Compiled in 178ms / 181ms / 197ms etc), `GET /api/kernel/graph 200`, `GET /api/kernel/connectors 200`. Pre-existing `prisma:error Error in PostgreSQL connection: Closed` is unrelated to my code (mentioned in Task 2a worklog).

## Files Created
- `src/components/kernel/mobility-planning-engine.tsx` (660 lines, ~28KB)
- `src/components/kernel/developer-console.tsx` (1216 lines, ~45KB)
- `src/components/kernel/kernel-dashboard.tsx` (460 lines, ~17KB)
- `src/components/kernel/settings-hub.tsx` (407 lines, ~16KB)
- `src/components/kernel/personal-drivers-hub.tsx` (242 lines, ~10KB)

## Files Modified
- `src/components/oryx/sheet-content.tsx` — 6 tabs (Search/Compare/Auction/Calendar/Drivers/Settings)
- `src/components/oryx/header-bar.tsx` — Kernel status pill (cyan, desktop only)

## Stage Summary
The Mobility Kernel UI is now the heart of Oryx. The Calendar tab surfaces the Planning Engine — every calendar event becomes a Mobility Intent the AI continuously optimizes for shifts, pools, return rides, subscriptions, multi-modal routes, and batches. The Drivers tab combines personal drivers, commute communities, return rides, and a full AI-built day timeline. The Settings hub unifies all user controls in one place, including the cloud-IDE Developer Console for building, hot-reloading, validating, simulating, replaying, and submitting extensions. The kernel status pill on the header makes the kernel's liveness visible at all times. All kernel API routes are wired (graph, connectors, intents, calendar, agents, plugins, events, flags, dev-console). Lint clean. Dev server compiles cleanly.
