import { NextResponse } from "next/server";
import { initKernel, featureFlags } from "@/lib/kernel";
import type { FeatureFlag } from "@/lib/kernel/types";

export async function GET() {
  initKernel();
  return NextResponse.json(featureFlags.all());
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { flag, enabled } = body as { flag: FeatureFlag; enabled: boolean };
  featureFlags.set(flag, enabled);
  return NextResponse.json({ ok: true, flag, enabled });
}
