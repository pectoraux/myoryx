import { NextResponse } from "next/server";
import { initKernel, connectors } from "@/lib/kernel";

// POST /api/kernel/webhook/:connectorId — external systems push events here
export async function POST(
  req: Request,
  { params }: { params: Promise<{ connectorId: string }> }
) {
  initKernel();
  const { connectorId } = await params;
  const payload = await req.json().catch(() => ({}));
  const ok = connectors.ingestWebhook(connectorId, payload);
  if (!ok) {
    return NextResponse.json({ error: "connector not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ingested: true });
}
