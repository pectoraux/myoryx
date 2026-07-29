import { NextResponse } from "next/server";
import { initKernel, SDKS } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json(SDKS); }
