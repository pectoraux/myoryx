"use client";

// ============================================================================
// Oryx — Driver Operating System UI (M14–M15)
// The "Driver" tab: driver profiles, AI-built daily schedule, coverage map,
// ride history, reviews, preferences editor, and return ride broadcasting.
//
// Data sources (all relative, all JSON):
//   GET  /api/kernel/drivers                         — array of profiles (lite)
//   GET  /api/kernel/drivers?id=dos-1                — full profile
//   POST /api/kernel/drivers                         — updatePreferences |
//                                                       addReview |
//                                                       broadcastReturn
//   GET  /api/kernel/drivers/schedule?driverId=...   — AI-built DriverSchedule
//   GET  /api/kernel/drivers/applications?driverId=... — DriverApplication[]
//   POST /api/kernel/drivers/applications            — approve/reject
// ============================================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Car,
  Crown,
  Trophy,
  Gauge,
  Clock,
  Target,
  Calendar,
  MapPin,
  Route,
  Star,
  Users,
  Package,
  Plane,
  Building2,
  GraduationCap,
  Coffee,
  Repeat,
  ChevronRight,
  RefreshCw,
  Save,
  Radio,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet,
  Settings2,
  History,
  Map,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrored from src/lib/kernel/types.ts — the API returns these shapes)
// ---------------------------------------------------------------------------

type DriverStatus = "available" | "busy" | "offline";
type RideType = "ride" | "pool" | "parcel" | "subscription" | "return";
type RideStatus = "completed" | "cancelled";
type StopType = "ride" | "pool" | "parcel" | "subscription" | "return" | "break";
type ApplicationStatus = "pending" | "approved" | "rejected";
type DashTab = "overview" | "schedule" | "history" | "settings";

interface CoverageArea {
  zone: string;
  lat: number;
  lng: number;
  radiusKm: number;
  demand: "low" | "medium" | "high";
  avgFare: number;
}

interface DriverStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  acceptanceRate: number;
  totalEarnings: number;
  avgEarningsPerRide: number;
  avgRating: number;
  totalKm: number;
  emptyKm: number;
  utilizationPct: number;
  hoursWorkedThisWeek: number;
  ridesThisWeek: number;
  earningsThisWeek: number;
}

interface RideHistoryEntry {
  id: string;
  date: string;
  rider: string;
  origin: string;
  destination: string;
  fare: number;
  durationMin: number;
  distanceKm: number;
  rating: number;
  type: RideType;
  status: RideStatus;
}

interface DriverReview {
  id: string;
  riderName: string;
  riderAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
}

interface DriverOSProfile {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  vehicle: string;
  vehicleType: string;
  rating: number;
  reputation: number;
  coverageZones: string[];
  coverageMap: CoverageArea[];
  stats: DriverStats;
  rideHistory: RideHistoryEntry[];
  reviews: DriverReview[];
  weeklyGoal: number;
  monthlyGoal: number;
  weeklyProgress: number;
  preferredNeighborhoods: string[];
  workingHours: { start: string; end: string; days: number[] };
  preferredRideTypes: string[];
  preferredVehicle: string;
  maxWorkingHoursPerDay: number;
  calendarSync: boolean;
  minPreNoticeHours: number;
  champion: boolean;
  savingsGenerated: number;
  pooledTrips: number;
  punctuality: number;
  efficiency: number;
  status: DriverStatus;
  createdAt: number;
  subscriptionPackages: Array<{ id: string; name: string }>;
}

interface ScheduleStop {
  id: string;
  time: string;
  type: StopType;
  title: string;
  origin: string;
  destination: string;
  fare: number;
  durationMin: number;
  chainsToNext: boolean | string;
  riderName?: string;
}

interface DriverSchedule {
  id: string;
  driverId: string;
  date: string;
  stops: ScheduleStop[];
  projectedEarnings: number;
  projectedHours: number;
  utilizationPct: number;
  emptyMilesPct: number;
  aiOptimized: boolean;
}

