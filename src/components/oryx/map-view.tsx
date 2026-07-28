"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_CENTER, PROVIDERS } from "@/lib/mock-data";

interface MapViewProps {
  destination: { lat: number; lng: number; name: string } | null;
  vehicles: Array<{
    id: string;
    providerId: string;
    lat: number;
    lng: number;
    heading: number;
    eta: number;
  }>;
  auctionActive: boolean;
}

export default function MapView({ destination, vehicles, auctionActive }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [CITY_CENTER.lat, CITY_CENTER.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
    });
    // CartoDB dark matter tiles — no API key needed
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    vehicleLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    // User location pulse marker
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#72b1a6;opacity:0.5;" class="pulse-ring"></div>
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#72b1a6;border:3px solid #0c0f14;box-shadow:0 0 12px #72b1a6;"></div>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    userMarkerRef.current = L.marker([CITY_CENTER.lat, CITY_CENTER.lng], {
      icon: userIcon,
    }).addTo(map);

    mapRef.current = map;
    // invalidate size after mount
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // render vehicles
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();
    vehicles.forEach((v) => {
      const provider = PROVIDERS.find((p) => p.id === v.providerId);
      const color = provider?.color || "#888";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;transform:rotate(${v.heading}deg);">
          <div style="width:26px;height:26px;border-radius:9px;background:${color};color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.85);box-shadow:0 4px 12px rgba(0,0,0,0.5);transform:rotate(-${v.heading}deg);">${provider?.emoji || "?"}</div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const m = L.marker([v.lat, v.lng], { icon }).addTo(vehicleLayerRef.current!);
      m.bindTooltip(
        `${provider?.name} · ${v.eta} min`,
        { direction: "top", offset: [0, -12], className: "oryx-tip" }
      );
    });
  }, [vehicles]);

  // render destination + route
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (!destination) return;

    const destIcon = L.divIcon({
      className: "",
      html: `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:30px;height:30px;border-radius:9999px;background:rgba(245,166,35,0.25);"></div>
        <div style="position:relative;width:16px;height:16px;border-radius:9999px;background:#f5a623;border:3px solid #0c0f14;box-shadow:0 0 14px #f5a623;"></div>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    destMarkerRef.current = L.marker([destination.lat, destination.lng], {
      icon: destIcon,
    }).addTo(mapRef.current);

    // curved route line (simulated)
    const start = [CITY_CENTER.lat, CITY_CENTER.lng] as [number, number];
    const end = [destination.lat, destination.lng] as [number, number];
    const mid: [number, number] = [
      (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.18,
      (start[1] + end[1]) / 2 - (end[0] - start[0]) * 0.18,
    ];
    L.polyline([start, mid, end], {
      color: auctionActive ? "#f5a623" : "#72b1a6",
      weight: 4,
      opacity: 0.9,
      dashArray: auctionActive ? "8 10" : undefined,
      lineCap: "round",
    }).addTo(routeLayerRef.current);
    L.polyline([start, mid, end], {
      color: auctionActive ? "#f5a623" : "#72b1a6",
      weight: 10,
      opacity: 0.15,
      lineCap: "round",
    }).addTo(routeLayerRef.current);

    // fit bounds
    const bounds = L.latLngBounds([start, end]);
    mapRef.current.fitBounds(bounds.pad(0.4), { animate: true, maxZoom: 15 });
  }, [destination, auctionActive]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {/* subtle vignette + grid overlay */}
      <div className="pointer-events-none absolute inset-0 grid-texture opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 40%, oklch(0.115 0.006 200 / 0.55) 100%)",
        }}
      />
    </div>
  );
}
