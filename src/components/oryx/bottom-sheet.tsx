"use client";
import { useRef, useCallback, useState, type ReactNode } from "react";
import { useOryx } from "@/lib/store";

const SNAP_PERCENTS = { collapsed: 18, half: 56, full: 94 } as const;

interface BottomSheetProps {
  children: ReactNode;
}

export default function BottomSheet({ children }: BottomSheetProps) {
  const { sheetSnap, setSheetSnap } = useOryx();
  const dragStartY = useRef(0);
  const startHeightPct = useRef(SNAP_PERCENTS[sheetSnap]);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const heightPct = dragHeight ?? SNAP_PERCENTS[sheetSnap];

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartY.current = e.clientY;
      startHeightPct.current = SNAP_PERCENTS[sheetSnap];
      setDragHeight(SNAP_PERCENTS[sheetSnap]);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [sheetSnap]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragHeight === null) return;
      const delta = e.clientY - dragStartY.current;
      const vh = window.innerHeight;
      const deltaPct = (-delta / vh) * 100;
      const next = Math.max(
        SNAP_PERCENTS.collapsed,
        Math.min(SNAP_PERCENTS.full, startHeightPct.current + deltaPct)
      );
      setDragHeight(next);
    },
    [dragHeight]
  );

  const snapToNearest = useCallback(
    (h: number) => {
      const snaps: Array<{ key: keyof typeof SNAP_PERCENTS; val: number }> = [
        { key: "collapsed", val: SNAP_PERCENTS.collapsed },
        { key: "half", val: SNAP_PERCENTS.half },
        { key: "full", val: SNAP_PERCENTS.full },
      ];
      let best = snaps[0];
      let bestDist = Math.abs(h - best.val);
      for (const s of snaps) {
        const d = Math.abs(h - s.val);
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      setSheetSnap(best.key);
      setDragHeight(null);
    },
    [setSheetSnap]
  );

  const onPointerUp = useCallback(() => {
    if (dragHeight === null) return;
    snapToNearest(dragHeight);
  }, [dragHeight, snapToNearest]);

  const isDragging = dragHeight !== null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col"
      style={{
        height: `calc(${heightPct}vh - env(safe-area-inset-bottom, 0px) * 0)`,
        transition: isDragging ? "none" : "height 0.42s cubic-bezier(0.32, 0.72, 0, 1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="glass-strong relative mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border-x border-t border-border/70 shadow-2xl shadow-black/60">
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-2 pt-2.5 pb-1 active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          <div className="h-1.5 w-11 rounded-full bg-foreground/25" />
        </div>

        {/* Snap selector pills */}
        <div className="flex shrink-0 items-center justify-center gap-1.5 pb-2">
          {(["collapsed", "half", "full"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSheetSnap(s)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                sheetSnap === s
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "collapsed" ? "Search" : s === "half" ? "Compare" : "Auction"}
            </button>
          ))}
        </div>

        {/* Content scroll */}
        <div className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
