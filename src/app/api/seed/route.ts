import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * GET /api/seed
 * Idempotent — creates the demo + admin accounts if they don't already
 * exist. Safe to call on every AuthScreen mount.
 */
export async function GET() {
  try {
    const seeded: string[] = [];

    const demoEmail = "demo@oryx.app";
    const adminEmail = "ekontetevi@gmail";

    const existingDemo = await db.user.findUnique({ where: { email: demoEmail } });
    if (!existingDemo) {
      await db.user.create({
        data: {
          email: demoEmail,
          name: "Oryx Demo",
          password: await bcrypt.hash("demo1234", 10),
          types: "rider,driver,fleet,merchant,courier,npd,admin",
          currentType: "rider",
          status: "active",
          isDemo: true,
          isAdmin: false,
        },
      });
      seeded.push(demoEmail);
    }

    const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: adminEmail,
          name: "Oryx Admin",
          password: await bcrypt.hash("Payswap123456", 10),
          types: "admin",
          currentType: "admin",
          status: "active",
          isDemo: false,
          isAdmin: true,
        },
      });
      seeded.push(adminEmail);
    }

    return NextResponse.json({ ok: true, seeded });
  } catch (err) {
    console.error("[seed GET]", err);
    return NextResponse.json(
      { error: "Failed to seed accounts" },
      { status: 500 }
    );
  }
}
