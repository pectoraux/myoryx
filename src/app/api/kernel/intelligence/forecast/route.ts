import { NextResponse } from "next/server";
import { initKernel, forecastDemand, forecastSupply } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get("zone") || "East Legon";
  const hours = Number(searchParams.get("hours")) || 24;
  const type = searchParams.get("type") || "demand";
  if (type === "supply") return NextResponse.json(forecastSupply(zone, hours));
  return NextResponse.json(forecastDemand(zone, hours));
}
