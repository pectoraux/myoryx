import { NextResponse } from "next/server";
import { initKernel, certification } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json({ requirements: certification.requirements() }); }
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "certify") return NextResponse.json(certification.certify(body.connectorId, body.connectorName));
  return NextResponse.json({error:"unknown action"},{status:400});
}
