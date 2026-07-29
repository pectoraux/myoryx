import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ providers: PROVIDERS });
}
