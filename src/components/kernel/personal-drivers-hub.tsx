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

import { DriverDashboard } from "./driver-dashboard";
import { DriverMarketplace } from "./driver-marketplace";

export function PersonalDriversHub() {
  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-300">
          <Car className="h-3 w-3" /> Driver Operating System
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Drivers never search for work. The AI builds their day.
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Complete driver profiles, AI scheduling, return ride broadcasting,
          and a personal driver marketplace with calendar compatibility scoring.
        </p>
      </div>

      {/* Driver Dashboard — profile, stats, AI schedule, goals, history, reviews */}
      <DriverDashboard />

      {/* Personal Driver Marketplace — browse, filter, compare, apply */}
      <DriverMarketplace />

      {/* Commute Communities */}
      <CommuteCommunities />

      {/* Return Rides */}
      <ReturnRides />
    </div>
  );
}

export default PersonalDriversHub;
