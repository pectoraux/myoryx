import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/user/type
 * Requires a session. Switches the current user's currentType — but only
 * to a type that already exists in their `types` CSV.
 * Body: { type }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await req.json().catch(() => null);
    const type = body?.type;
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const types = user.types.split(",").map((t) => t.trim()).filter(Boolean);
    if (!types.includes(type)) {
      return NextResponse.json(
        { error: `You don't have the "${type}" role` },
        { status: 403 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: { currentType: type },
    });

    return NextResponse.json({ ok: true, currentType: type });
  } catch (err) {
    console.error("[user/type POST]", err);
    return NextResponse.json(
      { error: "Failed to update type" },
      { status: 500 }
    );
  }
}
