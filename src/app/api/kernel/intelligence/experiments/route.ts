import { NextResponse } from "next/server";
import { initKernel, experiments } from "@/lib/kernel";

export async function GET() { initKernel(); return NextResponse.json(experiments.all()); }
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  return NextResponse.json(experiments.create(body.name, body.description, body.variants));
}
