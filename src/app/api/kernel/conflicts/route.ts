import { NextResponse } from "next/server";
import { initKernel, planningEngine } from "@/lib/kernel";

// GET /api/kernel/conflicts?userId=demo — schedule conflict detection
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  return NextResponse.json(planningEngine.detectScheduleConflicts(userId));
}
