"use client";
import { motion } from "framer-motion";
import { useOryx } from "@/lib/store";
import { Users, Package } from "lucide-react";

/**
 * Compact People / Parcel pill toggle. Sliding indicator via framer-motion
 * layoutId. Emerald = people, orange = parcel. Fits the header.
 */
export default function ModeToggle() {
  const { mode, setMode } = useOryx();
  const isPeople = mode === "people";

  return (
    <div
      role="tablist"
      aria-label="Mobility mode"
      className="glass relative flex items-center rounded-full border border-border/60 p-0.5 shadow-lg shadow-black/30"
    >
      {/* Sliding indicator */}
      <motion.div
        layoutId="mode-toggle-indicator"
        className="absolute inset-y-0.5 w-1/2 rounded-full"
        style={{
          backgroundColor: isPeople
            ? "oklch(0.6 0.16 152 / 0.22)"
            : "oklch(0.7 0.18 50 / 0.22)",
          boxShadow: isPeople
            ? "0 0 14px oklch(0.6 0.16 152 / 0.35)"
            : "0 0 14px oklch(0.7 0.18 50 / 0.35)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
      />
      <button
        role="tab"
        aria-selected={isPeople}
        onClick={() => setMode("people")}
        className={`relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${
          isPeople ? "text-emerald-300" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">People</span>
      </button>
      <button
        role="tab"
        aria-selected={!isPeople}
        onClick={() => setMode("parcel")}
        className={`relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${
          !isPeople ? "text-orange-300" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Package className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Parcels</span>
      </button>
    </div>
  );
}
