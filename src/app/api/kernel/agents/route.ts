import { NextResponse } from "next/server";
import { initKernel, aiRuntime } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team") as "rider" | "driver" | "fleet" | null;
  const agents = team ? aiRuntime.byTeam(team) : aiRuntime.all();
  return NextResponse.json(
    agents.map((a) => ({
      ...a,
      active: aiRuntime.isActive(a.id),
      decisions: aiRuntime.getDecisions(a.id, 5),
    }))
  );
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { agentId, action } = body;
  if (action === "activate") aiRuntime.activate(agentId);
  if (action === "deactivate") aiRuntime.deactivate(agentId);
  return NextResponse.json({ ok: true, active: aiRuntime.isActive(agentId) });
}
