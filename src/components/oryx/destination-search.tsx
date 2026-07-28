"use client";
import { useState } from "react";
import { useOryx } from "@/lib/store";
import { DESTINATIONS, haversine, CITY_CENTER } from "@/lib/mock-data";
import { Search, MapPin, Clock, Star, Navigation, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABEL: Record<string, string> = {
  recent: "Recent",
  saved: "Saved",
  suggested: "Suggested",
  event: "Live events",
};

export default function DestinationSearch() {
  const { destination, setDestination, setTripMetrics, generateQuotes, setSheetSnap, startAuction } =
    useOryx();
  const [query, setQuery] = useState("");

  const select = (d: (typeof DESTINATIONS)[number]) => {
    setDestination(d);
    const km = haversine(CITY_CENTER, { lat: d.lat, lng: d.lng });
    const min = Math.round(km * 2.4 + 4);
    setTripMetrics(Math.round(km * 10) / 10, min);
    generateQuotes();
    setSheetSnap("half");
  };

  const filtered = query
    ? DESTINATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.address.toLowerCase().includes(query.toLowerCase())
      )
    : DESTINATIONS;

  // group by category for non-search
  const grouped = query
    ? null
    : (["event", "suggested", "saved", "recent"] as const)
        .map((cat) => ({
          cat,
          items: DESTINATIONS.filter((d) => d.category === cat),
        }))
        .filter((g) => g.items.length);

  const quickStart = () => {
    if (!destination) {
      select(DESTINATIONS[0]);
      return;
    }
    startAuction();
  };

  return (
    <div className="px-4 pb-6 pt-1">
      {/* Search input */}
      <div className="relative">
        <div className="glass flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3.5 shadow-lg shadow-black/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <Search className="h-4 w-4 text-emerald-400" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where to?"
            className="w-full bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Origin row */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
          <Navigation className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            From
          </div>
          <div className="text-sm font-semibold text-foreground">Current location · Ringway</div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          GPS live
        </span>
      </div>

      {/* Selected destination summary + CTA */}
      <AnimatePresence>
        {destination && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent"
          >
            <div className="flex items-center gap-3 p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl">
                {destination.emoji}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{destination.name}</div>
                <div className="text-xs text-muted-foreground">{destination.address}</div>
              </div>
            </div>
            <button
              onClick={quickStart}
              className="group flex w-full items-center justify-between gap-3 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3.5 text-left transition hover:from-amber-400 hover:to-amber-300"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-950" />
                <div>
                  <div className="text-sm font-bold text-amber-950">
                    Save with AI auction
                  </div>
                  <div className="text-[11px] font-medium text-amber-900/80">
                    Drivers bid down · avg 28% off
                  </div>
                </div>
              </div>
              <Zap className="h-5 w-5 text-amber-950 transition group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination list */}
      <div className="mt-4 space-y-1">
        {grouped ? (
          grouped.map((g) => (
            <div key={g.cat} className="mb-3">
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[g.cat]}
                </span>
                {g.cat === "event" && (
                  <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-400">
                    Surge soon
                  </span>
                )}
              </div>
              {g.items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => select(d)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-foreground/[0.04]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-base">
                    {d.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {d.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.address}
                    </div>
                  </div>
                  {d.category === "event" ? (
                    <Clock className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </button>
              ))}
            </div>
          ))
        ) : (
          filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => select(d)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-foreground/[0.04]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-base">
                {d.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {d.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {d.address}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
