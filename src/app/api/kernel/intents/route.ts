import { NextResponse } from "next/server";
import { initKernel, planningEngine } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  return NextResponse.json(planningEngine.getIntents(userId));
}
