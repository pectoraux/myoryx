import { NextResponse } from "next/server";
import { initKernel, eventBus } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 50;
  return NextResponse.json(eventBus.recent(limit));
}
