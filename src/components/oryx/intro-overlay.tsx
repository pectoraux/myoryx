"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOryx } from "@/lib/store";
import {
  Gavel,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Wallet,
  Layers,
  ChevronRight,
} from "lucide-react";

const SLIDES = [
  {
    icon: Gavel,
    accent: "#f5a623",
    title: "Every ride becomes a live auction",
    body: "Not between riders. Between transportation providers. You broadcast demand — drivers bid downward until you book.",
    visual: "auction",
  },
  {
    icon: Sparkles,
    accent: "#72b1a6",
    title: "Your AI negotiates. You never touch it.",
    body: "Uber, Bolt, Yango, inDrive, taxis, motos, shuttles, carpools — all compete on one screen. The AI counters every bid automatically.",
    visual: "providers",
  },
  {
    icon: Wallet,
    accent: "#4ade80",
    title: "The only KPI is money saved",
    body: "Open Oryx and see \"You have saved $618 this year.\" Waiting 5 minutes might save $11. The AI tells you exactly when to leave.",
    visual: "savings",
  },
];

export default function IntroOverlay() {
  const { introSeen, setIntroSeen, setSheetSnap } = useOryx();
  const [step, setStep] = useState(0);
  if (introSeen) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      setIntroSeen(true);
      setSheetSnap("collapsed");
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

        <motion.div
          key={step}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass-strong relative z-10 mx-auto w-full max-w-md overflow-hidden rounded-t-3xl border-x border-t border-border/70 shadow-2xl shadow-black/60 sm:rounded-3xl sm:border"
        >
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${slide.accent}, transparent)` }}
          />

          {/* Brand */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black"
                style={{ backgroundColor: `${slide.accent}25`, color: slide.accent }}
              >
                O
              </div>
              <span className="text-sm font-bold tracking-tight">Oryx</span>
            </div>
            <button
              onClick={() => {
                setIntroSeen(true);
                setSheetSnap("collapsed");
              }}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Skip
            </button>
          </div>

          {/* Visual */}
          <div className="px-5 pt-5">
            <SlideVisual visual={slide.visual} accent={slide.accent} />
          </div>

          {/* Content */}
          <div className="px-5 pb-2 pt-5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: `${slide.accent}20`, color: slide.accent }}
            >
              <slide.icon className="h-3 w-3" />
              {step === 0 ? "Layer 2 · AI Bargaining" : step === 1 ? "Layer 1 · Universal Search" : "Primary KPI"}
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-foreground text-balance">
              {slide.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {slide.body}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-5 pt-3">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-foreground" : "w-1.5 bg-foreground/20"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-background transition active:scale-95"
              style={{ backgroundColor: slide.accent }}
            >
              {isLast ? "Enter marketplace" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SlideVisual({ visual, accent }: { visual: string; accent: string }) {
  if (visual === "auction") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>Live reverse auction</span>
          <span style={{ color: accent }}>20s</span>
        </div>
        <div className="mt-2 flex items-end justify-center gap-2">
          {[
            { p: 19, o: 0.4 },
            { p: 17, o: 0.6 },
            { p: 14.5, o: 0.8 },
            { p: 13.75, o: 1 },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: b.o, y: 0 }}
              transition={{ delay: i * 0.25 }}
              className="flex flex-col items-center"
            >
              <div
                className="rounded-lg px-2.5 py-1 text-sm font-black tabular-nums"
                style={{ backgroundColor: `${accent}20`, color: i === 3 ? accent : "#fff" }}
              >
                ${b.p}
              </div>
              <TrendingDown className="mt-1 h-3 w-3 text-emerald-400" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  if (visual === "providers") {
    const provs = ["U", "B", "Y", "i", "T", "M", "S", "★"];
    const colors = ["#1a1a1a", "#2bc553", "#ff4d4d", "#c1f11d", "#f5a623", "#ff6b35", "#7b61ff", "#d4af37"];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <Layers className="h-3 w-3" /> One screen · every provider
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {provs.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring" }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg"
              style={{ backgroundColor: colors[i] }}
            >
              {p}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  // savings
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent p-5 text-center">
      <div className="absolute inset-0 grid-texture opacity-30" />
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          You have saved
        </div>
        <div className="mt-1 text-5xl font-black tabular-nums text-emerald-400">$618</div>
        <div className="mt-1 text-xs text-muted-foreground">this year · 87 rides</div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400"
        >
          <Wallet className="h-3.5 w-3.5" /> That becomes addictive
        </motion.div>
      </div>
    </div>
  );
}
