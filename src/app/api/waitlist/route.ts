import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/waitlist
 * Public — creates a waitlist user (status="waitlist").
 * Body: { email, name, password }
 * Returns 409 if the email already exists.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        types: "rider",
        currentType: "rider",
        status: "waitlist",
        isDemo: false,
        isAdmin: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist POST]", err);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist
 * Admin only — returns waitlist users plus aggregate counts for the
 * admin dashboard.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    if (!u || (u.isAdmin !== true && u.currentType !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [users, total, active, waitlist] = await Promise.all([
      db.user.findMany({
        where: { status: "waitlist" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          name: true,
          types: true,
          status: true,
          createdAt: true,
        },
      }),
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "waitlist" } }),
    ]);

    return NextResponse.json({
      users,
      counts: { total, active, waitlist },
    });
  } catch (err) {
    console.error("[waitlist GET]", err);
    return NextResponse.json(
      { error: "Failed to load waitlist" },
      { status: 500 }
    );
  }
}
