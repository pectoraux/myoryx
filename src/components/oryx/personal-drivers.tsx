"use client";
import { motion } from "framer-motion";
import { PERSONAL_DRIVERS } from "@/lib/mock-data";
import { UserCheck, Star, MapPin, Car, Crown, Heart } from "lucide-react";
import { toast } from "sonner";

export default function PersonalDrivers() {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <UserCheck className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Personal Driver Marketplace
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Recurring mobility relationships, not just on-demand.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PERSONAL_DRIVERS.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
          >
            <div className="relative p-3">
              {d.subscribers >= 15 && (
                <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-300">
                  <Crown className="h-2.5 w-2.5" /> Top pick
                </span>
              )}
              <div className="flex items-start gap-3 pr-12">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-bold text-violet-300">
                  {d.avatar}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                    <Heart className="h-2 w-2 text-white" fill="white" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-foreground">{d.name}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span className="tabular-nums">{d.rating}</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-violet-300">{d.specialty}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Car className="h-3 w-3" /> {d.vehicle}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" /> {d.zone}
                </span>
                <span className="flex items-center gap-0.5">
                  <UserCheck className="h-3 w-3" /> {d.subscribers} subs
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
              <div>
                <div className="text-[9px] font-medium uppercase text-muted-foreground">Weekly</div>
                <div className="text-base font-black tabular-nums text-foreground">
                  GH₵{d.weeklyPrice}
                </div>
              </div>
              <button
                onClick={() =>
                  toast.success("Subscribed", {
                    description: `${d.name} · ${d.specialty} · GH₵${d.weeklyPrice}/wk`,
                  })
                }
                className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-[11px] font-bold text-violet-200 transition hover:bg-violet-500/30"
              >
                Subscribe
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-2.5">
        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Some mobility is recurring: school runs, commutes, medical visits,
          airport specialists. Oryx turns them into subscription relationships,
          not transaction-by-transaction dispatch.
        </p>
      </div>
    </div>
  );
}
