"use client";
import { motion } from "framer-motion";
import { CreditCard, Repeat, Banknote, CalendarClock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const FLOWS = [
  {
    id: "ride",
    icon: Banknote,
    title: "Ride settlements",
    desc: "Per-trip charge after booking confirmation",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  {
    id: "payouts",
    icon: ArrowUpRight,
    title: "Driver payouts",
    desc: "Daily settlement to drivers' wallets",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
  },
  {
    id: "subs",
    icon: Repeat,
    title: "Recurring subscriptions",
    desc: "Personal-driver weekly billing cycles",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
  },
  {
    id: "merchant",
    icon: CalendarClock,
    title: "Merchant billing",
    desc: "Aggregated weekly invoices per connected business",
    color: "text-orange-400",
    bg: "bg-orange-500/15",
  },
  {
    id: "escrow",
    icon: ShieldCheck,
    title: "Escrow",
    desc: "Funds held during multi-leg trips, released on completion",
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
  },
];

export default function PaySwapPanel() {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Payments via PaySwap
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        All payments delegated to PaySwap (Stripe-compatible). Oryx holds no
        financial logic.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FLOWS.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-4 w-4 ${f.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{f.title}</span>
                  <span className="flex items-center gap-0.5 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan-400">
                    <ShieldCheck className="h-2 w-2" /> PaySwap
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {f.desc}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Powered by PaySwap note */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-3 overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent"
      >
        <div className="flex items-center gap-3 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground">
              Powered by PaySwap
            </div>
            <div className="text-[11px] text-muted-foreground">
              Stripe-compatible API. No payment infrastructure built into Oryx.
            </div>
          </div>
        </div>
        <button
          onClick={() => toast.success("Redirecting to PaySwap…", {
            description: "Secure Stripe-compatible checkout",
            icon: <CreditCard className="h-3.5 w-3.5" />,
          })}
          className="flex w-full items-center justify-center gap-1.5 border-t border-cyan-500/15 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
        >
          <CreditCard className="h-3.5 w-3.5" /> Demo checkout
        </button>
      </motion.div>
    </div>
  );
}
