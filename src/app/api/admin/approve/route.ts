import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/admin/approve
 * Admin only — flips a waitlist user to active.
 * Body: { userId }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    if (!u || (u.isAdmin !== true && u.currentType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const userId = body?.userId;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { status: "active" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/approve POST]", err);
    return NextResponse.json(
      { error: "Failed to approve user" },
      { status: 500 }
    );
  }
}