interface DriverApplication {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string;
  packageId: string;
  status: ApplicationStatus;
  compatibilityScore: number;
  compatibilityFactors: Array<{ factor: string; score: number; detail: string }>;
  appliedAt: number;
  reviewedAt?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

const POLL_MS = 8000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const ALL_NEIGHBORHOODS = [
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
  "Accra Mall",
];
const RIDE_TYPE_OPTIONS: Array<{ id: string; label: string; icon: typeof Car; color: string }> = [
  { id: "ride", label: "Ride", icon: Car, color: "text-emerald-400" },
  { id: "pool", label: "Pool", icon: Users, color: "text-cyan-400" },
  { id: "parcel", label: "Parcel", icon: Package, color: "text-orange-400" },
  { id: "subscription", label: "Subscription", icon: Repeat, color: "text-violet-400" },
  { id: "return", label: "Return", icon: ArrowRight, color: "text-amber-400" },
];

const STOP_META: Record<
  StopType,
  { icon: typeof Car; label: string; color: string; bg: string; border: string }
> = {
  ride: { icon: Car, label: "Ride", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  pool: { icon: Users, label: "Pool", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  parcel: { icon: Package, label: "Parcel", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  subscription: { icon: Repeat, label: "Subscription", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30" },
  return: { icon: ArrowRight, label: "Return", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  break: { icon: Coffee, label: "Break", color: "text-zinc-300", bg: "bg-zinc-500/15", border: "border-zinc-500/30" },
};

const RIDE_TYPE_META: Record<
  RideType,
  { icon: typeof Car; label: string; color: string; bg: string }
> = {
  ride: { icon: Car, label: "Ride", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  pool: { icon: Users, label: "Pool", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  parcel: { icon: Package, label: "Parcel", color: "text-orange-400", bg: "bg-orange-500/15" },
  subscription: { icon: Repeat, label: "Subscription", color: "text-violet-400", bg: "bg-violet-500/15" },
  return: { icon: ArrowRight, label: "Return", color: "text-amber-400", bg: "bg-amber-500/15" },
};

const STATUS_META: Record<DriverStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  available: { label: "Available", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  busy: { label: "Busy", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  offline: { label: "Offline", dot: "bg-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/15", border: "border-zinc-500/30" },
};

const DEMAND_META: Record<CoverageArea["demand"], { label: string; text: string; bg: string; border: string }> = {
  high: { label: "High demand", text: "text-rose-300", bg: "bg-rose-500/15", border: "border-rose-500/30" },
  medium: { label: "Medium demand", text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "Low demand", text: "text-zinc-300", bg: "bg-zinc-500/15", border: "border-zinc-500/30" },
};

const APP_STATUS_META: Record<ApplicationStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  pending: { label: "Pending", text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
  approved: { label: "Approved", text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  rejected: { label: "Rejected", text: "text-rose-300", bg: "bg-rose-500/15", border: "border-rose-500/30", dot: "bg-rose-400" },
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

function fmtNum(n: number): string {
  return n.toLocaleString();
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

function fmtDate(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtDays(days: number[]): string {
  if (days.length === 7) return "Daily";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Mon–Fri";
  if (days.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => days.includes(d))) return "Mon–Sat";
  return days.map((d) => DAY_LABELS[d]).join(", ");
}

function reputationColor(r: number): string {
  if (r >= 90) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  if (r >= 75) return "text-amber-400 bg-amber-500/15 border-amber-500/30";
  if (r >= 60) return "text-orange-400 bg-orange-500/15 border-orange-500/30";
  return "text-rose-400 bg-rose-500/15 border-rose-500/30";
}

function scoreColor(s: number): { text: string; bg: string; border: string; stroke: string } {
  if (s >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", stroke: "stroke-emerald-400" };
  if (s >= 60) return { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", stroke: "stroke-amber-400" };
  return { text: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30", stroke: "stroke-rose-400" };
}

// ---------------------------------------------------------------------------
// Sub-components (hoisted to module scope for react-hooks/static-components)
// ---------------------------------------------------------------------------

// ----- Shared bits ---------------------------------------------------------

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

function CircularProgress({
  value,
  size = 64,
  stroke = 6,
  color = "stroke-emerald-400",
  trackColor = "stroke-border/60",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className={trackColor} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

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

// ----- Driver selector -----------------------------------------------------

function DriverSelector({
  drivers,
  selected,
  onSelect,
}: {
  drivers: DriverOSProfile[];
  selected: DriverOSProfile | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = selected;
  const st = cur ? STATUS_META[cur.status] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-2.5 text-left transition hover:border-border hover:bg-card/80"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {cur && (
          <>
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-black text-violet-300 ring-1 ring-violet-500/30">
                {cur.avatar}
              </div>
              {cur.champion && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/90 ring-2 ring-background">
                  <Crown className="h-2.5 w-2.5 text-amber-950" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-foreground">{cur.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="truncate">{cur.vehicle}</span>
                <span className="text-zinc-600">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums text-foreground/80">{cur.rating}</span>
                </span>
              </div>
            </div>
            {st && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${st.bg} ${st.border} ${st.text}`}
              >
                <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            )}
          </>
        )}
        <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close driver menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-2xl border border-border/60 bg-popover/95 shadow-2xl backdrop-blur"
              role="listbox"
            >
              {drivers.map((d) => {
                const s = STATUS_META[d.status];
                const isActive = d.id === selected?.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      onSelect(d.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 p-2.5 text-left transition hover:bg-foreground/[0.05] ${
                      isActive ? "bg-foreground/[0.04]" : ""
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-xs font-black text-violet-300 ring-1 ring-violet-500/30">
                        {d.avatar}
                      </div>
                      {d.champion && (
                        <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/90 ring-2 ring-popover">
                          <Crown className="h-2 w-2 text-amber-950" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground">{d.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {d.vehicle} · {d.coverageZones.length} zones
                      </div>
                    </div>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- Section 1: Overview cards -------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentText,
  accentBg,
  accentBorder,
  children,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  sub?: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-2xl border ${accentBorder} ${accentBg} p-3`}
    >
      <div className="absolute -right-3 -top-3 opacity-15">
        <Icon className="h-12 w-12" />
      </div>
      <div className="relative flex items-center gap-3">
        {children}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Icon className={`h-3 w-3 ${accentText}`} />
            {label}
          </div>
          <div className={`mt-0.5 text-lg font-black tabular-nums leading-tight ${accentText}`}>
            {value}
          </div>
          {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
        </div>
      </div>
    </motion.div>
  );
}

function OverviewCards({ driver }: { driver: DriverOSProfile }) {
  const weeklyEarned = driver.stats.earningsThisWeek ?? 0;
  const weeklyGoal = driver.weeklyGoal ?? 1;
  const weeklyPct = Math.min(100, Math.round((weeklyEarned / weeklyGoal) * 100));
  const repColor = reputationColor(driver.reputation);

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <StatCard
        icon={Target}
        label="Weekly progress"
        value={`${weeklyPct}%`}
        sub={`${fmtCedis(weeklyEarned)} / ${fmtCedis(weeklyGoal)}`}
        accentText="text-emerald-400"
        accentBg="bg-emerald-500/[0.07]"
        accentBorder="border-emerald-500/30"
      >
        <CircularProgress value={weeklyPct} size={50} stroke={5} color="stroke-emerald-400">
          <span className="text-[9px] font-black tabular-nums text-emerald-400">{weeklyPct}%</span>
        </CircularProgress>
      </StatCard>

      <StatCard
        icon={ShieldCheck}
        label="Reputation"
        value={`${driver.reputation}`}
        sub={`${driver.rating}★ · ${driver.stats.completedRides} rides`}
        accentText={driver.champion ? "text-amber-400" : "text-foreground"}
        accentBg={driver.champion ? "bg-amber-500/[0.07]" : "bg-card/40"}
        accentBorder={driver.champion ? "border-amber-500/30" : "border-border/50"}
      >
        <div className="flex h-12 w-12 items-center justify-center">
          {driver.champion ? (
            <div className="flex flex-col items-center">
              <Crown className="h-5 w-5 text-amber-400" />
              <span className="mt-0.5 text-[8px] font-bold uppercase text-amber-300">Champion</span>
            </div>
          ) : (
            <CircularProgress
              value={driver.reputation}
              size={50}
              stroke={5}
              color={
                driver.reputation >= 90
                  ? "stroke-emerald-400"
                  : driver.reputation >= 75
                  ? "stroke-amber-400"
                  : "stroke-rose-400"
              }
            >
              <span className="text-[9px] font-black tabular-nums text-foreground">{driver.reputation}</span>
            </CircularProgress>
          )}
        </div>
      </StatCard>

      <StatCard
        icon={Gauge}
        label="Utilization"
        value={`${driver.efficiency}%`}
        sub={`${driver.stats.totalKm} km · ${driver.stats.emptyKm} km empty`}
        accentText="text-cyan-400"
        accentBg="bg-cyan-500/[0.07]"
        accentBorder="border-cyan-500/30"
      >
        <CircularProgress value={driver.efficiency} size={50} stroke={5} color="stroke-cyan-400">
          <span className="text-[9px] font-black tabular-nums text-cyan-400">{driver.efficiency}%</span>
        </CircularProgress>
      </StatCard>

      <StatCard
        icon={Clock}
        label="Punctuality"
        value={`${driver.punctuality}%`}
        sub={`Acceptance ${driver.stats.acceptanceRate}%`}
        accentText="text-violet-400"
        accentBg="bg-violet-500/[0.07]"
        accentBorder="border-violet-500/30"
      >
        <CircularProgress value={driver.punctuality} size={50} stroke={5} color="stroke-violet-400">
          <span className="text-[9px] font-black tabular-nums text-violet-400">{driver.punctuality}%</span>
        </CircularProgress>
      </StatCard>
    </div>
  );
}

// ----- Section 2: Earnings goals -------------------------------------------

function ProgressBar({
  pct,
  color = "bg-emerald-500",
  trackColor = "bg-border/50",
  height = "h-2",
}: {
  pct: number;
  color?: string;
  trackColor?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`relative w-full overflow-hidden rounded-full ${trackColor} ${height}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function EarningsGoals({ driver }: { driver: DriverOSProfile }) {
  const weeklyEarned = driver.stats.earningsThisWeek ?? 0;
  const weeklyGoal = driver.weeklyGoal ?? 1;
  const weeklyPct = Math.min(100, Math.round((weeklyEarned / weeklyGoal) * 100));
  const weeklyRemaining = Math.max(0, weeklyGoal - weeklyEarned);

  // Monthly: estimate from weekly × 4 + this week's progress
  const monthlyEarned = weeklyEarned * 3 + weeklyEarned * (driver.weeklyProgress / 100);
  const monthlyGoal = driver.monthlyGoal ?? 1;
  const monthlyPct = Math.min(100, Math.round((monthlyEarned / monthlyGoal) * 100));
  const monthlyRemaining = Math.max(0, monthlyGoal - monthlyEarned);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-black text-foreground">Earnings goals</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
          <TrendingUp className="h-2.5 w-2.5" /> On track
        </span>
      </div>

      {/* Weekly */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This week</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black tabular-nums text-emerald-400">{fmtCedisExact(weeklyEarned)}</span>
              <span className="text-[11px] text-muted-foreground">/ {fmtCedis(weeklyGoal)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-foreground">{weeklyPct}%</div>
            <div className="text-[10px] font-semibold text-muted-foreground">
              {weeklyRemaining > 0 ? (
                <span className="text-amber-400">{fmtCedis(weeklyRemaining)} to go</span>
              ) : (
                <span className="text-emerald-400">Goal achieved! 🎉</span>
              )}
            </div>
          </div>
        </div>
        <ProgressBar pct={weeklyPct} color="bg-emerald-500" />
      </div>

      {/* Monthly */}
      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This month</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black tabular-nums text-violet-400">{fmtCedis(monthlyEarned)}</span>
              <span className="text-[11px] text-muted-foreground">/ {fmtCedis(monthlyGoal)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-foreground">{monthlyPct}%</div>
            <div className="text-[10px] font-semibold text-muted-foreground">
              {monthlyRemaining > 0 ? (
                <span className="text-amber-400">{fmtCedis(monthlyRemaining)} to go</span>
              ) : (
                <span className="text-emerald-400">Goal achieved! 🎉</span>
              )}
            </div>
          </div>
        </div>
        <ProgressBar pct={monthlyPct} color="bg-violet-500" />
      </div>
    </motion.div>
  );
}

// ----- Section 3: Coverage map ---------------------------------------------

function CoverageMapPanel({ driver }: { driver: DriverOSProfile }) {
  // Build a pseudo-map: normalize lat/lng to a 0-100% box
  const areas = driver.coverageMap;
  const lats = areas.map((a) => a.lat);
  const lngs = areas.map((a) => a.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const rangeLat = Math.max(0.05, maxLat - minLat);
  const rangeLng = Math.max(0.05, maxLng - minLng);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-black text-foreground">Coverage map</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {areas.length} zones
        </span>
      </div>

      {/* Visual map */}
      <div className="relative mb-3 h-44 overflow-hidden rounded-xl border border-border/40 bg-background/40">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Coverage circles */}
        {areas.map((a, i) => {
          const x = ((a.lng - minLng) / rangeLng) * 80 + 10;
          const y = 90 - ((a.lat - minLat) / rangeLat) * 80;
          const radius = Math.max(20, Math.min(50, a.radiusKm * 8));
          const dm = DEMAND_META[a.demand];
          const fillColor =
            a.demand === "high" ? "oklch(0.65 0.22 13 / 0.18)" : a.demand === "medium" ? "oklch(0.75 0.18 75 / 0.18)" : "oklch(0.85 0 0 / 0.10)";
          const strokeColor =
            a.demand === "high" ? "oklch(0.65 0.22 13 / 0.50)" : a.demand === "medium" ? "oklch(0.75 0.18 75 / 0.50)" : "oklch(0.85 0 0 / 0.30)";
          return (
            <motion.div
              key={a.zone}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: radius * 2,
                  height: radius * 2,
                  left: -radius,
                  top: -radius,
                  backgroundColor: fillColor,
                  border: `1px dashed ${strokeColor}`,
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3 }}
                className={`relative z-10 h-2 w-2 rounded-full ${dm.text.replace("text-", "bg-")}`}
              />
              <div className="absolute left-3 top-0 z-20 whitespace-nowrap rounded-md bg-background/80 px-1.5 py-0.5 text-[9px] font-bold text-foreground ring-1 ring-border/40 backdrop-blur">
                {a.zone}
              </div>
            </motion.div>
          );
        })}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground ring-1 ring-border/40 backdrop-blur">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> High
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Low
          </span>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {areas.map((a) => {
          const dm = DEMAND_META[a.demand];
          return (
            <div
              key={a.zone}
              className={`inline-flex items-center gap-1.5 rounded-lg border ${dm.border} ${dm.bg} px-2 py-1 text-[10px] font-semibold`}
            >
              <MapPin className={`h-2.5 w-2.5 ${dm.text}`} />
              <span className="text-foreground">{a.zone}</span>
              <span className={`tabular-nums ${dm.text}`}>{fmtCedisExact(a.avgFare)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ----- Section 4: AI Daily schedule ----------------------------------------

function StopCard({ stop, index }: { stop: ScheduleStop; index: number }) {
  const meta = STOP_META[stop.type];
  const Ic = meta.icon;
  const chains = stop.chainsToNext === true || stop.chainsToNext === "true";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative pl-10"
    >
      {/* Dot */}
      <div
        className={`absolute left-[10px] top-3 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${meta.bg} ${meta.border} border`}
      >
        <Ic className={`h-2 w-2 ${meta.color}`} />
      </div>
      {/* Chain connector */}
      {chains && (
        <div className="absolute left-[18px] top-7 h-[calc(100%-12px)] w-px border-l border-dashed border-emerald-500/50" />
      )}

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40">
        <div className="flex items-start gap-3 p-2.5">
          <div className="flex flex-col items-center justify-center rounded-lg bg-foreground/[0.05] px-2 py-1 text-center">
            <span className="text-[11px] font-black tabular-nums text-foreground">{stop.time}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">{stop.title}</span>
              <span
                className={`flex shrink-0 items-center gap-0.5 rounded-full ${meta.bg} px-1.5 py-0.5 text-[8px] font-bold uppercase ${meta.color}`}
              >
                <Ic className="h-2 w-2" /> {meta.label}
              </span>
            </div>
            {stop.type !== "break" && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">
                  <span className="font-semibold text-foreground/80">{stop.origin}</span>
                  <span className="mx-1">→</span>
                  <span className="font-semibold text-foreground/80">{stop.destination}</span>
                </span>
              </div>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                <span className="tabular-nums">{stop.durationMin}m</span>
              </span>
              {stop.riderName && (
                <span className="inline-flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />
                  <span>{stop.riderName}</span>
                </span>
              )}
              {chains && (
                <span className="inline-flex items-center gap-0.5 text-emerald-400">
                  <Route className="h-2.5 w-2.5" />
                  <span>chained</span>
                </span>
              )}
            </div>
          </div>
          {stop.fare > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-base font-black tabular-nums text-emerald-400">{fmtCedisExact(stop.fare)}</span>
              <span className="text-[9px] font-medium uppercase text-muted-foreground">fare</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScheduleTimeline({
  schedule,
  onRebuild,
  rebuilding,
}: {
  schedule: DriverSchedule | null;
  onRebuild: () => void;
  rebuilding: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-black text-foreground">AI daily schedule</h3>
          {schedule?.aiOptimized && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
              <Sparkles className="h-2.5 w-2.5" /> AI-optimized
            </span>
          )}
        </div>
        <button
          onClick={onRebuild}
          disabled={rebuilding}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {rebuilding ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Rebuild
        </button>
      </div>

      {rebuilding && !schedule ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-border/40 bg-background/30" />
          ))}
        </div>
      ) : !schedule || schedule.stops.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No stops built yet"
          sub="Tap Rebuild to have the AI chain your day from preferences and demand."
          accent="text-cyan-400"
        />
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            <ScheduleStat label="Stops" value={String(schedule.stops.length)} color="text-foreground" icon={Route} />
            <ScheduleStat
              label="Projected"
              value={fmtCedis(schedule.projectedEarnings)}
              color="text-emerald-400"
              icon={Wallet}
            />
            <ScheduleStat
              label="Hours"
              value={`${schedule.projectedHours}h`}
              color="text-cyan-400"
              icon={Clock}
            />
            <ScheduleStat
              label="Utilization"
              value={`${schedule.utilizationPct}%`}
              color="text-violet-400"
              icon={Gauge}
            />
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/60" />
            <div className="space-y-2">
              {schedule.stops.map((s, i) => (
                <StopCard key={s.id} stop={s} index={i} />
              ))}
            </div>
          </div>

          {/* Empty-miles note */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-2.5">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{schedule.emptyMilesPct}% empty miles.</span>{" "}
              The AI Builder chained {schedule.stops.filter((s) => s.chainsToNext === true || s.chainsToNext === "true").length}{" "}
              stop{schedule.stops.filter((s) => s.chainsToNext === true || s.chainsToNext === "true").length === 1 ? "" : "s"} to minimize deadhead.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ScheduleStat({
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
    <div className="rounded-lg bg-background/40 px-1.5 py-1.5 text-center">
      <Icon className={`mx-auto h-3 w-3 ${color}`} />
      <div className={`mt-0.5 text-[12px] font-black tabular-nums leading-none ${color}`}>{value}</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

// ----- Section 5: Ride history ---------------------------------------------

function RideRow({ ride }: { ride: RideHistoryEntry }) {
  const meta = RIDE_TYPE_META[ride.type];
  const Ic = meta.icon;
  const isCancelled = ride.status === "cancelled";
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/40 p-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
        <Ic className={`h-3.5 w-3.5 ${meta.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold text-foreground">{ride.rider}</span>
          <span className="shrink-0 text-[9px] uppercase text-muted-foreground">{meta.label}</span>
          {isCancelled && (
            <span className="shrink-0 rounded bg-rose-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-rose-400">
              Cancelled
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="truncate">
            <span className="text-foreground/70">{ride.origin}</span>
            <span className="mx-1">→</span>
            <span className="text-foreground/70">{ride.destination}</span>
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground">
          <span>{fmtDate(ride.date)}</span>
          <span className="tabular-nums">{ride.durationMin}m</span>
          <span className="tabular-nums">{ride.distanceKm} km</span>
          <StarRating rating={ride.rating} size={9} />
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className={`text-sm font-black tabular-nums ${isCancelled ? "text-rose-400 line-through" : "text-emerald-400"}`}>
          {fmtCedisExact(ride.fare)}
        </span>
      </div>
    </div>
  );
}

function RideHistoryList({ rides }: { rides: RideHistoryEntry[] }) {
  const sorted = [...rides].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-black text-foreground">Recent rides</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {rides.length} total
        </span>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-y-auto scroll-thin pr-1">
        {sorted.length === 0 ? (
          <EmptyState icon={History} title="No rides yet" sub="Ride history will appear here." />
        ) : (
          sorted.map((r) => <RideRow key={r.id} ride={r} />)
        )}
      </div>
    </motion.div>
  );
}

// ----- Section 6: Reviews --------------------------------------------------

function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-[10px] font-black text-violet-300 ring-1 ring-violet-500/30">
          {review.riderAvatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-xs font-bold text-foreground">{review.riderName}</span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{fmtAgoTs(review.date)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <StarRating rating={review.rating} size={10} />
            <span className="text-[10px] font-bold tabular-nums text-amber-400">{review.rating}</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/80">{review.comment}</p>
          {review.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {review.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground"
                >
                  <Sparkles className="h-2 w-2 text-cyan-400" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewsList({ reviews }: { reviews: DriverReview[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <h3 className="text-sm font-black text-foreground">Reviews</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {reviews.length} reviews
        </span>
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto scroll-thin pr-1">
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet" sub="Reviews from riders will appear here." />
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>
    </motion.div>
  );
}

// ----- Section 7: Applications tracker (driver-side) -----------------------

function ApplicationsTracker({
  applications,
  onReview,
  busy,
}: {
  applications: DriverApplication[];
  onReview: (id: string, approved: boolean) => void;
  busy: boolean;
}) {
  if (applications.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.05] p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-black text-foreground">Subscription applications</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {applications.length} pending review
        </span>
      </div>
      <div className="max-h-56 space-y-1.5 overflow-y-auto scroll-thin pr-1">
        {applications.map((app) => {
          const sc = scoreColor(app.compatibilityScore);
          const st = APP_STATUS_META[app.status];
          return (
            <div
              key={app.id}
              className="rounded-xl border border-border/40 bg-card/40 p-2.5"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-[10px] font-black text-violet-300 ring-1 ring-violet-500/30">
                  {app.riderName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-bold text-foreground">{app.riderName}</span>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${st.bg} ${st.border} ${st.text}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>Applied {fmtAgoTs(app.appliedAt)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Compatibility</span>
                    <span className={`text-[11px] font-black tabular-nums ${sc.text}`}>
                      {app.compatibilityScore}/100
                    </span>
                  </div>
                  {app.notes && (
                    <p className="mt-1 text-[10px] italic text-muted-foreground">"{app.notes}"</p>
                  )}
                  {app.status === "pending" && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        disabled={busy}
                        onClick={() => onReview(app.id, true)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => onReview(app.id, false)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ----- Section 8: Preferences editor ---------------------------------------

function ChipToggle({
  active,
  onClick,
  children,
  colorActive = "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  colorIdle = "bg-background/40 border-border/50 text-muted-foreground",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorActive?: string;
  colorIdle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
        active ? colorActive : colorIdle
      } hover:brightness-110`}
    >
      {active && <CheckCircle2 className="h-2.5 w-2.5" />}
      {children}
    </button>
  );
}

function PreferencesEditor({
  driver,
  onSave,
  saving,
}: {
  driver: DriverOSProfile;
  onSave: (prefs: any) => void;
  saving: boolean;
}) {
  // Initial state seeded from the driver prop. The parent remounts this
  // component via `key={driver.id}` whenever the selected driver changes,
  // so we don't need a resync effect here.
  const [weeklyGoal, setWeeklyGoal] = useState(driver.weeklyGoal);
  const [monthlyGoal, setMonthlyGoal] = useState(driver.monthlyGoal);
  const [neighborhoods, setNeighborhoods] = useState<string[]>(driver.preferredNeighborhoods);
  const [workStart, setWorkStart] = useState(driver.workingHours.start);
  const [workEnd, setWorkEnd] = useState(driver.workingHours.end);
  const [workDays, setWorkDays] = useState<number[]>(driver.workingHours.days);
  const [rideTypes, setRideTypes] = useState<string[]>(driver.preferredRideTypes);
  const [maxHours, setMaxHours] = useState(driver.maxWorkingHoursPerDay);

  const toggleNeighborhood = (n: string) => {
    setNeighborhoods((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };
  const toggleDay = (d: number) => {
    setWorkDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };
  const toggleRideType = (t: string) => {
    setRideTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSave = () => {
    onSave({
      weeklyGoal,
      monthlyGoal,
      preferredNeighborhoods: neighborhoods,
      workingHours: { start: workStart, end: workEnd, days: workDays },
      preferredRideTypes: rideTypes,
      maxWorkingHoursPerDay: maxHours,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/60 p-3.5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-black text-foreground">Preferences</h3>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* Goals */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Weekly goal (GH₵)
            </label>
            <input
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-sm font-bold tabular-nums text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Monthly goal (GH₵)
            </label>
            <input
              type="number"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-sm font-bold tabular-nums text-foreground focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Preferred neighborhoods */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Preferred neighborhoods
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_NEIGHBORHOODS.map((n) => (
              <ChipToggle
                key={n}
                active={neighborhoods.includes(n)}
                onClick={() => toggleNeighborhood(n)}
              >
                {n}
              </ChipToggle>
            ))}
          </div>
        </div>

        {/* Working hours */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Working hours
          </label>
          <div className="mb-1.5 flex items-center gap-2">
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="flex-1 rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="flex-1 rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            {DAY_SHORT.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={workDays.includes(i)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  workDays.includes(i)
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                    : "bg-background/40 text-muted-foreground ring-1 ring-border/40"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred ride types */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Preferred ride types
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RIDE_TYPE_OPTIONS.map((rt) => {
              const Ic = rt.icon;
              const active = rideTypes.includes(rt.id);
              return (
                <ChipToggle
                  key={rt.id}
                  active={active}
                  onClick={() => toggleRideType(rt.id)}
                  colorActive="bg-violet-500/15 border-violet-500/30 text-violet-300"
                >
                  <Ic className={`h-2.5 w-2.5 ${active ? rt.color : ""}`} />
                  {rt.label}
                </ChipToggle>
              );
            })}
          </div>
        </div>

        {/* Max hours slider */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Max hours / day
            </label>
            <span className="text-sm font-black tabular-nums text-amber-400">{maxHours}h</span>
          </div>
          <input
            type="range"
            min={4}
            max={14}
            step={1}
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            className="w-full accent-amber-500"
            style={{ accentColor: "oklch(0.82 0.17 75)" }}
          />
          <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
            <span>4h</span>
            <span>14h</span>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-sm font-black uppercase tracking-wide text-amber-300 transition hover:bg-amber-500/25 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save preferences
        </button>
      </div>
    </motion.div>
  );
}

// ----- Section 9: Return ride broadcasting ---------------------------------

function ReturnRideBroadcastForm({
  driver,
  onBroadcast,
  broadcasting,
}: {
  driver: DriverOSProfile;
  onBroadcast: (data: {
    origin: string;
    destination: string;
    departInMin: number;
    seats: number;
    price: number;
  }) => void;
  broadcasting: boolean;
}) {
  // Initial origin defaults to the driver's first coverage zone. Parent
  // remounts via `key={driver.id}` so this stays in sync.
  const [origin, setOrigin] = useState(driver.coverageZones[0] || "");
  const [destination, setDestination] = useState("");
  const [departInMin, setDepartInMin] = useState(15);
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState(20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      toast.error("Origin and destination are required");
      return;
    }
    onBroadcast({ origin, destination, departInMin, seats, price });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-3.5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-black text-foreground">Broadcast return ride</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
          <Sparkles className="h-2.5 w-2.5" /> 35–50% off
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Origin
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            >
              {ALL_NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Destination
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            >
              <option value="">Select zone</option>
              {ALL_NEIGHBORHOODS.filter((n) => n !== origin).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Depart in
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={120}
                value={departInMin}
                onChange={(e) => setDepartInMin(Number(e.target.value))}
                className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
              <span className="text-[10px] text-muted-foreground">min</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Seats
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Price (GH₵)
            </label>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm tabular-nums text-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Estimated rider price preview */}
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rider pays (after ~40% discount)
          </span>
          <span className="text-sm font-black tabular-nums text-amber-300">
            ~{fmtCedisExact(price * 0.6)}
          </span>
        </div>

        <button
          type="submit"
          disabled={broadcasting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-sm font-black uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
        >
          {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          Broadcast to riders
        </button>
      </div>
    </motion.form>
  );
}

// ----- Driver header banner ------------------------------------------------

function DriverHeader({ driver }: { driver: DriverOSProfile }) {
  const st = STATUS_META[driver.status];
  return (
    <motion.div
      key={driver.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/[0.12] via-card/60 to-card/60 p-3.5"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-base font-black text-violet-200 ring-1 ring-violet-500/30">
            {driver.avatar}
          </div>
          {driver.champion && (
            <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/95 ring-2 ring-background">
              <Crown className="h-3 w-3 text-amber-950" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-foreground">{driver.name}</h2>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${st.bg} ${st.border} ${st.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Car className="h-3 w-3" />
              {driver.vehicle}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold tabular-nums text-foreground">{driver.rating}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span className="font-bold tabular-nums text-foreground">{driver.reputation}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3 w-3 text-emerald-400" />
              <span className="font-bold tabular-nums text-foreground">{fmtCedis(driver.savingsGenerated)}</span>
              <span className="text-muted-foreground">saved</span>
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {driver.coverageZones.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground"
              >
                <MapPin className="h-2 w-2" />
                {z}
              </span>
            ))}
            <span className="inline-flex items-center gap-0.5 rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
              <Clock className="h-2 w-2" />
              {driver.workingHours.start}–{driver.workingHours.end}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">
              <Repeat className="h-2 w-2" />
              {driver.subscriptionPackages.length} packages
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----- Tabs ----------------------------------------------------------------

function TabBar({
  tab,
  setTab,
  counts,
}: {
  tab: DashTab;
  setTab: (t: DashTab) => void;
  counts: { overview: number; schedule: number; history: number; settings: number };
}) {
  const tabs: Array<{ id: DashTab; label: string; icon: typeof Car; count?: number; color: string }> = [
    { id: "overview", label: "Overview", icon: Gauge, color: "text-emerald-400" },
    { id: "schedule", label: "Schedule", icon: Calendar, count: counts.schedule, color: "text-cyan-400" },
    { id: "history", label: "History", icon: History, color: "text-amber-400" },
    { id: "settings", label: "Settings", icon: Settings2, color: "text-violet-400" },
  ];
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-card/60 p-1 scroll-thin">
      {tabs.map((t) => {
        const active = t.id === tab;
        const Ic = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.div
                layoutId="dash-tab-active"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-foreground/[0.08] ring-1 ring-foreground/15"
              />
            )}
            <Ic className={`relative h-3 w-3 ${active ? t.color : ""}`} />
            <span className="relative">{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className="relative ml-0.5 inline-flex items-center justify-center rounded-full bg-foreground/10 px-1 text-[9px] font-black tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DriverDashboard() {
  const [drivers, setDrivers] = useState<DriverOSProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [driver, setDriver] = useState<DriverOSProfile | null>(null);
  const [schedule, setSchedule] = useState<DriverSchedule | null>(null);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [tab, setTab] = useState<DashTab>("overview");
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [reviewingApp, setReviewingApp] = useState(false);

  // ---- fetchers ----------------------------------------------------------
  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/kernel/drivers", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as DriverOSProfile[];
      setDrivers(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const fetchDriver = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/kernel/drivers?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as DriverOSProfile;
      setDriver(data);
    } catch {
      /* swallow */
    }
  }, []);

  const fetchSchedule = useCallback(async (id: string) => {
    setRebuilding(true);
    try {
      const res = await fetch(`/api/kernel/drivers/schedule?driverId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as DriverSchedule;
      setSchedule(data);
    } catch {
      /* swallow */
    } finally {
      setRebuilding(false);
    }
  }, []);

  const fetchApplications = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/kernel/drivers/applications?driverId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as DriverApplication[];
      setApplications(data);
    } catch {
      /* swallow */
    }
  }, []);

  // ---- initial load ------------------------------------------------------
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // ---- when selectedId changes, fetch full profile + schedule + apps -----
  useEffect(() => {
    if (!selectedId) return;
    fetchDriver(selectedId);
    fetchSchedule(selectedId);
    fetchApplications(selectedId);
  }, [selectedId, fetchDriver, fetchSchedule, fetchApplications]);

  // ---- periodic refresh of profile (so weekly progress / stats update) ---
  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(() => {
      fetchDriver(selectedId);
      fetchApplications(selectedId);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [selectedId, fetchDriver, fetchApplications]);

  // ---- actions -----------------------------------------------------------
  const handleRebuild = () => {
    if (!selectedId) return;
    fetchSchedule(selectedId);
    toast.success("Schedule rebuilt", {
      description: "The AI Builder re-sequenced your day.",
    });
  };

  const handleSavePreferences = useCallback(
    async (prefs: any) => {
      if (!selectedId) return;
      setSavingPrefs(true);
      try {
        const res = await fetch("/api/kernel/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updatePreferences",
            driverId: selectedId,
            preferences: prefs,
          }),
        });
        if (res.ok) {
          toast.success("Preferences saved");
          await fetchDriver(selectedId);
          await fetchSchedule(selectedId);
        } else {
          toast.error("Could not save preferences");
        }
      } finally {
        setSavingPrefs(false);
      }
    },
    [selectedId, fetchDriver, fetchSchedule]
  );

  const handleBroadcast = useCallback(
    async (data: {
      origin: string;
      destination: string;
      departInMin: number;
      seats: number;
      price: number;
    }) => {
      if (!driver) return;
      setBroadcasting(true);
      try {
        const res = await fetch("/api/kernel/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "broadcastReturn",
            driverId: driver.id,
            driverName: driver.name,
            origin: data.origin,
            destination: data.destination,
            departInMin: data.departInMin,
            seats: data.seats,
            price: data.price,
            vehicle: driver.vehicle,
            rating: driver.rating,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          toast.success("Return ride broadcast", {
            description: `${data.origin} → ${data.destination} · ${data.seats} seat${data.seats === 1 ? "" : "s"} · departs in ${data.departInMin}m`,
          });
          void json;
        } else {
          toast.error("Could not broadcast");
        }
      } finally {
        setBroadcasting(false);
      }
    },
    [driver]
  );

  const handleReviewApp = useCallback(
    async (applicationId: string, approved: boolean) => {
      setReviewingApp(true);
      try {
        const res = await fetch("/api/kernel/drivers/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId, approved }),
        });
        if (res.ok) {
          toast.success(approved ? "Application approved" : "Application rejected");
          if (selectedId) {
            await fetchApplications(selectedId);
            await fetchDriver(selectedId);
          }
        } else {
          toast.error("Could not review application");
        }
      } finally {
        setReviewingApp(false);
      }
    },
    [selectedId, fetchApplications, fetchDriver]
  );

  // ---- derived -----------------------------------------------------------
  const pendingApps = applications.filter((a) => a.status === "pending");
  const tabCounts = {
    overview: 0,
    schedule: schedule?.stops.length ?? 0,
    history: driver?.rideHistory.length ?? 0,
    settings: 0,
  };

  // ---- render ------------------------------------------------------------
  if (loading && drivers.length === 0) {
    return (
      <div className="px-4 pb-8 pt-3">
        <div className="mb-3 h-16 animate-pulse rounded-2xl border border-border/40 bg-card/40" />
        <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/40 bg-card/40" />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-2xl border border-border/40 bg-card/40" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-300">
            <Car className="h-3 w-3" /> Driver OS
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-foreground text-balance sm:text-xl">
            Run your day like a fleet — reputation, schedule, and earnings, in one place.
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI-built schedule, coverage map, ride history, reviews, and return-ride broadcasting.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden shrink-0 items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 sm:flex"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-2 w-2 rounded-full bg-violet-400"
          />
          <div className="text-[10px] font-bold uppercase tracking-wide text-violet-300">
            Live · {drivers.length} drivers
          </div>
        </motion.div>
      </div>

      {/* Driver selector */}
      <div className="mb-3">
        <DriverSelector drivers={drivers} selected={driver} onSelect={setSelectedId} />
      </div>

      {!driver ? (
        <EmptyState icon={AlertCircle} title="No driver profile loaded" sub="Select a driver to view their dashboard." />
      ) : (
        <>
          {/* Header banner */}
          <div className="mb-3">
            <DriverHeader driver={driver} />
          </div>

          {/* Tabs */}
          <div className="sticky top-0 z-20 mb-3 -mx-4 bg-background/80 px-4 py-2 backdrop-blur">
            <TabBar tab={tab} setTab={setTab} counts={tabCounts} />
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "overview" && (
                <div className="space-y-3">
                  <OverviewCards driver={driver} />
                  <EarningsGoals driver={driver} />
                  <CoverageMapPanel driver={driver} />
                  {pendingApps.length > 0 && (
                    <ApplicationsTracker
                      applications={pendingApps}
                      onReview={handleReviewApp}
                      busy={reviewingApp}
                    />
                  )}
                </div>
              )}

              {tab === "schedule" && (
                <div className="space-y-3">
                  <ScheduleTimeline
                    schedule={schedule}
                    onRebuild={handleRebuild}
                    rebuilding={rebuilding}
                  />
                  <EarningsGoals driver={driver} />
                </div>
              )}

              {tab === "history" && (
                <div className="space-y-3">
                  <RideHistoryList rides={driver.rideHistory} />
                  <ReviewsList reviews={driver.reviews} />
                </div>
              )}

              {tab === "settings" && (
                <div className="space-y-3">
                  <PreferencesEditor
                    key={driver.id}
                    driver={driver}
                    onSave={handleSavePreferences}
                    saving={savingPrefs}
                  />
                  <ReturnRideBroadcastForm
                    key={`${driver.id}-bcast`}
                    driver={driver}
                    onBroadcast={handleBroadcast}
                    broadcasting={broadcasting}
                  />
                  {pendingApps.length > 0 && (
                    <ApplicationsTracker
                      applications={pendingApps}
                      onReview={handleReviewApp}
                      busy={reviewingApp}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default DriverDashboard;
