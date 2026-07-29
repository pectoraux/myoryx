import { NextResponse } from "next/server";
import { initKernel, pluginMonitor } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json({ entries: pluginMonitor.all(), health: pluginMonitor.health() }); }
