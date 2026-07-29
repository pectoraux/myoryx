import { NextResponse } from "next/server";
import type { RouteOption } from "@/lib/types";

// Generate multi-hop route alternatives given a baseline single-ride price.
export async function POST(req: Request) {
  const body = await req.json();
  const baseline = Number(body?.baseline) || 22;
  const dest = String(body?.destination || "destination");

  const options: RouteOption[] = [
    {
      id: "direct",
      hops: [
        {
          type: "ride",
          label: "Direct ride",
          detail: `Door-to-door to ${dest}`,
          durationMin: 18,
          price: baseline,
          provider: "Oryx best bid",
          emoji: "🚗",
        },
      ],
      totalPrice: baseline,
      totalDuration: 18,
      walkDistance: 0,
      co2: 0,
      savings: 0,
    },
    {
      id: "walk-shuttle-ride",
      hops: [
        { type: "walk", label: "Walk 3 min", detail: "To shuttle stop", durationMin: 3, price: 0, emoji: "🚶" },
        { type: "shuttle", label: "Shared shuttle", detail: "Osu → Ring Road", durationMin: 8, price: 2.5, provider: "Shared Shuttle", emoji: "🚐" },
        { type: "ride", label: "Ride hail", detail: "Ring Road → destination", durationMin: 7, price: 6.5, provider: "Bolt", emoji: "🚗" },
      ],
      totalPrice: 9,
      totalDuration: 18,
      walkDistance: 240,
      co2: 1.8,
      savings: Math.round((baseline - 9) * 100) / 100,
      badge: "Best value",
    },
    {
      id: "moto-ride",
      hops: [
        { type: "moto", label: "Okada moto", detail: "Skip traffic to main road", durationMin: 6, price: 3.2, provider: "Okada Moto", emoji: "🏍️" },
        { type: "ride", label: "Ride hail", detail: "To destination", durationMin: 9, price: 5.8, provider: "inDrive", emoji: "🚗" },
      ],
      totalPrice: 9,
      totalDuration: 15,
      walkDistance: 60,
      co2: 0.6,
      savings: Math.round((baseline - 9) * 100) / 100,
      badge: "Fastest cheap",
    },
    {
      id: "carpool",
      hops: [
        { type: "ride", label: "Smart carpool", detail: "AI matched 3 riders same direction", durationMin: 22, price: 7, provider: "Oryx Pool", emoji: "🧑‍🤝‍🧑" },
      ],
      totalPrice: 7,
      totalDuration: 22,
      walkDistance: 120,
      co2: 2.4,
      savings: Math.round((baseline - 7) * 100) / 100,
      badge: "Max savings",
    },
  ];

  return NextResponse.json({ options, baseline });
}
