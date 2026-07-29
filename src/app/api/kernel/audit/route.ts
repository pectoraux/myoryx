import { NextResponse } from "next/server";
import { initKernel, audit } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 50;
  const actor = searchParams.get("actor");
  const resource = searchParams.get("resource");
  const entries = actor
    ? audit.byActor(actor, limit)
    : resource
    ? audit.byResource(resource, limit)
    : audit.recent(limit);
  return NextResponse.json(entries);
}
