"use client";
import { motion } from "framer-motion";
import { VEHICLE_OPTIONS } from "@/lib/mock-data";
import { useOryx } from "@/lib/store";
import { Car, Leaf, Clock, Users, Zap, Check } from "lucide-react";

const CO2_STYLE: Record<string, { label: string; color: string }> = {
  low: { label: "Low CO₂", color: "text-emerald-400" },
  medium: { label: "Medium", color: "text-amber-400" },
  high: { label: "High", color: "text-rose-400" },
};

export function VehicleMarketplace() {
  const { selectedVehicle, setSelectedVehicle } = useOryx();

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Car className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Vehicle-agnostic marketplace
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        The routing engine recommends the right vehicle for each trip — from
        motorcycles to autonomous fleets.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {VEHICLE_OPTIONS.map((v, i) => {
          const active = selectedVehicle === v.id;
          return (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedVehicle(v.id)}
              className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                active
                  ? "border-violet-500/50 bg-violet-500/[0.08]"
                  : "border-border/50 bg-card/40 hover:border-border"
              }`}
            >
              {v.recommended && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                  AI pick
                </span>
              )}
              {active && !v.recommended && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <div className="text-2xl">{v.emoji}</div>
              <div className="mt-1 text-sm font-bold text-foreground">
                {v.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {v.bestFor}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" /> {v.capacity}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" /> {v.eta}m
                </span>
                <span className={`flex items-center gap-0.5 ${CO2_STYLE[v.co2].color}`}>
                  <Leaf className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="mt-1.5 flex items-end justify-between">
                <span className="text-base font-black tabular-nums text-foreground">
                  ${v.basePrice}
                </span>
                <span className="text-[9px] font-medium text-muted-foreground">
                  {v.available} nearby
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-2.5">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Drivers aren't limited to cars. Every vehicle category competes in the same marketplace —
          the AI picks the cheapest appropriate option per trip.
        </p>
      </div>
    </div>
  );
}
