"use client";
import { motion } from "framer-motion";
import { useOryx } from "@/lib/store";
import { Users, Package } from "lucide-react";

/**
 * People / Parcel pill toggle. The active mode is highlighted green
 * (emerald) regardless of which mode — consistent "selected = green"
 * semantics. The inactive mode is a subtle ghost pill you tap to switch.
 */
export default function ModeToggle() {
  const { mode, setMode } = useOryx();
  const isPeople = mode === "people";

  return (
    <div
      role="tablist"
      aria-label="Mobility mode"
      className="relative flex items-center rounded-full border border-border/60 p-0.5 shadow-lg shadow-black/30"
      style={{
        background: "oklch(0.16 0.008 200 / 0.85)",
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
      }}
    >
      {/* Sliding green indicator — same green for both active states */}
      <motion.div
        layoutId="mode-toggle-indicator"
        className="absolute inset-y-0.5 w-1/2 rounded-full bg-emerald-500"
        style={{
          boxShadow: "0 0 16px oklch(0.72 0.17 158 / 0.5)",
          left: isPeople ? "0.125rem" : "50%",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
      />
      <button
        role="tab"
        aria-selected={isPeople}
        onClick={() => setMode("people")}
        className={`relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${
          isPeople
            ? "text-emerald-950"
            : "text-muted-foreground hover:text-foreground"
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
          !isPeople
            ? "text-emerald-950"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Package className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Parcels</span>
      </button>
    </div>
  );
}
