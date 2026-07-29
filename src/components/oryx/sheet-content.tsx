"use client";
import { useState, useMemo } from "react";
import { useOryx } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Layers,
  Gavel,
  Calendar,
  Car,
  Settings,
  Package,
  Truck,
  Clock,
  Leaf,
} from "lucide-react";
import { optimizeParcel } from "@/lib/optimization";
import { toast } from "sonner";
import DestinationSearch from "./destination-search";
import ProviderComparison from "./provider-comparison";
import WaitOptimizer from "./wait-optimizer";
import DestinationIntel from "./destination-intel";
import PoolSuggestions from "./pool-suggestions";
import RouteAlternatives from "./route-alternatives";
import { VehicleMarketplace } from "./vehicle-marketplace";
import { CalendarIntelligence } from "./calendar-intelligence";
import AuctionPanel from "./auction-panel";
import { ContinuousOptimization } from "./continuous-optimization";
import { OptimizationProfiles } from "./optimization-profiles";
import JourneyComposer from "./journey-composer";
import NPDMarketplace from "./npd-marketplace";
import CommuteCommunities from "./commute-communities";
import MerchantIntegrations from "./merchant-integrations";
import { MobilityPlanningEngine } from "@/components/kernel/mobility-planning-engine";
import { PersonalDriversHub } from "@/components/kernel/personal-drivers-hub";
import { SettingsHub } from "@/components/kernel/settings-hub";

const FULL_TABS = [
  { id: "search", label: "Search", icon: Search },
  { id: "compare", label: "Compare", icon: Layers },
  { id: "auction", label: "Auction", icon: Gavel },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "drivers", label: "Drivers", icon: Car },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof FULL_TABS)[number]["id"];

/** Inline parcel courier optimizer — uses the real optimizeParcel engine. */
function ParcelCourierOptimizer() {
  const { distanceKm } = useOryx();
  const km = distanceKm > 0 ? distanceKm : 8.5;
  const options = useMemo(() => optimizeParcel(km, "small", 4), [km]);
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Package className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Parcel courier optimizer
        </span>
      </div>
      <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
        Ranked courier options for a {km.toFixed(1)} km delivery · small · 4h deadline.
      </p>
      <div className="space-y-1.5">
        {options.map((o, i) => (
          <motion.div
            key={o.courier}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
              i === 0
                ? "border-emerald-500/40 bg-emerald-500/[0.05]"
                : "border-border/50 bg-card/40"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
              <Truck className="h-4 w-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold text-foreground">{o.courier}</span>
                {i === 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    Cheapest
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" /> {o.eta}m eta
                </span>
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <Leaf className="h-3 w-3" /> {o.co2}kg
                </span>
              </div>
            </div>
            <span className="text-base font-black tabular-nums text-emerald-400">
              ${o.price.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </div>
      <button
        onClick={() => toast.success("Parcel dispatched", { description: `${options[0].courier} · $${options[0].price.toFixed(2)}` })}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500/20 py-2.5 text-xs font-bold text-orange-200 transition hover:bg-orange-500/30"
      >
        <Truck className="h-3.5 w-3.5" /> Dispatch cheapest courier
      </button>
    </div>
  );
}

export default function SheetContent() {
  const { sheetSnap, activeView, destination, mode } = useOryx();
  const [tab, setTab] = useState<TabId>("search");
  const [lastView, setLastView] = useState(activeView);

  // Adjust local tab when the store's activeView changes externally
  // (e.g. startAuction flips activeView to "auction"). React "adjust state
  // during render" pattern — avoids the set-state-in-effect lint rule.
  if (activeView !== lastView) {
    setLastView(activeView);
    if (activeView === "auction") setTab("auction");
    else if (activeView === "compare") setTab("compare");
    else if (activeView === "search") setTab("search");
  }

  // Collapsed or search-focused — show destination search (autocomplete)
  if (sheetSnap === "collapsed" || sheetSnap === "search") {
    return <DestinationSearch />;
  }

  // Half — search summary + flagship preview + comparison + insights
  if (sheetSnap === "half") {
    return (
      <div>
        {/* compact destination bar */}
        {destination && (
          <div className="px-4 pt-1">
            <button
              onClick={() => useOryx.getState().setSheetSnap("collapsed")}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 text-left"
            >
              <span className="text-xl">{destination.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  To
                </div>
                <div className="truncate text-sm font-bold text-foreground">
                  {destination.name}
                </div>
              </div>
              <span className="rounded-lg bg-foreground/[0.06] px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                Change
              </span>
            </button>
          </div>
        )}

        {/* Flagship preview: optimization profiles + journey composer (best 2) */}
        <div className="px-4 pt-1">
          <OptimizationProfiles variant="chips" />
        </div>
        <JourneyComposer maxItems={2} />

        <ProviderComparison />
        <VehicleMarketplace />
        <WaitOptimizer />
        <CalendarIntelligence />
        <DestinationIntel />

        {/* Compact Mobility Planning Engine preview */}
        <MobilityPlanningEngine compact />

        {/* Compact NPD + commute previews */}
        <NPDMarketplace />
        <CommuteCommunities />

        <PoolSuggestions />
        <RouteAlternatives />
      </div>
    );
  }

  // Full — tabbed experience
  return (
    <div>
      {/* Tab bar (scrollable on mobile — 6 tabs) */}
      <div
        className="scroll-thin sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b border-border/40 px-1.5 py-2"
        style={{
          background: "oklch(0.14 0.008 200 / 0.98)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        }}
      >
        {FULL_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute inset-0 rounded-lg bg-foreground/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <t.icon className="relative h-4 w-4" />
              <span className="relative text-[9px] font-bold uppercase tracking-wide">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "search" && (
            <div className="px-4 pb-8 pt-3">
              <DestinationSearch />
            </div>
          )}
          {tab === "compare" && mode === "people" && (
            <div className="px-4 pb-8 pt-3">
              <OptimizationProfiles />
              <JourneyComposer />
              <ProviderComparison />
              <VehicleMarketplace />
              <WaitOptimizer />
              <CalendarIntelligence />
              <DestinationIntel />
              <PoolSuggestions />
              <RouteAlternatives />
            </div>
          )}
          {tab === "compare" && mode === "parcel" && (
            <div className="px-4 pb-8 pt-3">
              <MerchantIntegrations />
              <ParcelCourierOptimizer />
            </div>
          )}
          {tab === "auction" && (
            <div>
              <AuctionPanel />
              <div className="px-4 pb-8">
                <ContinuousOptimization />
              </div>
            </div>
          )}
          {tab === "calendar" && (
            <MobilityPlanningEngine />
          )}
          {tab === "drivers" && (
            <PersonalDriversHub />
          )}
          {tab === "settings" && (
            <SettingsHub />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
