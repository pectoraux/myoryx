import { NextResponse } from "next/server";
import { initKernel, npdEngine } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  if (origin && destination) {
    return NextResponse.json(npdEngine.match(origin, destination));
  }
  return NextResponse.json(npdEngine.open());
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "publish") {
    return NextResponse.json(npdEngine.publish(body.publication));
  }
  if (body.action === "book") {
    return NextResponse.json({ ok: npdEngine.bookSeat(body.publicationId) });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
