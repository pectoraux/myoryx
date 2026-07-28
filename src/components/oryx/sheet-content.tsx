"use client";
import { useOryx } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gavel,
  Layers,
  Route,
  Users,
  Network,
  Wallet,
} from "lucide-react";
import DestinationSearch from "./destination-search";
import ProviderComparison from "./provider-comparison";
import WaitOptimizer from "./wait-optimizer";
import DestinationIntel from "./destination-intel";
import PoolSuggestions from "./pool-suggestions";
import RouteAlternatives from "./route-alternatives";
import { VehicleMarketplace } from "./vehicle-marketplace";
import { CalendarIntelligence } from "./calendar-intelligence";
import AuctionPanel from "./auction-panel";
import { MobilityTeam } from "./mobility-team";
import { IntelligenceNetwork } from "./intelligence-network";
import { DriverIntelligence } from "./driver-intelligence";
import { ContinuousOptimization } from "./continuous-optimization";
import { SavingsPanel } from "./savings-panel";

const FULL_TABS = [
  { id: "auction", label: "Auction", icon: Gavel },
  { id: "compare", label: "Compare", icon: Layers },
  { id: "routes", label: "Routes", icon: Route },
  { id: "team", label: "Team", icon: Users },
  { id: "network", label: "Network", icon: Network },
  { id: "savings", label: "Savings", icon: Wallet },
] as const;

export default function SheetContent() {
  const { sheetSnap, activeView, setActiveView, destination } = useOryx();

  // Collapsed — search only
  if (sheetSnap === "collapsed") {
    return <DestinationSearch />;
  }

  // Half — search summary + comparison + insights
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
        <ProviderComparison />
        <VehicleMarketplace />
        <WaitOptimizer />
        <CalendarIntelligence />
        <DestinationIntel />
        <PoolSuggestions />
        <RouteAlternatives />
      </div>
    );
  }

  // Full — tabbed experience
  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 glass-strong flex items-center gap-0.5 border-b border-border/40 px-1.5 py-2">
        {FULL_TABS.map((t) => {
          const active = activeView === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id as any)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition ${
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
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === "auction" && (
            <div>
              <AuctionPanel />
              <div className="px-4 pb-8">
                <ContinuousOptimization />
              </div>
            </div>
          )}
          {activeView === "compare" && (
            <div>
              <ProviderComparison />
              <div className="px-4 pb-8">
                <VehicleMarketplace />
                <WaitOptimizer />
                <CalendarIntelligence />
              </div>
            </div>
          )}
          {activeView === "routes" && (
            <div className="px-4 pb-8 pt-3">
              <RouteAlternatives />
            </div>
          )}
          {activeView === "team" && <MobilityTeam />}
          {activeView === "network" && (
            <div>
              <IntelligenceNetwork />
              <div className="px-4 pb-8">
                <DriverIntelligence />
              </div>
            </div>
          )}
          {activeView === "savings" && <SavingsPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
