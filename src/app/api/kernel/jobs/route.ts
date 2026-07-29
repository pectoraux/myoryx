import { NextResponse } from "next/server";
import { initKernel, jobs } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(jobs.status());
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { type, payload, delayMs, maxAttempts } = body;
  const id = jobs.enqueue(type, payload, { delayMs, maxAttempts });
  return NextResponse.json({ ok: true, jobId: id });
}
