import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST a booked ride + persist savings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      origin,
      destination,
      distanceKm,
      durationMin,
      initialPrice,
      finalPrice,
      providerName,
      driverName,
      agentStrategy,
    } = body || {};
    const savings = Math.max(0, Number(initialPrice) - Number(finalPrice));
    const ride = await db.ride.create({
      data: {
        origin: String(origin || "Current location"),
        destination: String(destination || ""),
        distanceKm: Number(distanceKm) || 0,
        durationMin: Number(durationMin) || 0,
        initialPrice: Number(initialPrice) || 0,
        finalPrice: Number(finalPrice) || 0,
        savings,
        providerName: String(providerName || ""),
        driverName: String(driverName || ""),
        agentStrategy: String(agentStrategy || "balanced"),
        status: "booked",
      },
    });
    // bump savings singleton
    try {
      await db.savingsStat.upsert({
        where: { id: "singleton" },
        update: {
          totalSaved: { increment: savings },
          ytdSaved: { increment: savings },
          ridesCount: { increment: 1 },
          streak: { increment: 1 },
        },
        create: {
          id: "singleton",
          totalSaved: savings,
          ytdSaved: savings,
          ridesCount: 1,
          streak: 1,
        },
      });
    } catch {}
    return NextResponse.json({ ok: true, ride });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
