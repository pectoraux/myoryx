import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SEED = [
  { name: "Kwame A.", avatar: "KA", saved: 2841, rides: 312, streak: 47, change: 0 },
  { name: "Ama O.", avatar: "AO", saved: 2614, rides: 288, streak: 33, change: 1 },
  { name: "Yusuf I.", avatar: "YI", saved: 2403, rides: 271, streak: 41, change: -1 },
  { name: "Esi B.", avatar: "EB", saved: 2105, rides: 245, streak: 22, change: 2 },
  { name: "Daniel M.", avatar: "DM", saved: 1988, rides: 233, streak: 19, change: 0 },
  { name: "Fatima A.", avatar: "FA", saved: 1876, rides: 221, streak: 28, change: 3 },
  { name: "Kojo P.", avatar: "KP", saved: 1742, rides: 209, streak: 15, change: -2 },
  { name: "Akosua T.", avatar: "AT", saved: 1620, rides: 198, streak: 11, change: 1 },
];

export async function GET() {
  try {
    let rows = await db.leaderboardEntry.findMany({ orderBy: { saved: "desc" } });
    if (rows.length === 0) {
      await db.leaderboardEntry.createMany({
        data: SEED.map((s, i) => ({ ...s, rank: i + 1 })),
      });
      rows = await db.leaderboardEntry.findMany({ orderBy: { saved: "desc" } });
    }
    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return NextResponse.json(ranked);
  } catch (e) {
    return NextResponse.json(
      SEED.map((s, i) => ({ ...s, rank: i + 1, id: String(i + 1) })),
      { status: 200 }
    );
  }
}
