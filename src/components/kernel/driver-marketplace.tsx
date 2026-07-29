"use client";

// ============================================================================
// Oryx — Personal Driver Marketplace (M14)
// Browse, filter, compare, and apply for subscription packages — with a
// flagship compatibility checker that scores a rider's calendar against a
// driver's subscription coverage across 5 weighted factors.
//
// Data sources (all relative, all JSON):
//   GET  /api/kernel/drivers/marketplace                 — array of packages
//   GET  /api/kernel/drivers/marketplace?zones=...&...   — filtered
//   POST /api/kernel/drivers/marketplace                 — apply |
//                                                            scoreCompatibility
//   GET  /api/kernel/drivers/applications                — all applications
// ============================================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Car,
  Crown,
  Star,
  MapPin,
  Clock,
  Repeat,
  Search,
  Sliders,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Users,
  ShieldCheck,
  Wallet,
  TrendingUp,
  ChevronRight,
  Calendar,
  ArrowRight,
  Gauge,
  Route,
  Filter,
  PartyPopper,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicationStatus = "pending" | "approved" | "rejected";

interface MarketplacePackage {
  id: string;
  driverId: string;
  name: string;
  specialty: string;
  weeklyPrice: number;
  features: string[];
  coverage: {
    days: number[];
    timeWindow: string;
    tripsPerWeek: number;
    zones: string[];
  };
  subscribers: number;
  maxSubscribers: number;
  rating: number;
  minCommitmentWeeks: number;
  driver: {
    id: string;
    name: string;
    avatar: string;
    vehicle: string;
    rating: number;
    reputation: number;
    champion: boolean;
    zones: string[];
  };
}

interface CompatibilityFactor {
  factor: string;
  score: number;
  detail: string;
}

interface CompatibilityResult {
  score: number;
  factors: CompatibilityFactor[];
}

interface DriverApplication {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string;
  packageId: string;
  status: ApplicationStatus;
  compatibilityScore: number;
  compatibilityFactors: CompatibilityFactor[];
  appliedAt: number;
  reviewedAt?: number;
  notes?: string;
}

interface RiderCalendar {
  days: number[];
  time: string;
  origin: string;
  destination: string;
}

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const POLL_MS = 10000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const ALL_ZONES = [
  "East Legon",
  "Airport",
  "Octagon",
  "Osu",
  "Labadi",
  "Spintex",
  "Tema",
  "Madina",
  "Circle",
  "Cantonments",
  "Ridge",
  "AIS Legon",
];

const RIDER_ID = "rider-self";
const RIDER_NAME = "You";

const APP_STATUS_META: Record<
  ApplicationStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    dot: "bg-amber-400 animate-pulse",
  },
  approved: {
    label: "Approved",
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    text: "text-rose-300",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
};

function fmtCedis(n: number): string {
  if (!n || n === 0) return "GH₵0";
  if (n < 100) return `GH₵${n.toFixed(2)}`;
  return `GH₵${Math.round(n).toLocaleString()}`;
}

function fmtCedisExact(n: number): string {
  if (!n || n === 0) return "GH₵0";
  return `GH₵${n.toFixed(2)}`;
}

function fmtAgoTs(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(ts).getTime() : ts;
  if (!d) return "—";
  const diff = Date.now() - d;
  if (diff < 0) return "upcoming";
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function fmtDays(days: number[]): string {
  if (days.length === 7) return "Daily";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Mon–Fri";
  if (days.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => days.includes(d))) return "Mon–Sat";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
  return days.map((d) => DAY_LABELS[d]).join(", ");
}

function scoreColor(s: number): { text: string; bg: string; border: string; stroke: string; fill: string } {
  if (s >= 80)
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      stroke: "stroke-emerald-400",
      fill: "fill-emerald-400",
    };
  if (s >= 60)
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      stroke: "stroke-amber-400",
      fill: "fill-amber-400",
    };
  return {
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    stroke: "stroke-rose-400",
    fill: "fill-rose-400",
  };
}

