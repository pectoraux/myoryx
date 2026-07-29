import { NextResponse } from "next/server";
import { initKernel, sandbox } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json(sandbox.all()); }
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "create") return NextResponse.json(sandbox.create(body.name));
  if (body.action === "replay") return NextResponse.json(sandbox.replayEvents(body.sessionId, body.filter));
  if (body.action === "simulateRide") return NextResponse.json(sandbox.simulateRide(body.sessionId, body.origin, body.destination, body.price));
  if (body.action === "runTests") return NextResponse.json(sandbox.runTests(body.sessionId, body.extensionId));
  return NextResponse.json({error:"unknown action"},{status:400});
}
