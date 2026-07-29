import { NextResponse } from "next/server";
import { initKernel, inspectGraph, inspectAITraces, replayOptimization } from "@/lib/kernel";
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const tool = searchParams.get("tool");
  if (tool === "graph") return NextResponse.json(inspectGraph());
  if (tool === "ai") return NextResponse.json(inspectAITraces(searchParams.get("agentId") || undefined));
  if (tool === "replay") { const r = replayOptimization(searchParams.get("intentId")!); return r ? NextResponse.json(r) : NextResponse.json({error:"not found"},{status:404}); }
  return NextResponse.json({ error: "tool required (graph|ai|replay)" }, { status: 400 });
}
