"use client";
import { motion } from "framer-motion";
import {
  Car,
  Clock,
  MapPin,
  Users,
  Package,
  Plane,
  Building2,
  GraduationCap,
  Moon,
  Sparkles,
  Calendar,
} from "lucide-react";
import PersonalDrivers from "@/components/oryx/personal-drivers";
import CommuteCommunities from "@/components/oryx/commute-communities";
import ReturnRides from "@/components/oryx/return-rides";

// ---- AI-built driver schedule (sample) ------------------------------------
// Demonstrates how Oryx chains a driver's day: rider → return → parcel →
// airport → corporate pickup → school → evening commute. Zero empty miles.

interface ScheduleStop {
  time: string;
  title: string;
  kind: "rider" | "return" | "parcel" | "airport" | "corporate" | "school" | "commute";
  origin: string;
  destination: string;
  fare: number;
  note: string;
}

const SCHEDULE: ScheduleStop[] = [
  { time: "06:40", title: "Morning rider — East Legon → Airport", kind: "rider", origin: "East Legon", destination: "Kotoka Airport", fare: 28, note: "Surge window · auto-accepted" },
  { time: "07:10", title: "Return ride — Airport → Spintex", kind: "return", origin: "Kotoka Airport", destination: "Spintex", fare: 18, note: "−40% broadcast matched" },
  { time: "08:30", title: "Parcel batch — 12 packages to Tema", kind: "parcel", origin: "Spintex", destination: "Tema", fare: 64, note: "Batched by Parcel Agent" },
  { time: "10:15", title: "Airport pickup — Kotoka → Osu", kind: "airport", origin: "Kotoka Airport", destination: "Osu", fare: 32, note: "Pre-booked · flight tracked" },
  { time: "12:00", title: "Corporate pickup — Octagon → Cantonments", kind: "corporate", origin: "The Octagon", destination: "Cantonments", fare: 26, note: "Corp account · flat rate" },
  { time: "15:30", title: "School run — Legasus → East Legon", kind: "school", origin: "Legasus", destination: "East Legon", fare: 16, note: "Subscription · weekly" },
  { time: "18:20", title: "Evening commute pool — 4 riders", kind: "commute", origin: "Circle", destination: "East Legon", fare: 44, note: "4-seat pool · +18% earnings" },
];

const STOP_META: Record<
  ScheduleStop["kind"],
  { icon: typeof Car; color: string; bg: string; label: string }
> = {
  rider: { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/15", label: "Rider" },
  return: { icon: Car, color: "text-amber-400", bg: "bg-amber-500/15", label: "Return" },
  parcel: { icon: Package, color: "text-orange-400", bg: "bg-orange-500/15", label: "Parcel" },
  airport: { icon: Plane, color: "text-cyan-400", bg: "bg-cyan-500/15", label: "Airport" },
  corporate: { icon: Building2, color: "text-violet-400", bg: "bg-violet-500/15", label: "Corporate" },
  school: { icon: GraduationCap, color: "text-pink-400", bg: "bg-pink-500/15", label: "School" },
  commute: { icon: Moon, color: "text-cyan-300", bg: "bg-cyan-500/10", label: "Commute" },
};

const TOTAL_EARNINGS = SCHEDULE.reduce((s, x) => s + x.fare, 0);
const TOTAL_HOURS = 11.7; // 06:40 → 18:20

export function PersonalDriversHub() {
  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-300">
          <Car className="h-3 w-3" /> Personal Drivers
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Your drivers, communities, and AI-built day
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Subscribe to recurring drivers, join commute communities, snap up
          return rides, and preview a full day built by the driver AI team.
        </p>
      </div>

      {/* Personal Drivers */}
      <PersonalDrivers />

      {/* Commute Communities */}
      <CommuteCommunities />

      {/* Return Rides */}
      <ReturnRides />

      {/* AI-built driver schedule preview */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Driver schedule preview · built by AI
          </span>
        </div>
        <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
          The Schedule Builder chains every leg of the day — rider → return →
          parcel → airport → corporate → school → evening commute. Zero empty
          miles.
        </p>

        {/* Day summary */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 via-emerald-500/5 to-transparent"
        >
          <div className="grid grid-cols-3 divide-x divide-border/30">
            <DayStat label="Stops" value={String(SCHEDULE.length)} color="text-foreground" />
            <DayStat label="Earnings" value={`GH₵${TOTAL_EARNINGS}`} color="text-emerald-400" />
            <DayStat label="Active hours" value={`${TOTAL_HOURS}h`} color="text-cyan-400" />
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/60" />
          <div className="space-y-2">
            {SCHEDULE.map((stop, i) => {
              const meta = STOP_META[stop.kind];
              const SIcon = meta.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative pl-10"
                >
                  {/* Dot */}
                  <div
                    className={`absolute left-[10px] top-3 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${meta.bg}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.bg.replace("/15", "/80")}`} />
                  </div>

                  {/* Card */}
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40">
                    <div className="flex items-start gap-3 p-3">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-foreground/[0.04] px-2 py-1.5 text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {stop.time.split(":")[0]}:{stop.time.split(":")[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-foreground">
                            {stop.title}
                          </span>
                          <span
                            className={`flex shrink-0 items-center gap-0.5 rounded-full ${meta.bg} px-1.5 py-0.5 text-[8px] font-bold uppercase ${meta.color}`}
                          >
                            <SIcon className="h-2 w-2" /> {meta.label}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-foreground/80">{stop.origin}</span>
                            <span className="mx-1">→</span>
                            <span className="font-semibold text-foreground/80">{stop.destination}</span>
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                          <span>{stop.note}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-base font-black tabular-nums text-emerald-400">
                          GH₵{stop.fare}
                        </span>
                        <span className="text-[9px] font-medium uppercase text-muted-foreground">
                          fare
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">No empty miles.</span> The Schedule
            Builder agent continuously re-sequences your day as new rides, returns, and parcels
            arrive — keeping utilization and earnings maximal.
          </p>
        </div>
      </div>
    </div>
  );
}

function DayStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <div className={`text-lg font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export default PersonalDriversHub;
