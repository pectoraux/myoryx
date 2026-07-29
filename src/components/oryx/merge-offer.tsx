"use client";
import { useOryx } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function MergeOffer() {
  const { mergeOffer, dismissMerge } = useOryx();

  const accept = () => {
    if (mergeOffer) {
      toast.success(`Ride merged · saved $${mergeOffer.saving.toFixed(2)}`, {
        description: `${mergeOffer.riderName} joined your trip`,
      });
    }
    // Permanent dismissal — never resurface this session.
    dismissMerge();
  };

  const reject = () => {
    // Permanent dismissal — user rejected, don't pester them again.
    dismissMerge();
  };

  return (
    <AnimatePresence>
      {mergeOffer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 items-start justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-violet-500/40 shadow-2xl shadow-black/60"
            style={{
              background: "oklch(0.16 0.008 200 / 0.98)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            }}
          >
            <div className="flex items-center gap-2 border-b border-border/40 bg-violet-500/10 px-4 py-2.5">
              <Users className="h-4 w-4 text-violet-400" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-violet-400">
                Live ride merge · Layer 8
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {mergeOffer.riderName} is heading the same way.
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Merge your ride to reduce your fare by{" "}
                    <span className="font-bold text-emerald-400">${mergeOffer.saving.toFixed(2)}</span>.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={reject}
                  className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-foreground/[0.04]"
                >
                  <X className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={accept}
                  className="flex-[2] rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"
                >
                  <Check className="mr-1 inline h-4 w-4" />
                  Merge & save ${mergeOffer.saving.toFixed(2)}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
