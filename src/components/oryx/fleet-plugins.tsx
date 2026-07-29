"use client";
import { FLEET_PLUGINS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Plug,
  Check,
  Truck,
  Activity,
  MapPin,
  Zap,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function FleetPlugins() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(FLEET_PLUGINS.map((f) => [f.id, f.connected]))
  );

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Plug className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Fleet plugins · liquidity pool participation
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Fleet-management platforms connect via plugins. Their drivers instantly
        join Oryx liquidity pools and compete for demand.
      </p>

      {/* Liquidity pool summary */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
              Active liquidity pools
            </div>
            <div className="mt-1 text-3xl font-black tabular-nums text-foreground">
              {FLEET_PLUGINS.filter((f) => connected[f.id]).reduce(
                (s, f) => s + f.joinedPools,
                0
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              pools ·{" "}
              {FLEET_PLUGINS.filter((f) => connected[f.id]).reduce(
                (s, f) => s + f.vehicles,
                0
              )}{" "}
              vehicles participating
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
            <Activity className="h-6 w-6 text-amber-400" />
          </div>
        </div>
      </motion.div>

      {/* Connect new plugin */}
      <button
        onClick={() =>
          toast.success("Plugin marketplace", {
            description: "Browse fleet-management integrations.",
          })
        }
        className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2.5 text-xs font-semibold text-muted-foreground transition hover:border-amber-500/40 hover:text-amber-400"
      >
        <Plus className="h-3.5 w-3.5" /> Connect a fleet platform
      </button>

      {/* Fleet list */}
      <div className="space-y-2">
        {FLEET_PLUGINS.map((f, i) => {
          const isConnected = connected[f.id];
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`overflow-hidden rounded-2xl border p-3.5 transition ${
                isConnected
                  ? "border-amber-500/30 bg-card/40"
                  : "border-border/50 bg-card/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <Truck className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">
                      {f.name}
                    </span>
                    {isConnected && (
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {f.type}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Truck className="h-2.5 w-2.5" /> {f.vehicles} vehicles
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Activity className="h-2.5 w-2.5" /> {f.utilization}% util
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {f.zones.length} zones
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground/60">Plugin:</span>
                    <span className="font-mono font-semibold text-foreground/80">
                      {f.plugin}
                    </span>
                    {isConnected && f.joinedPools > 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                        <Zap className="h-2 w-2" /> {f.joinedPools} pools
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setConnected((c) => ({ ...c, [f.id]: !c[f.id] }));
                    if (!isConnected) {
                      toast.success(`${f.name} connected`, {
                        description: `${f.vehicles} vehicles joined the liquidity pool.`,
                      });
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    isConnected
                      ? "border border-border/60 text-muted-foreground"
                      : "bg-amber-500 text-amber-950 hover:bg-amber-400"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Check className="h-3 w-3" /> Connected
                    </>
                  ) : (
                    <>
                      <Plug className="h-3 w-3" /> Connect
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Open mobility exchange:</span> any
          fleet platform can plug in. Drivers get instant demand; riders get more supply
          and lower prices.
        </p>
      </div>
    </div>
  );
}
