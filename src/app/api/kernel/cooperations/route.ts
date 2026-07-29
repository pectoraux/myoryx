import { NextResponse } from "next/server";
import { initKernel, aiRuntime } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(aiRuntime.getCooperations(30));
}
