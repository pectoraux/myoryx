"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useOryx } from "@/lib/store";
import { DESTINATIONS, haversine, CITY_CENTER } from "@/lib/mock-data";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Navigation,
  Sparkles,
  Zap,
  X,
  TrendingUp,
  Coffee,
  Building2,
  Plane,
  GraduationCap,
  ShoppingBag,
  Utensils,
  Home,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABEL: Record<string, string> = {
  recent: "Recent",
  saved: "Saved",
  suggested: "Suggested",
  event: "Live events",
};

// Google-Maps-style synthetic place suggestions generated from the query.
// In production these would come from a places API; here we derive them from
// the destination catalog + common Accra POI templates so autocomplete feels
// real and responsive.
const POI_TEMPLATES = [
  { name: "Kotoka Int'l Airport", type: "airport", emoji: "✈️", lat: 5.6051, lng: -0.1668 },
  { name: "Accra Mall", type: "shopping", emoji: "🛍️", lat: 5.6262, lng: -0.1769 },
  { name: "University of Ghana", type: "school", emoji: "🎓", lat: 5.6522, lng: -0.1862 },
  { name: "The Octagon", type: "office", emoji: "🏢", lat: 5.5636, lng: -0.2026 },
  { name: "Labadi Beach Hotel", type: "hotel", emoji: "🏖️", lat: 5.5731, lng: -0.1824 },
  { name: "Osu Night Market", type: "food", emoji: "🍜", lat: 5.5597, lng: -0.1757 },
  { name: "Kwame Nkrumah Circle", type: "transit", emoji: "🔄", lat: 5.5731, lng: -0.2053 },
  { name: "Accra Sports Stadium", type: "event", emoji: "🏟️", lat: 5.5753, lng: -0.1967 },
  { name: "Independence Arch", type: "landmark", emoji: "🏛️", lat: 5.5419, lng: -0.2009 },
  { name: "Makola Market", type: "shopping", emoji: "🛒", lat: 5.5636, lng: -0.2083 },
  { name: "A&C Mall", type: "shopping", emoji: "🛍️", lat: 5.6496, lng: -0.1672 },
  { name: "Legon Botanical Gardens", type: "park", emoji: "🌿", lat: 5.6608, lng: -0.1808 },
  { name: "Korle Bu Teaching Hospital", type: "hospital", emoji: "🏥", lat: 5.5408, lng: -0.2217 },
  { name: "Terminal 3", type: "airport", emoji: "✈️", lat: 5.6051, lng: -0.1668 },
  { name: "Oxford Street", type: "food", emoji: "🍽️", lat: 5.5597, lng: -0.1757 },
  { name: "Achimota Mall", type: "shopping", emoji: "🛍️", lat: 5.5803, lng: -0.2306 },
  { name: "East Legon", type: "neighborhood", emoji: "🏘️", lat: 5.6446, lng: -0.1672 },
  { name: "Spintex", type: "neighborhood", emoji: "🏘️", lat: 5.6295, lng: -0.1441 },
  { name: "Tema", type: "neighborhood", emoji: "🏘️", lat: 5.6037, lng: -0.0168 },
  { name: "Madina", type: "neighborhood", emoji: "🏘️", lat: 5.6808, lng: -0.1668 },
];

const TYPE_ICON: Record<string, any> = {
  airport: Plane,
  shopping: ShoppingBag,
  school: GraduationCap,
  office: Briefcase,
  hotel: Home,
  food: Utensils,
  transit: Navigation,
  event: Star,
  landmark: Building2,
  park: Sparkles,
  hospital: Building2,
  neighborhood: MapPin,
  coffee: Coffee,
};

function matchPois(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return POI_TEMPLATES.filter(
    (p) => p.name.toLowerCase().includes(q) || p.type.includes(q)
  ).slice(0, 6);
}

export default function DestinationSearch() {
  const { destination, setDestination, setTripMetrics, generateQuotes, setSheetSnap, startAuction } =
    useOryx();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Snap sheet up to "search" height when the search is focused so the
  // autocomplete dropdown has room to breathe — just like Google Maps.
  useEffect(() => {
    if (focused) setSheetSnap("search");
  }, [focused, setSheetSnap]);

  const select = (d: (typeof DESTINATIONS)[number]) => {
    setDestination(d);
    const km = haversine(CITY_CENTER, { lat: d.lat, lng: d.lng });
    const min = Math.round(km * 2.4 + 4);
    setTripMetrics(Math.round(km * 10) / 10, min);
    generateQuotes();
    setSheetSnap("half");
    setFocused(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const selectPoi = (p: (typeof POI_TEMPLATES)[number]) => {
    const d = {
      id: `poi-${p.name.replace(/\s/g, "-")}`,
      name: p.name,
      address: "Accra, Ghana",
      lat: p.lat,
      lng: p.lng,
      category: "recent" as const,
      emoji: p.emoji,
    };
    select(d);
  };

  // Autocomplete suggestions — blend POI matches with destination matches
  const suggestions = useMemo(() => matchPois(query), [query]);
  const showingAutocomplete = focused && query.length > 0 && suggestions.length > 0;

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
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-lg shadow-black/20 transition ${
            focused
              ? "border-emerald-500/60 bg-card"
              : "border-border/70 bg-card/60"
          }`}
          style={{
            background: focused
              ? "oklch(0.18 0.008 200 / 0.98)"
              : "oklch(0.16 0.008 200 / 0.85)",
          }}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
              focused ? "bg-emerald-500/25" : "bg-emerald-500/15"
            }`}
          >
            <Search className={`h-4 w-4 ${focused ? "text-emerald-300" : "text-emerald-400"}`} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            placeholder="Where to?"
            className="w-full bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition hover:bg-foreground/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Autocomplete dropdown — Google Maps style */}
        <AnimatePresence>
          {showingAutocomplete && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border/70 shadow-2xl shadow-black/50"
              style={{
                background: "oklch(0.16 0.008 200 / 0.99)",
                backdropFilter: "blur(20px) saturate(1.5)",
                WebkitBackdropFilter: "blur(20px) saturate(1.5)",
              }}
            >
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Suggestions
                </span>
              </div>
              {suggestions.map((p, i) => {
                const Icon = TYPE_ICON[p.type] || MapPin;
                return (
                  <button
                    key={`${p.name}-${i}`}
                    // mouse down (not click) so it fires before blur hides the dropdown
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectPoi(p);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-foreground/[0.05]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                      </div>
                      <div className="truncate text-[11px] capitalize text-muted-foreground">
                        {p.type} · Accra
                      </div>
                    </div>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
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
        {destination && !focused && (
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
                  <div className="text-sm font-bold text-amber-950">Save with AI auction</div>
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

      {/* Destination list — hidden while autocomplete is showing */}
      {!showingAutocomplete && (
        <div className="mt-4 space-y-1">
          {grouped ? (
            grouped.map((g) => (
              <div key={g.cat} className="mb-3">
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABEL[g.cat]}
                  </span>
                  {g.cat === "event" && (
                    <span className="flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-400">
                      <TrendingUp className="h-2.5 w-2.5" /> Surge soon
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
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matches in your catalog — try the suggestions above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
