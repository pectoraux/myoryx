import { NextResponse } from "next/server";
import { initKernel, metrics, logger } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const detail = searchParams.get("detail");
  if (detail === "logs") {
    const level = searchParams.get("level") as any;
    return NextResponse.json(logger.recent(100, level));
  }
  if (detail === "history") {
    return NextResponse.json(metrics.recent(50));
  }
  return NextResponse.json(metrics.snapshot());
}
