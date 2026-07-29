import { NextResponse } from "next/server";
import { initKernel, webhooks } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json(webhooks.all()); }
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "register") return NextResponse.json(webhooks.register(body.url, body.events));
  if (body.action === "deliver") { await webhooks.deliver(body.event, body.payload); return NextResponse.json({ok:true}); }
  return NextResponse.json({error:"unknown action"},{status:400});
}
