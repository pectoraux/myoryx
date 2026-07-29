import { NextResponse } from "next/server";
import { initKernel, health } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(await health.check());
}
