"use client";
import { useOryx } from "@/lib/store";
import { Wallet, Radio, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderBar() {
  const { savings, setSheetSnap, sheetSnap } = useOryx();

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* Logo */}
        <button
          onClick={() => setSheetSnap("collapsed")}
          className="glass-strong flex items-center gap-2.5 rounded-2xl border border-border/60 px-3 py-2 shadow-xl shadow-black/40 transition hover:border-border"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <span className="text-sm font-black text-emerald-950">O</span>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-background" />
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-bold tracking-tight text-foreground">
              Oryx
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Mobility Marketplace
            </span>
          </div>
        </button>

        {/* Center status — marketplace live */}
        <div className="glass hidden items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 shadow-lg shadow-black/30 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-foreground">
            Marketplace live
          </span>
          <span className="text-xs text-muted-foreground">· 1,284 providers bidding</span>
        </div>

        {/* Savings badge */}
        <button
          onClick={() => setSheetSnap("full")}
          className="glass-strong group flex items-center gap-3 rounded-2xl border border-emerald-500/30 px-3 py-2 shadow-xl shadow-black/40 transition hover:border-emerald-500/60"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Saved YTD
            </span>
            <span className="text-base font-bold tabular-nums text-emerald-400">
              ${savings.ytdSaved}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition group-hover:translate-y-0.5" />
        </button>
      </div>
    </header>
  );
}
