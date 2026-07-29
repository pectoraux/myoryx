import { NextResponse } from "next/server";
import { initKernel, graph } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(graph.stats());
}
