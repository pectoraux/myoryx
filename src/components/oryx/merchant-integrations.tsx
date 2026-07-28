"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MERCHANT_ORDERS, FLEET_OPERATORS } from "@/lib/mock-data";
import {
  Store,
  Truck,
  Box,
  Clock,
  ArrowRight,
  Check,
  Plug,
  Building2,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, { label: string; chip: string; dot: string }> = {
  created: { label: "Created", chip: "bg-foreground/[0.06] text-muted-foreground", dot: "bg-muted-foreground" },
  optimized: { label: "Optimized", chip: "bg-cyan-500/15 text-cyan-400", dot: "bg-cyan-400" },
  dispatched: { label: "Dispatched", chip: "bg-amber-500/15 text-amber-400", dot: "bg-amber-400" },
  delivered: { label: "Delivered", chip: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
};

const TIMELINE: Array<keyof typeof STATUS_STYLE> = ["created", "optimized", "dispatched", "delivered"];

interface LocalOrder {
  id: string;
  merchant: string;
  pickup: string;
  dropoff: string;
  dimensions: string;
  price: number;
  deadline: string;
  status: keyof typeof STATUS_STYLE;
  courier?: string;
  createdAt: string;
}

export default function MerchantIntegrations() {
  const [orders, setOrders] = useState<LocalOrder[]>(
    MERCHANT_ORDERS.map((o) => ({ ...o, status: o.status as keyof typeof STATUS_STYLE }))
  );

  const placeOrder = () => {
    const newOrder: LocalOrder = {
      id: `m${Date.now()}`,
      merchant: "Accra Gadgets",
      pickup: "Osu Warehouse",
      dropoff: "Your location",
      dimensions: "30×20×15cm",
      price: 15,
      deadline: "Today 6 PM",
      status: "created",
      createdAt: "just now",
    };
    setOrders((prev) => [newOrder, ...prev]);
    toast.success("Order placed · GH₵15 delivery", {
      description: "Optimizing courier routes in real time",
      icon: <Truck className="h-3.5 w-3.5" />,
    });
    // Simulate progression
    setTimeout(() => setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? { ...o, status: "optimized", courier: "Bolt Courier" } : o))), 1800);
    setTimeout(() => setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? { ...o, status: "dispatched" } : o))), 3600);
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Store className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Merchant Integrations
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Businesses connect via API. Checkout creates a delivery order Oryx
        optimizes.
      </p>

      {/* Simulated checkout */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] to-transparent"
      >
        <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
          <Building2 className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
            Simulated merchant checkout
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-base">
              🛒
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Accra Gadgets</div>
              <div className="text-[11px] text-muted-foreground">
                Smartwatch · delivery: <span className="font-semibold text-foreground/80">GH₵15</span>
              </div>
            </div>
          </div>
          <button
            onClick={placeOrder}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-200 transition hover:bg-orange-500/30"
          >
            <Plus className="h-3.5 w-3.5" /> Place order
          </button>
        </div>
      </motion.div>

      {/* Orders list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {orders.map((o) => {
            const st = STATUS_STYLE[o.status];
            const stageIdx = TIMELINE.indexOf(o.status);
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden rounded-2xl border border-border/50 bg-card/40"
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-foreground">{o.merchant}</span>
                        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${st.chip}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{o.pickup}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-semibold text-foreground/80">{o.dropoff}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Box className="h-3 w-3" /> {o.dimensions}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> {o.deadline}
                        </span>
                        {o.courier && (
                          <span className="flex items-center gap-0.5">
                            <Truck className="h-3 w-3" /> {o.courier}
                          </span>
                        )}
                        <span className="text-muted-foreground/60">· {o.createdAt}</span>
                      </div>
                    </div>
                    <span className="text-base font-black tabular-nums text-foreground">
                      GH₵{o.price}
                    </span>
                  </div>

                  {/* Status timeline */}
                  <div className="mt-2.5 flex items-center gap-1">
                    {TIMELINE.map((s, idx) => {
                      const done = idx <= stageIdx;
                      return (
                        <div key={s} className="flex flex-1 items-center">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                              done ? "bg-emerald-500/20 text-emerald-400" : "bg-foreground/[0.06] text-muted-foreground/40"
                            }`}
                          >
                            {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                          </div>
                          {idx < TIMELINE.length - 1 && (
                            <div className={`h-px flex-1 ${idx < stageIdx ? "bg-emerald-500/40" : "bg-foreground/[0.06]"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Connected fleets */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Plug className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Connected fleet operators
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FLEET_OPERATORS.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border/50 bg-card/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-foreground">{f.name}</span>
                    <span
                      className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        f.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-foreground/[0.06] text-muted-foreground"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${f.connected ? "bg-emerald-400" : "bg-muted-foreground/40"}`} />
                      {f.connected ? "Connected" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Truck className="h-3 w-3" /> {f.vehicleCount} vehicles
                    </span>
                    <span className="tabular-nums">util {f.utilization}%</span>
                    <span className="tabular-nums">avg GH₵{f.avgFare}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.zones.map((z) => (
                      <span key={z} className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Utilization bar */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.utilization}%` }}
                  transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-500/30 bg-orange-500/[0.04] p-2.5">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Merchants connect once via API. Every checkout automatically becomes
          an optimized Oryx delivery — routed, courier-matched, and tracked
          end-to-end.
        </p>
      </div>
    </div>
  );
}
