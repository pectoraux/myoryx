# Task 9-team-ui — Work Record

Agent: team-ui
File owned: `src/components/kernel/mobility-team.tsx` (CREATED, ~2660 lines — file did not previously exist)

## Task
Build the flagship "Autonomous AI Workforce" Team tab UI for Oryx's M7–M9 multi-agent runtime. Expose live reasoning, current tasks, learned optimizations, agent-to-agent cooperation, and full explainability for the 25 agents across 4 teams (rider/driver/fleet/merchant). Only `src/components/kernel/mobility-team.tsx` may be touched.

## Backend reference (already built, NOT touched)
- `src/lib/kernel/ai-runtime.ts` — the AIRuntime class: registerAgent, activate/deactivate, enqueueTask→processQueue→executeTask (real per-type reasoning steps + confidence + savings + learned patterns), startNegotiation→runNegotiation (auto-converging buyer/seller rounds with settlement), recordCooperation, delegateTask, shareInformation, recordLearnedOptimization, recordDecision, getAgentWithMemory (returns status/active/config/metrics/recentDecisions[reversed last-5]/recentTasks[reversed last-5]/learnedOptimizations[full]/facts count).
- API routes (all relative, all JSON):
  - `GET /api/kernel/agents` — array of `AgentWithMemory`
  - `GET /api/kernel/agents?team=...` — filter
  - `GET /api/kernel/agents?detail=full&agentId=...` — single agent
  - `POST /api/kernel/agents` — `{agentId, action, ...}` for activate/deactivate/configure/enqueueTask/startNegotiation/delegate/shareInfo
  - `GET /api/kernel/negotiations`, `GET /api/kernel/cooperations`, `GET /api/kernel/ai-stats`

## What shipped

### Section 1 — Team overview banner
- 4 team columns (Rider 🧍 / Driver 🚗 / Fleet 🚐 / Merchant 📦): emoji, agent count, active/learned/savings pips. Per-team accent colors (emerald/amber/orange/violet).
- Runtime stats strip: 6 cells (Agents / Active / Queued / Negotiating / Learned / Savings) with icons + colors.
- Pulsing emerald "Live · 3s poll" indicator in the header.
- Polls `/api/kernel/ai-stats` + `/api/kernel/agents` + `/api/kernel/cooperations` together every 3s.

### Section 2 — Agent grid (main area)
- Team filter tabs (All ✦ / Rider / Driver / Fleet / Merchant) with framer-motion `layoutId="team-filter-active"` sliding indicator + per-tab count badges.
- Grid: 1 col mobile / 2 col sm / 3 col lg. Sorted active-first, then by total savings desc.
- Each `AgentCard`:
  - Colored emoji avatar (tinted with `agent.color`, ring-1), pulsing status dot (active=emerald, thinking=amber, negotiating=violet, learning=cyan, idle=zinc).
  - Name, role (snake_case→readable), team badge, status badge.
  - 2-line description.
  - Active toggle switch (POST activate/deactivate, animated).
  - **Mini sparkline**: recharts `ResponsiveContainer`+`AreaChart`+`Area` with the agent's color + gradient fill; 7-day rolling window from `dailyStats[]`; custom `SparkTip` tooltip (date/savings/tasks); "No activity yet" fallback.
  - Metrics row: tasks done / savings / avg-conf % / negotiations W/L.
  - Footer: learned count + "Inspect →" hover hint.
  - Keyboard accessible (Enter/Space), role=button.

### Section 3 — Agent Detail Panel (flagship explainability)
Slide-over from the right (640px desktop, full-screen mobile) with spring transition. Click-out catcher.
- `DetailHeader`: large emoji avatar, name, status badge, team badge, role (mono), facts count, description.
- `DetailTabs` (framer-motion `layoutId="detail-tab-active"` underline): Reasoning / Tasks / Learned / Config, each with count badges.

**a) Reasoning (live)** — vertical timeline spine with amber node dots. Each `DecisionCard`:
- Header: action (mono chip), triggeredBy (mono + Zap icon), confidence badge (color-coded), timestamp.
- Reasoning text.
- **`ReasoningTrace`** (flagship): terminal/code-style trace — `01 │` numbered steps + vertical bars + monospace text on `bg-zinc-950/60` with "CircuitBoard" label header. This is the explainability surface.

**b) Current Tasks** — list of `TaskCard`:
- Header: type (mono), status badge (queued/running/completed/failed), intentId (mono + Plug icon), timestamp, duration (Timer icon, cyan).
- Reasoning trace (same terminal trace component).
- Expandable Input/Output JSON (collapsed by default, ChevronDown toggle, pretty-printed monospace panels with cyan/emerald labels).
- "Assign task" button → `AssignTaskForm` (type/desc/intentId, POSTs `enqueueTask`).

**c) Learned Optimizations** — top banner "This agent has learned N optimizations from M tasks." Each `LearnedCard`:
- Cyan Lightbulb icon, pattern, confidence badge, insight text.
- "Applied N×" (emerald), learned-at (Clock, ago), type (violet chip).
- Optimization recipe: pretty-printed JSON of `optimization.params` on `bg-zinc-950/60` panel.