function scoreLabel(s: number): string {
  if (s >= 90) return "Excellent match";
  if (s >= 80) return "Strong match";
  if (s >= 60) return "Partial match";
  if (s >= 40) return "Weak match";
  return "Poor match";
}

function factorIcon(factor: string): typeof Car {
  switch (factor.toLowerCase()) {
    case "schedule overlap":
      return Calendar;
    case "time window":
      return Clock;
    case "route coverage":
      return Route;
    case "driver reputation":
      return ShieldCheck;
    case "availability":
      return Users;
    default:
      return Sparkles;
  }
}

// ---------------------------------------------------------------------------
// Sub-components (hoisted to module scope)
// ---------------------------------------------------------------------------

// ----- Circular gauge (large) ----------------------------------------------

function ScoreGauge({
  value,
  size = 120,
  stroke = 10,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  const sc = scoreColor(value);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-border/40"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={sc.stroke}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className={`text-3xl font-black tabular-nums leading-none ${sc.text}`}
        >
          {value}
        </motion.span>
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

// ----- Star rating ---------------------------------------------------------

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i - 0.25;
        const half = !filled && rating >= i - 0.75;
        return (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={
              filled
                ? "fill-amber-400 text-amber-400"
                : half
                ? "fill-amber-400/50 text-amber-400"
                : "fill-transparent text-zinc-600"
            }
          />
        );
      })}
    </div>
  );
}

