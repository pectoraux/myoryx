import { NextResponse } from "next/server";
import { initKernel, planningEngine, generateId } from "@/lib/kernel";
import type { CalendarView } from "@/lib/kernel/types";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  const view = searchParams.get("view") as CalendarView | null;
  return NextResponse.json(planningEngine.getEvents(userId, view || undefined));
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const userId = body.userId || "demo";
  const event = {
    id: generateId("cev"),
    userId,
    title: body.title,
    view: (body.view as CalendarView) || "short_notice",
    origin: body.origin,
    destination: body.destination,
    start: body.start,
    end: body.end,
    allDay: body.allDay,
    recurring: body.recurring,
    priority: body.priority || "normal",
    constraints: body.constraints,
    notes: body.notes,
    optimized: false,
    createdAt: Date.now(),
  };
  planningEngine.addEvent(event);
  return NextResponse.json({ ok: true, event });
}

export async function DELETE(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  planningEngine.removeEvent(id);
  return NextResponse.json({ ok: true });
}
