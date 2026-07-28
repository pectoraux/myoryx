# Oryx — Build Worklog

Project: Oryx, The AI Mobility Marketplace
A Next.js 16 single-route experience: full-screen map + draggable bottom sheet,
live reverse auction between transportation providers, AI bargaining, savings KPI,
multi-hop routing, agent marketplace, and savings leaderboard.

---
Task ID: 0
Agent: orchestrator
Task: Initialize project plan, theme, shared types, mock data, and Zustand store.

Work Log:
- Installed leaflet, react-leaflet, @types/leaflet, socket.io-client.
- Designed a dark "terminal-grade" theme (globals.css) with emerald (savings) + amber (auction) accents. Dark set as default on <html>.
- Created shared types (src/lib/types.ts): Provider, FareQuote, DriverBid, AuctionState, AgentProfile, RouteOption, WaitOption, SavingsStats, LeaderboardEntry, PoolSuggestion, MarketTicker, Destination.
- Created mock-data.ts with 8 providers, 6 AI agent strategies, Accra-relevant destinations, savings stats, leaderboard, market tickers, vehicle marker + fare helpers.
- Created Zustand store (src/lib/store.ts) orchestrating sheet snap, trip metrics, fare quotes, live auction state machine, agent strategy, auto-book, and savings accumulation.

Stage Summary:
- Foundation complete. Next: WebSocket auction mini-service, API routes, then the map + bottom sheet UI components.

---
Task ID: 1
Agent: orchestrator
Task: Build the full Oryx experience — map, bottom sheet, live auction, all feature panels, APIs, and WebSocket mini-service. Self-verify with Agent Browser.

Work Log:
- Built premium dark theme (globals.css) with emerald (savings) + amber (auction) accents, glassmorphism, grid texture, custom Leaflet dark overrides, animations.
- Created shared types, mock-data (8 providers, 6 agents, Accra destinations, savings stats, leaderboard), and Zustand store orchestrating sheet/quotes/auction/agent/savings.
- Built Leaflet MapView (CartoDB dark tiles, animated vehicle markers, route polyline, pulse markers) with dynamic ssr:false import.
- Built draggable BottomSheet with 3 snap states (collapsed/half/full) using pointer events + derived height (no setState-in-effect).
- Built HeaderBar (logo, savings badge), MarketTicker (scrolling live feed).
- Built DestinationSearch (Layer 1 search), ProviderComparison (Layer 1 universal search, surge, features), WaitOptimizer (Layer 4), DestinationIntel (Layer 5), PoolSuggestions (Layer 7), RouteAlternatives (Layer 6 multi-hop), MergeOffer (Layer 8 modal).
- Built AuctionPanel (Layers 2 & 3) — live reverse auction with countdown, falling price, bid feed, auto-book ceiling, booking confirmation.
- Built AgentSelector (Layer 10 — 6 strategies with intensity meters), SavingsPanel + FlywheelViz + Leaderboard (Layers 21-23).
- Built IntroOverlay (3-slide onboarding explaining the marketplace concept).
- Built WebSocket mini-service (port 3003) driving live reverse auctions + ambient market ticker.
- Added useAuctionWs hook with local-simulation fallback (kicks in after 2.5s if WS unavailable) for robustness on any access path.
- Built API routes: /api/savings, /api/leaderboard, /api/ride, /api/providers, /api/routes. Pushed Prisma schema (Ride, Provider, LeaderboardEntry, SavingsStat).
- Fixed lint (set-state-in-effect), WS path config (path:"/" + forceNew), merge-offer interference during active auctions (liveAuctionActive flag).

Self-Verification (Agent Browser + VLM):
- Intro overlay renders 3 slides correctly.
- Search → destination selection → comparison cards (Uber/Bolt/Yango/inDrive/Taxi with surge + AI recommendation).
- Live auction via WebSocket (port 81 gateway): real-time price drops ($4.94 → $2.22), LIVE BIDS list with driver names/ratings/vehicles, countdown, "Book" → "Ride secured" + savings KPI increments ($412 → $413.31, rides 87 → 88).
- Savings tab: $413.31 YTD, 88 rides, CO2 34.6kg, flywheel diagram, leaderboard.
- Agent tab: 6 strategies with intensity bars. Routes tab: multi-hop alternatives ($22 direct vs $9 walk+shuttle+ride vs $9 moto+ride).
- Local fallback verified on port 3000 (no gateway): auction simulates live bids after 2.5s — "Book $3.68 · save $1.28" with full bid list.
- Mobile responsive (390px) verified.
- Lint clean, no runtime errors.

Stage Summary:
- Oryx is complete and browser-verified end-to-end. The live reverse auction works via WebSocket (gateway) with a graceful local fallback. All 10+ feature layers render and interact correctly. Both the Next.js dev server (3000) and auction mini-service (3003) are running.
