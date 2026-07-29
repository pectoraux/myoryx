import { NextResponse } from "next/server";
import { initKernel, versions } from "@/lib/kernel";
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const extId = searchParams.get("extensionId");
  if (extId) return NextResponse.json(versions.getVersions(extId));
  return NextResponse.json({ error: "extensionId required" }, { status: 400 });
}
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "publish") return NextResponse.json(versions.publish(body.extensionId, body.version, body.changelog));
  if (body.action === "deprecate") { versions.deprecate(body.extensionId, body.version); return NextResponse.json({ok:true}); }
  if (body.action === "yank") { versions.yank(body.extensionId, body.version); return NextResponse.json({ok:true}); }
  return NextResponse.json({error:"unknown action"},{status:400});
}