// ----- Empty state ---------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  sub,
  accent = "text-muted-foreground",
}: {
  icon: typeof Car;
  title: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/40 bg-card/30 p-8 text-center">
      <Icon className={`h-6 w-6 ${accent}`} />
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {sub && <div className="max-w-xs text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ----- Filter bar ----------------------------------------------------------

function FilterBar({
  search,
  setSearch,
  zones,
  setZones,
  minRating,
  setMinRating,
  maxPrice,
  setMaxPrice,
  totalCount,
  resultCount,
}: {
  search: string;
  setSearch: (s: string) => void;
  zones: string[];
  setZones: (z: string[]) => void;
  minRating: number;
  setMinRating: (n: number) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  totalCount: number;
  resultCount: number;
}) {
  const toggleZone = (z: string) => {
    setZones(zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z]);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3"
    >
      {/* Search + rating + result count */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search specialty (school, airport, corporate...)"
            className="w-full rounded-lg border border-border/50 bg-background/40 py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
          />
        </div>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-xs font-semibold text-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        >
          <option value={0}>Any rating</option>
          <option value={4.5}>4.5+</option>
          <option value={4.7}>4.7+</option>
          <option value={4.8}>4.8+</option>
          <option value={4.9}>4.9+</option>
        </select>
      </div>

      {/* Zone chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" /> Zones
        </span>
        {ALL_ZONES.map((z) => {
          const active = zones.includes(z);
          return (
            <button
              key={z}
              type="button"
              onClick={() => toggleZone(z)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition ${
                active
                  ? "border-violet-500/30 bg-violet-500/15 text-violet-300"
                  : "border-border/50 bg-background/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && <CheckCircle2 className="h-2.5 w-2.5" />}
              {z}
            </button>
          );
        })}
      </div>

      {/* Price slider */}
      <div className="mt-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <Sliders className="h-2.5 w-2.5" /> Max weekly price
          </span>
          <span className="text-xs font-black tabular-nums text-emerald-400">
            {maxPrice >= 500 ? "Any" : fmtCedis(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "oklch(0.66 0.18 162)" }}
        />
        <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
          <span>GH₵50</span>
          <span>GH₵500+</span>
        </div>
      </div>

      {/* Result count */}
      <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Filter className="h-2.5 w-2.5" />
          <span className="font-bold tabular-nums text-foreground">{resultCount}</span> of{" "}
          <span className="tabular-nums">{totalCount}</span> packages
        </span>
        {(zones.length > 0 || search || minRating > 0 || maxPrice < 500) && (
          <button
            onClick={() => {
              setSearch("");
              setZones([]);
              setMinRating(0);
              setMaxPrice(500);
            }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 hover:underline"
          >
            <X className="h-2.5 w-2.5" /> Clear filters
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ----- Package card --------------------------------------------------------

function PackageCard({
  pkg,
  onView,
  onCheck,
}: {
  pkg: MarketplacePackage;
  onView: () => void;
  onCheck: () => void;
}) {
  const fillPct = Math.round((pkg.subscribers / pkg.maxSubscribers) * 100);
  const slotsOpen = pkg.maxSubscribers - pkg.subscribers;
  const lowCapacity = slotsOpen <= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-3 ring-1 ring-transparent transition hover:border-border hover:ring-1 hover:ring-foreground/10"
    >
      {/* Top: driver + price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-xs font-black text-violet-200 ring-1 ring-violet-500/30">
              {pkg.driver.avatar}
            </div>
            {pkg.driver.champion && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/95 ring-2 ring-card">
                <Crown className="h-2.5 w-2.5 text-amber-950" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-foreground">{pkg.driver.name}</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Car className="h-2.5 w-2.5" />
              <span className="truncate">{pkg.driver.vehicle}</span>
              <span className="text-zinc-600">·</span>
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums text-foreground/80">{pkg.driver.rating}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black tabular-nums text-emerald-400">
            {fmtCedis(pkg.weeklyPrice)}
          </div>
          <div className="text-[9px] font-semibold uppercase text-muted-foreground">per week</div>
        </div>
      </div>

      {/* Package name + specialty */}
      <div className="mt-2.5">
        <div className="flex items-center gap-1.5">
          <Repeat className="h-3 w-3 text-violet-400" />
          <span className="truncate text-sm font-bold text-foreground">{pkg.name}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{pkg.specialty}</p>
      </div>

      {/* Features */}
      <div className="mt-2 flex flex-wrap gap-1">
        {pkg.features.slice(0, 3).map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-foreground/80"
          >
            <CheckCircle2 className="h-2 w-2 text-emerald-400" />
            {f}
          </span>
        ))}
        {pkg.features.length > 3 && (
          <span className="inline-flex items-center rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
            +{pkg.features.length - 3}
          </span>
        )}
      </div>

      {/* Coverage */}
      <div className="mt-2.5 space-y-1 rounded-lg border border-border/40 bg-background/30 p-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="h-2.5 w-2.5 text-cyan-400" />
          <span className="font-semibold text-foreground/80">{fmtDays(pkg.coverage.days)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5 text-amber-400" />
          <span className="font-semibold text-foreground/80">{pkg.coverage.timeWindow}:00</span>
          <span className="text-zinc-600">·</span>
          <span className="tabular-nums">{pkg.coverage.tripsPerWeek} trips/wk</span>
        </div>
        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="mt-0.5 h-2.5 w-2.5 text-rose-400" />
          <span className="font-semibold text-foreground/80">{pkg.coverage.zones.join(", ")}</span>
        </div>
      </div>

      {/* Capacity + rating */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">Slots</span>
            <span
              className={`font-black tabular-nums ${
                lowCapacity ? "text-rose-400" : "text-foreground"
              }`}
            >
              {pkg.subscribers}/{pkg.maxSubscribers}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                lowCapacity ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5">
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-black tabular-nums text-amber-300">{pkg.rating}</span>
        </div>
      </div>

      {/* Commitment */}
      <div className="mt-2 text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">Min commitment:</span>{" "}
        <span className="font-bold text-foreground">{pkg.minCommitmentWeeks} week{pkg.minCommitmentWeeks === 1 ? "" : "s"}</span>
      </div>

      {/* Actions */}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <button
          onClick={onView}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground/[0.06]"
        >
          <Search className="h-3 w-3" /> Details
        </button>
        <button
          onClick={onCheck}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/25"
        >
          <Sparkles className="h-3 w-3" /> Match
        </button>
      </div>
    </motion.div>
  );
}

// ----- Package detail panel ------------------------------------------------

function PackageDetailPanel({
  pkg,
  onClose,
  onApply,
  onCheck,
  applying,
}: {
  pkg: MarketplacePackage;
  onClose: () => void;
  onApply: (calendar: RiderCalendar) => void;
  onCheck: () => void;
  applying: boolean;
}) {
  // Initial state seeded from the package coverage. Parent remounts via
  // `key={pkg.id}` so we don't need a resync effect.
  const [calendar, setCalendar] = useState<RiderCalendar>({
    days: pkg.coverage.days.slice(0, 5),
    time: `${pkg.coverage.timeWindow.split("-")[0].padStart(2, "0")}:00`,
    origin: pkg.coverage.zones[0] || "",
    destination: pkg.coverage.zones[1] || pkg.coverage.zones[0] || "",
  });

  const toggleDay = (d: number) => {
    setCalendar((c) => ({
      ...c,
      days: c.days.includes(d) ? c.days.filter((x) => x !== d) : [...c.days, d].sort(),
    }));
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm md:inset-y-0 md:left-auto md:right-0 md:w-[480px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${pkg.name} details`}
    >
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden border-l border-border/60 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border/50 bg-card/60 p-3.5">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-black text-violet-200 ring-1 ring-violet-500/30">
              {pkg.driver.avatar}
            </div>
            {pkg.driver.champion && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/95 ring-2 ring-background">
                <Crown className="h-2.5 w-2.5 text-amber-950" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-black text-foreground">{pkg.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{pkg.specialty}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Car className="h-2.5 w-2.5" />
                {pkg.driver.name}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums text-foreground/80">{pkg.driver.rating}</span>
              </span>
              <span className="inline-flex items-center gap-0.5">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
                <span className="tabular-nums text-foreground/80">{pkg.driver.reputation}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3.5">
          {/* Price + capacity */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <DetailStat
              label="Weekly"
              value={fmtCedis(pkg.weeklyPrice)}
              color="text-emerald-400"
              icon={Wallet}
            />
            <DetailStat
              label="Open slots"
              value={`${pkg.maxSubscribers - pkg.subscribers}`}
              color={pkg.maxSubscribers - pkg.subscribers <= 3 ? "text-rose-400" : "text-amber-400"}
              icon={Users}
            />
            <DetailStat
              label="Commitment"
              value={`${pkg.minCommitmentWeeks}w`}
              color="text-violet-400"
              icon={Calendar}
            />
          </div>

          {/* Coverage */}
          <Section title="Coverage" icon={MapPin} color="text-rose-400">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3 text-cyan-400" />
                <span className="font-semibold text-foreground/80">{fmtDays(pkg.coverage.days)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="font-semibold text-foreground/80">
                  {pkg.coverage.timeWindow}:00 window
                </span>
                <span className="text-zinc-600">·</span>
                <span className="tabular-nums">{pkg.coverage.tripsPerWeek} trips/week</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="mt-0.5 h-3 w-3 text-rose-400" />
                <span className="font-semibold text-foreground/80">
                  {pkg.coverage.zones.join(", ")}
                </span>
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section title="Features" icon={CheckCircle2} color="text-emerald-400">
            <div className="flex flex-wrap gap-1.5">
              {pkg.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-1 text-[10px] font-semibold text-foreground/80"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  {f}
                </span>
              ))}
            </div>
          </Section>

          {/* Driver profile */}
          <Section title="Driver profile" icon={ShieldCheck} color="text-violet-400">
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                <DetailStat
                  label="Rating"
                  value={pkg.driver.rating.toFixed(1)}
                  color="text-amber-400"
                  icon={Star}
                />
                <DetailStat
                  label="Reputation"
                  value={String(pkg.driver.reputation)}
                  color="text-emerald-400"
                  icon={ShieldCheck}
                />
                <DetailStat
                  label="Champion"
                  value={pkg.driver.champion ? "Yes" : "No"}
                  color={pkg.driver.champion ? "text-amber-400" : "text-muted-foreground"}
                  icon={Crown}
                />
              </div>
              <div className="rounded-lg border border-border/40 bg-background/30 p-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Vehicle
                </div>
                <div className="text-sm font-bold text-foreground">{pkg.driver.vehicle}</div>
                <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Coverage zones
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {pkg.driver.zones.map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-foreground/80"
                    >
                      <MapPin className="h-2 w-2" />
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Rider calendar preview */}
          <Section title="Your commute (preview)" icon={Calendar} color="text-cyan-400">
            <div className="space-y-2">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Commute days
                </div>
                <div className="flex items-center justify-between gap-1">
                  {DAY_SHORT.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      aria-pressed={calendar.days.includes(i)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition ${
                        calendar.days.includes(i)
                          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                          : "bg-background/40 text-muted-foreground ring-1 ring-border/40"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Pickup time
                  </div>
                  <input
                    type="time"
                    value={calendar.time}
                    onChange={(e) => setCalendar({ ...calendar, time: e.target.value })}
                    className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Origin
                  </div>
                  <select
                    value={calendar.origin}
                    onChange={(e) => setCalendar({ ...calendar, origin: e.target.value })}
                    className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  >
                    {ALL_ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Destination
                </div>
                <select
                  value={calendar.destination}
                  onChange={(e) => setCalendar({ ...calendar, destination: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  {ALL_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
        </div>

        {/* Sticky bottom */}
        <div className="border-t border-border/50 bg-card/60 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCheck}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-sm font-black uppercase tracking-wide text-amber-300 transition hover:bg-amber-500/25"
            >
              <Sparkles className="h-4 w-4" /> Check match
            </button>
            <button
              onClick={() => onApply(calendar)}
              disabled={applying}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-black uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Apply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailStat({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: typeof Car;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/30 p-2 text-center">
      <Icon className={`mx-auto h-3 w-3 ${color}`} />
      <div className={`mt-0.5 text-[12px] font-black tabular-nums leading-none ${color}`}>{value}</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: typeof Car;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-border/40 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ----- Compatibility checker (FLAGSHIP) ------------------------------------

function CompatibilityChecker({
  pkg,
  onClose,
  onApply,
  scoring,
  applying,
  initialCalendar,
}: {
  pkg: MarketplacePackage;
  onClose: () => void;
  onApply: (calendar: RiderCalendar) => void;
  scoring: boolean;
  applying: boolean;
  initialCalendar: RiderCalendar;
}) {
  // Initial state seeded from the package coverage. Parent remounts via
  // `key={pkg.id}` whenever the selected package changes.
  const [calendar, setCalendar] = useState<RiderCalendar>(initialCalendar);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [checking, setChecking] = useState(false);

  const toggleDay = (d: number) => {
    setCalendar((c) => ({
      ...c,
      days: c.days.includes(d) ? c.days.filter((x) => x !== d) : [...c.days, d].sort(),
    }));
  };

  const handleCheck = useCallback(async () => {
    if (calendar.days.length === 0) {
      toast.error("Select at least one commute day");
      return;
    }
    if (!calendar.origin || !calendar.destination) {
      toast.error("Origin and destination are required");
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/kernel/drivers/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scoreCompatibility",
          driverId: pkg.driverId,
          packageId: pkg.id,
          riderCalendar: calendar,
        }),
      });
      if (!res.ok) {
        toast.error("Could not compute compatibility");
        return;
      }
      const data = (await res.json()) as CompatibilityResult;
      setResult(data);
      toast.success(`${scoreLabel(data.score)} · ${data.score}/100`);
    } finally {
      setChecking(false);
    }
  }, [calendar, pkg.driverId, pkg.id]);

  // Auto-run the compatibility scoring once on mount. The parent remounts
  // this component via `key={pkg.id}`, so this fires per package selection.
  // We intentionally run only on mount — `handleCheck` reads the latest
  // state via its closure, and re-running on every state change would loop.
  useEffect(() => {
    if (!result && !checking) {
      handleCheck();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Compatibility checker"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-background shadow-2xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-2 border-b border-border/50 bg-gradient-to-r from-violet-500/[0.12] via-card/60 to-card/60 p-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-foreground">Compatibility checker</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {pkg.name} · {pkg.driver.name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3.5">
          {/* Form */}
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your commute days
              </div>
              <div className="flex items-center justify-between gap-1">
                {DAY_SHORT.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={calendar.days.includes(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold transition ${
                      calendar.days.includes(i)
                        ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                        : "bg-background/40 text-muted-foreground ring-1 ring-border/40"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Time
                </div>
                <input
                  type="time"
                  value={calendar.time}
                  onChange={(e) => setCalendar({ ...calendar, time: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/40 px-1.5 py-1.5 text-xs tabular-nums text-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Origin
                </div>
                <select
                  value={calendar.origin}
                  onChange={(e) => setCalendar({ ...calendar, origin: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/40 px-1.5 py-1.5 text-xs text-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                >
                  {ALL_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Destination
                </div>
                <select
                  value={calendar.destination}
                  onChange={(e) => setCalendar({ ...calendar, destination: e.target.value })}
                  className="w-full rounded-lg border border-border/50 bg-background/40 px-1.5 py-1.5 text-xs text-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                >
                  {ALL_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCheck}
              disabled={checking || scoring}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/20 px-3 py-2 text-sm font-black uppercase tracking-wide text-violet-200 transition hover:bg-violet-500/30 disabled:opacity-50"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {checking ? "Scoring..." : "Check compatibility"}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3.5"
              >
                {/* Overall score gauge */}
                <div
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 ${
                    scoreColor(result.score).bg
                  } ${scoreColor(result.score).border}`}
                >
                  <ScoreGauge value={result.score} size={120} stroke={10} />
                  <div className="text-center">
                    <div className={`text-sm font-black ${scoreColor(result.score).text}`}>
                      {scoreLabel(result.score)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Based on 5 weighted factors
                    </div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Gauge className="h-3 w-3" /> Factor breakdown
                  </div>
                  {result.factors.map((f, i) => {
                    const sc = scoreColor(f.score);
                    const Ic = factorIcon(f.factor);
                    return (
                      <motion.div
                        key={f.factor}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border border-border/40 bg-card/40 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${sc.bg}`}>
                              <Ic className={`h-3 w-3 ${sc.text}`} />
                            </div>
                            <span className="truncate text-xs font-bold text-foreground">
                              {f.factor}
                            </span>
                          </div>
                          <span className={`text-sm font-black tabular-nums ${sc.text}`}>
                            {f.score}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.score}%` }}
                            transition={{ delay: 0.15 + i * 0.08, duration: 0.7 }}
                            className={`h-full rounded-full ${
                              f.score >= 80
                                ? "bg-emerald-500"
                                : f.score >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                          {f.detail}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Apply CTA */}
                <button
                  onClick={() => onApply(calendar)}
                  disabled={applying}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2.5 text-sm font-black uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {applying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {applying ? "Submitting..." : `Apply with ${result.score}/100 score`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----- Application confirmation modal --------------------------------------

function ApplicationConfirmation({
  application,
  pkg,
  onClose,
}: {
  application: DriverApplication;
  pkg: MarketplacePackage | null;
  onClose: () => void;
}) {
  const sc = scoreColor(application.compatibilityScore);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Application submitted"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-500/30 bg-background shadow-2xl"
      >
        <div className="flex flex-col items-center p-5 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30"
          >
            <PartyPopper className="h-6 w-6 text-emerald-400" />
          </motion.div>
          <h3 className="mt-3 text-base font-black text-foreground">Application submitted!</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Your subscription request has been sent to{" "}
            <span className="font-bold text-foreground">
              {pkg?.driver.name ?? "the driver"}
            </span>{" "}
            for review.
          </p>

          {/* Score badge */}
          <div className={`mt-3 flex items-center gap-2 rounded-xl border ${sc.border} ${sc.bg} px-3 py-2`}>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Compatibility
              </div>
              <div className={`text-2xl font-black tabular-nums leading-none ${sc.text}`}>
                {application.compatibilityScore}/100
              </div>
            </div>
            <div className="h-8 w-px bg-border/40" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${APP_STATUS_META[application.status].bg} ${APP_STATUS_META[application.status].border} ${APP_STATUS_META[application.status].text}`}
              >
                <span className={`h-1 w-1 rounded-full ${APP_STATUS_META[application.status].dot}`} />
                {APP_STATUS_META[application.status].label}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-border/60 bg-foreground/[0.06] px-3 py-2 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground/[0.1]"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----- Applications tracker (rider-side) -----------------------------------

function ApplicationsTracker({
  applications,
  packages,
}: {
  applications: DriverApplication[];
  packages: MarketplacePackage[];
}) {
  if (applications.length === 0) return null;
  const sorted = [...applications].sort((a, b) => b.appliedAt - a.appliedAt);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.05] p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-black text-foreground">Your applications</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {applications.length} submitted
        </span>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-y-auto scroll-thin pr-1">
        {sorted.map((app) => {
          const sc = scoreColor(app.compatibilityScore);
          const st = APP_STATUS_META[app.status];
          const pkg = packages.find((p) => p.id === app.packageId);
          return (
            <div key={app.id} className="rounded-xl border border-border/40 bg-card/40 p-2.5">
              <div className="flex items-start gap-2.5">
                {pkg ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-[10px] font-black text-violet-300 ring-1 ring-violet-500/30">
                    {pkg.driver.avatar}
                  </div>
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-bold text-foreground">
                      {pkg?.name ?? app.packageId}
                    </span>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${st.bg} ${st.border} ${st.text}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="truncate">{pkg?.driver.name ?? app.driverId}</span>
                    <span className="text-zinc-600">·</span>
                    <span>{fmtAgoTs(app.appliedAt)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${app.compatibilityScore}%` }}
                          transition={{ duration: 0.7 }}
                          className={`h-full rounded-full ${
                            app.compatibilityScore >= 80
                              ? "bg-emerald-500"
                              : app.compatibilityScore >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                      </div>
                    </div>
                    <span className={`text-[11px] font-black tabular-nums ${sc.text}`}>
                      {app.compatibilityScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DriverMarketplace() {
  const [packages, setPackages] = useState<MarketplacePackage[]>([]);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);

  // detail + compatibility + confirmation
  const [detailPkg, setDetailPkg] = useState<MarketplacePackage | null>(null);
  const [compatPkg, setCompatPkg] = useState<MarketplacePackage | null>(null);
  const [confirmation, setConfirmation] = useState<{
    app: DriverApplication;
    pkg: MarketplacePackage | null;
  } | null>(null);

  // ---- fetchers ----------------------------------------------------------
  const fetchPackages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (zones.length > 0) params.set("zones", zones.join(","));
      if (search.trim()) params.set("specialty", search.trim());
      if (minRating > 0) params.set("minRating", String(minRating));
      if (maxPrice < 500) params.set("maxPrice", String(maxPrice));
      const qs = params.toString();
      const url = `/api/kernel/drivers/marketplace${qs ? `?${qs}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as MarketplacePackage[];
      setPackages(data);
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [zones, search, minRating, maxPrice]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch(`/api/kernel/drivers/applications`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as DriverApplication[];
      // filter to "this rider"
      setApplications(data.filter((a) => a.riderId === RIDER_ID));
    } catch {
      /* swallow */
    }
  }, []);

  // ---- initial + on-filter-change ----------------------------------------
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // periodic refresh of applications
  useEffect(() => {
    const id = setInterval(fetchApplications, POLL_MS);
    return () => clearInterval(id);
  }, [fetchApplications]);

  // ---- actions -----------------------------------------------------------
  const handleApply = useCallback(
    async (pkg: MarketplacePackage, calendar: RiderCalendar) => {
      setBusy(true);
      try {
        const res = await fetch("/api/kernel/drivers/marketplace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "apply",
            riderId: RIDER_ID,
            riderName: RIDER_NAME,
            driverId: pkg.driverId,
            packageId: pkg.id,
            riderCalendar: calendar,
            notes: "Submitted from marketplace.",
          }),
        });
        if (!res.ok) {
          toast.error("Could not submit application");
          return;
        }
        const app = (await res.json()) as DriverApplication;
        toast.success(`Application submitted · ${app.compatibilityScore}/100 match`);
        setConfirmation({ app, pkg });
        setDetailPkg(null);
        setCompatPkg(null);
        await fetchApplications();
      } finally {
        setBusy(false);
      }
    },
    [fetchApplications]
  );

  // ---- derived -----------------------------------------------------------
  const totalPackages = useMemo(() => packages.length, [packages]);

  // ---- render ------------------------------------------------------------
  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
            <Repeat className="h-3 w-3" /> Personal Driver Marketplace
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-foreground text-balance sm:text-xl">
            Subscribe to a driver who runs your week — scored against your calendar.
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Browse subscription packages, check 5-factor compatibility, and apply with one tap.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 sm:flex"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-2 w-2 rounded-full bg-emerald-400"
          />
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            {totalPackages} packages
          </div>
        </motion.div>
      </div>

      {/* Applications tracker (top if any) */}
      {applications.length > 0 && (
        <div className="mb-3">
          <ApplicationsTracker applications={applications} packages={packages} />
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-3">
        <FilterBar
          search={search}
          setSearch={setSearch}
          zones={zones}
          setZones={setZones}
          minRating={minRating}
          setMinRating={setMinRating}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          totalCount={totalPackages}
          resultCount={packages.length}
        />
      </div>

      {/* Grid */}
      {loading && packages.length === 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border/40 bg-card/40" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No packages match your filters"
          sub="Try widening your search — clear filters or expand zones."
          accent="text-violet-400"
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {packages.map((p) => (
              <PackageCard
                key={p.id}
                pkg={p}
                onView={() => setDetailPkg(p)}
                onCheck={() => setCompatPkg(p)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {detailPkg && (
          <PackageDetailPanel
            key={detailPkg.id}
            pkg={detailPkg}
            onClose={() => setDetailPkg(null)}
            onApply={(cal) => handleApply(detailPkg, cal)}
            onCheck={() => {
              setCompatPkg(detailPkg);
            }}
            applying={busy}
          />
        )}
      </AnimatePresence>

      {/* Compatibility checker */}
      <AnimatePresence>
        {compatPkg && (
          <CompatibilityChecker
            key={compatPkg.id}
            pkg={compatPkg}
            onClose={() => setCompatPkg(null)}
            onApply={(cal) => handleApply(compatPkg, cal)}
            scoring={false}
            applying={busy}
            initialCalendar={{
              days: compatPkg.coverage.days.slice(0, 5),
              time: `${compatPkg.coverage.timeWindow.split("-")[0].padStart(2, "0")}:00`,
              origin: compatPkg.coverage.zones[0] || "",
              destination: compatPkg.coverage.zones[1] || compatPkg.coverage.zones[0] || "",
            }}
          />
        )}
      </AnimatePresence>

      {/* Application confirmation */}
      <AnimatePresence>
        {confirmation && (
          <ApplicationConfirmation
            application={confirmation.app}
            pkg={confirmation.pkg}
            onClose={() => setConfirmation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default DriverMarketplace;
