import { NextResponse } from "next/server";
import { initKernel, sagas } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json({
    active: sagas.active(),
    all: sagas.all(),
  });
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { type, data } = body;
  const id = sagas.start(type, data);
  return NextResponse.json({ ok: true, sagaId: id });
}
