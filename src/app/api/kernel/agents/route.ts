import { NextResponse } from "next/server";
import { initKernel, aiRuntime } from "@/lib/kernel";

// GET — list all agents with full memory (status, config, metrics, decisions, tasks, learned)
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team") as "rider" | "driver" | "fleet" | "merchant" | null;
  const detail = searchParams.get("detail");

  // single agent detail
  if (detail === "full" && searchParams.get("agentId")) {
    const agentId = searchParams.get("agentId")!;
    return NextResponse.json(aiRuntime.getAgentWithMemory(agentId));
  }

  const agents = team ? aiRuntime.byTeam(team) : aiRuntime.all();
  return NextResponse.json(
    agents.map((a) => aiRuntime.getAgentWithMemory(a.id)).filter(Boolean)
  );
}

// POST — agent actions: activate, deactivate, configure, enqueueTask, startNegotiation, delegate
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { agentId, action } = body;

  if (action === "activate") {
    aiRuntime.activate(agentId);
    return NextResponse.json({ ok: true, active: aiRuntime.isActive(agentId) });
  }
  if (action === "deactivate") {
    aiRuntime.deactivate(agentId);
    return NextResponse.json({ ok: true, active: aiRuntime.isActive(agentId) });
  }
  if (action === "configure") {
    aiRuntime.updateConfig(agentId, body.updates);
    return NextResponse.json({ ok: true, config: aiRuntime.getConfig(agentId) });
  }
  if (action === "enqueueTask") {
    const taskId = aiRuntime.enqueueTask(
      agentId,
      body.type,
      body.description,
      body.input || {},
      body.intentId
    );
    return NextResponse.json({ ok: true, taskId });
  }
  if (action === "startNegotiation") {
    const negId = aiRuntime.startNegotiation(
      agentId,
      body.sellerAgentId,
      body.asset,
      body.openingPrice
    );
    return NextResponse.json({ ok: true, negotiationId: negId });
  }
  if (action === "delegate") {
    const taskId = aiRuntime.delegateTask(
      agentId,
      body.toAgentId,
      body.type,
      body.description,
      body.input || {}
    );
    return NextResponse.json({ ok: true, taskId });
  }
  if (action === "shareInfo") {
    aiRuntime.shareInformation(agentId, body.toAgentId, body.topic, body.fact);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
