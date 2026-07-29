import { NextResponse } from "next/server";
import { initKernel, merchantEngine } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get("merchantId");
  if (merchantId) return NextResponse.json(merchantEngine.getOrders(merchantId));
  const detail = searchParams.get("detail");
  if (detail === "stats") return NextResponse.json(merchantEngine.stats());
  return NextResponse.json({ merchants: merchantEngine.all(), stats: merchantEngine.stats() });
}

// Merchant API: orders from merchant sites auto-generate parcel intents
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "register") {
    return NextResponse.json(merchantEngine.register(body.merchant));
  }
  if (body.action === "createOrder") {
    return NextResponse.json(merchantEngine.createOrder(body.order));
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
