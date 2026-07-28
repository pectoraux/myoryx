"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import HeaderBar from "@/components/oryx/header-bar";
import MarketTicker from "@/components/oryx/market-ticker";
import BottomSheet from "@/components/oryx/bottom-sheet";
import SheetContent from "@/components/oryx/sheet-content";
import IntroOverlay from "@/components/oryx/intro-overlay";
import MergeOffer from "@/components/oryx/merge-offer";
import { useOryx } from "@/lib/store";
import { generateVehicles, CITY_CENTER } from "@/lib/mock-data";

const MapView = dynamic(() => import("@/components/oryx/map-view"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 animate-pulse bg-background" />
  ),
});

export default function Page() {
  const { destination, mergeOffer, setMergeOffer, liveAuctionActive } = useOryx();
  const [vehicles, setVehicles] = useState(() => generateVehicles(CITY_CENTER, 14));

  // Animate vehicles drifting around the map
  useEffect(() => {
    const id = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const dLat = (Math.random() - 0.5) * 0.0008;
          const dLng = (Math.random() - 0.5) * 0.0008;
          return {
            ...v,
            lat: v.lat + dLat,
            lng: v.lng + dLng,
            heading: (v.heading + Math.floor(Math.random() * 40 - 20) + 360) % 360,
          };
        })
      );
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Demo: surface a merge offer once, after a delay, when not in an auction
  useEffect(() => {
    if (mergeOffer) return;
    if (liveAuctionActive) return;
    const id = setTimeout(() => {
      setMergeOffer({ saving: 6, riderName: "Ama O." });
    }, 32000);
    return () => clearTimeout(id);
  }, [mergeOffer, liveAuctionActive, setMergeOffer]);

  const auctionActive = liveAuctionActive;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Map */}
      <MapView
        destination={
          destination
            ? { lat: destination.lat, lng: destination.lng, name: destination.name }
            : null
        }
        vehicles={vehicles}
        auctionActive={auctionActive}
      />

      {/* Header overlay */}
      <HeaderBar />

      {/* Live market ticker */}
      <MarketTicker />

      {/* Merge offer modal */}
      <MergeOffer />

      {/* Bottom sheet */}
      <BottomSheet>
        <SheetContent />
      </BottomSheet>

      {/* Intro overlay (first visit) */}
      <IntroOverlay />
    </main>
  );
}
