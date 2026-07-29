import { NextResponse } from "next/server";
import { initKernel, tracer } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const traceId = searchParams.get("traceId");
  if (traceId) {
    return NextResponse.json(tracer.getTrace(traceId));
  }
  return NextResponse.json(tracer.recentSpans(50));
}
