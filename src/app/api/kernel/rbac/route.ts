import { NextResponse } from "next/server";
import { initKernel, rbac } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (userId) {
    return NextResponse.json({
      userId,
      roles: rbac.getRoles(userId),
      tenant: rbac.getTenant(userId),
    });
  }
  return NextResponse.json({ error: "userId required" }, { status: 400 });
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { userId, role, action, permission, tenantId } = body;
  if (action === "assign") {
    rbac.assignRole(userId, role, tenantId || "default");
    return NextResponse.json({ ok: true, roles: rbac.getRoles(userId) });
  }
  if (action === "revoke") {
    rbac.revokeRole(userId, role);
    return NextResponse.json({ ok: true, roles: rbac.getRoles(userId) });
  }
  if (action === "check") {
    return NextResponse.json({ allowed: rbac.can(userId, permission) });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
