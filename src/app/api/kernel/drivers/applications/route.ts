import { NextResponse } from "next/server";
import { initKernel, driverOS } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get("driverId");
  return NextResponse.json(driverOS.getApplications(driverId || undefined));
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  driverOS.reviewApplication(body.applicationId, body.approved);
  return NextResponse.json({ ok: true });
}
