import { NextResponse } from "next/server";
import { initKernel, aiRuntime } from "@/lib/kernel";

// GET — list negotiations (active + recent)
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active") === "true";
  const data = active ? aiRuntime.getActiveNegotiations() : aiRuntime.getAllNegotiations(30);
  return NextResponse.json(data);
}