**d) Configuration**:
- Lifetime metrics grid (3 cols × 3 rows): tasks done/failed, avg conf, negotiations W/L, avg duration, total savings, learned count, facts count.
- `ConfigSlider`: Aggressiveness (0–1, "Conservative ↔ Aggressive", emerald), Risk tolerance (0–1, "Cautious ↔ Bold", amber). Range input with `accentColor` + colored badge.
- ToggleRow: Learning enabled (cyan), Agent active (emerald) — animated switches.
- Permission overrides: 8 chips (book, negotiate, delegate, share_info, learn, reroute, vet, broadcast) — toggleable with Lock/Unlock icons. Shows default policy.
- Sticky bottom bar: dirty/sync indicator + Delegate button (opens `AgentDelegator` modal — select to-agent/type/desc, POSTs `delegate`) + Save config (POST configure, only enabled when dirty).

### Section 4 — Cooperation feed (bottom)
- Network icon header + "Start negotiation" button.
- `StartNegotiationForm`: buyer/seller agent selects (active only, mutually exclusive), asset text, opening price, Start button (POST `startNegotiation` with `agentId=buyerId, sellerAgentId, asset, openingPrice`).
- Scrollable feed (max-h-96, scroll-thin). Each `CooperationRow`:
  - Type icon (Handshake/Send/MessageCircle/Radio) in tinted square.
  - Type label + outcome badge (success=emerald, pending=amber pulse, failed=rose).
  - Description + agent chain (emoji + colored name, separated by ArrowRight).
  - Timestamp (ago).

### Compact mode (`compact` prop, for half-snap)
- "AI Workforce" pill + total savings chip.
- "X of Y active · Z queued · N negotiating · M learned" summary line.
- Top-4 active agents by savings as small selectable cards with status dots.
- Live cooperation feed (max 4).
- Selecting opens the same Detail Panel.

## Technical notes
- `"use client"`. All sub-components hoisted to module scope (satisfies `react-hooks/static-components`).
- Single 3s poll loop fetches agents + stats + cooperations via `Promise.all`. Each fetch wrapped in try/catch.
- All API requests use relative paths only.
- POST actions (activate/deactivate/configure/enqueueTask/startNegotiation/delegate) → `/api/kernel/agents` with documented body shapes; on success they toast (sonner) + refetch.
- framer-motion: `opacity+y` staggered entrances; `layoutId` sliding indicators on team filter + detail tabs; `AnimatePresence` on detail panel + expandable sections + delegation modal.
- recharts: `ResponsiveContainer`+`AreaChart`+`Area` (gradient fill via `linearGradient`) for sparkline; custom `SparkTip`.
- Color system: emerald (active/savings/done), amber (thinking/running), violet (cooperation/negotiating), cyan (learning/avg-conf), rose (failed/low-conf), zinc (idle). No indigo or blue.
- Dark-theme-native: opaque cards (bg-card/60, bg-background/40), border-border/50, ring-1 accents.
- lucide-react: 37 icons (Bot, Brain, Users, Zap, Activity, Sparkles, Network, Handshake, Send, Radio, TrendingDown, TrendingUp, Wallet, Clock, Check, X, ChevronRight, ChevronDown, Plus, Sliders, Lock, Unlock, GraduationCap, Lightbulb, Workflow, ArrowRight, BarChart3, Loader2, CircuitBoard, MessageCircle, CircleDot, ListChecks, Timer, Plug, Database).
- tabular-nums on every metric. fmtCedis/fmtNum/fmtAgo/fmtDuration/fmtTime/fmtDateShort/confidenceColor helpers at module scope.
- Accessibility: agent cards role=button + tabIndex=0 + Enter/Space; modal role=dialog aria-modal; toggle buttons aria-pressed/aria-label; close buttons aria-label.

## Verification
- `cd /home/z/my-project && bun run lint` → exit 0, NO errors, NO warnings.
- `npx tsc --noEmit -p tsconfig.json` filtered to `mobility-team` → no errors in my file.
- `tail -20 /home/z/my-project/dev.log` → `✓ Compiled in 843ms`, `GET /api/kernel/agents 200`, `GET /api/kernel/cooperations 200`, `GET /api/kernel/ai-stats 200`. Dev server healthy. (Pre-existing `prisma:error Error in PostgreSQL connection: Closed` is unrelated — documented in earlier worklog entries.)
- Verified live API responses match my types exactly via curl (`/api/kernel/agents`, `/api/kernel/ai-stats`, `/api/kernel/cooperations`).
- Did NOT run `bun run build` per instructions.
- Did NOT touch any other file (no sheet-content wiring, no API route changes, no store/types changes).

## Files modified
- `src/components/kernel/mobility-team.tsx` (CREATED — only file touched per ownership rules)

## Stage Summary
The flagship "Autonomous AI Workforce" Team tab is now a real-time observability surface for Oryx's multi-agent runtime. The team overview banner shows the 4 teams with live agent counts + savings + learned totals. The agent grid renders 25 agent cards with pulsing status dots, sparklines of the last 7 days of savings, full metric rows, and active toggles — all sortable and filterable by team. Clicking any card opens a slide-over Detail Panel with 4 explainability sub-tabs: a live Reasoning timeline that renders every decision's reasoning steps as a terminal/code trace (numbered, monospace, with confidence + triggered-by), a Current Tasks view with expandable input/output JSON, a Learned Optimizations view with the full optimization recipe pretty-printed, and a Configuration view with aggressiveness/risk sliders, learning/active toggles, permission-override chips, and a Delegate-task modal. The Cooperation feed streams agent-to-agent negotiations, delegations, and info shares with a "Start negotiation" form. Compact mode for the half-snap shows the top-4 agents + live cooperation feed and still opens the full Detail Panel. Lint clean, TypeScript clean, dev server healthy.
