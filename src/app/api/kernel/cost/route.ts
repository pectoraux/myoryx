import { NextResponse } from "next/server";
import { initKernel, planningEngine } from "@/lib/kernel";

// GET /api/kernel/cost?intentId=... — cost-over-time prediction for an intent
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get("intentId");
  if (!intentId) return NextResponse.json({ error: "intentId required" }, { status: 400 });
  const cost = planningEngine.getCostOverTime(intentId);
  return NextResponse.json(cost || { error: "intent not found" }, cost ? {} : { status: 404 });
}
