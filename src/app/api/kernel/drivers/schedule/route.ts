import { NextResponse } from "next/server";
import { initKernel, driverOS } from "@/lib/kernel";

// GET — build AI schedule for a driver
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get("driverId");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  if (!driverId) return NextResponse.json({ error: "driverId required" }, { status: 400 });
  return NextResponse.json(driverOS.buildSchedule(driverId, date));
}
