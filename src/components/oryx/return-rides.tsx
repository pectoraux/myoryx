"use client";
import { motion } from "framer-motion";
import { RETURN_RIDES } from "@/lib/mock-data";
import { RotateCcw, Star, Clock, ArrowRight, Users, Car, Info } from "lucide-react";
import { toast } from "sonner";

export default function ReturnRides() {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Return Ride Broadcasting
        </span>
      </div>

      <div className="space-y-2">
        {RETURN_RIDES.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent"
          >
            {/* Big discount badge */}
            <div className="absolute right-2 top-2 flex flex-col items-center rounded-xl bg-amber-500/20 px-2 py-1">
              <span className="text-base font-black leading-none text-amber-300 tabular-nums">
                −{r.discountPct}%
              </span>
              <span className="text-[8px] font-bold uppercase text-amber-400/80">off</span>
            </div>

            <div className="flex items-start gap-3 p-3 pr-16">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <Car className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-foreground">{r.driverName}</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                    <span className="tabular-nums">{r.rating}</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{r.origin}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-semibold text-foreground/80">{r.destination}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> departs in {r.departInMin}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" /> {r.seats} seat{r.seats > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Car className="h-3 w-3" /> {r.vehicle}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-amber-500/15 bg-amber-500/[0.04] px-3 py-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tabular-nums text-amber-300">
                  GH₵{r.price}
                </span>
                <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                  GH₵{Math.round(r.price / (1 - r.discountPct / 100))}
                </span>
              </div>
              <button
                onClick={() =>
                  toast.success("Seat grabbed", {
                    description: `${r.driverName} · ${r.origin} → ${r.destination} · −${r.discountPct}%`,
                  })
                }
                className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30"
              >
                Grab seat
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Drivers announce return trips. Passengers nearby get discounted
          offers — the alternative is an empty drive back.
        </p>
      </div>
    </div>
  );
}
