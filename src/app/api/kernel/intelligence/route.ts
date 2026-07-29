import { NextResponse } from "next/server";
import { initKernel, computeIntelligenceDashboard } from "@/lib/kernel";

// GET — the flagship Intelligence Dashboard
export async function GET() {
  initKernel();
  return NextResponse.json(computeIntelligenceDashboard());
}
