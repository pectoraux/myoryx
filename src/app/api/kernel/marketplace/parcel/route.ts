import { NextResponse } from "next/server";
import { initKernel, parcelNetwork } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const parcelId = searchParams.get("id");
  if (parcelId) return NextResponse.json(parcelNetwork.getParcel(parcelId));
  const detail = searchParams.get("detail");
  if (detail === "batches") return NextResponse.json(parcelNetwork.allBatches());
  if (detail === "stats") return NextResponse.json(parcelNetwork.stats());
  return NextResponse.json(parcelNetwork.allParcels());
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "create") {
    return NextResponse.json(parcelNetwork.create(body.parcel));
  }
  if (body.action === "dispatch") {
    parcelNetwork.dispatch(body.parcelId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
