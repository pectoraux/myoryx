import { NextResponse } from "next/server";
import { initKernel, plugins } from "@/lib/kernel";

export async function GET() {
  initKernel();
  return NextResponse.json(plugins.all());
}

export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { action, manifest } = body;
  if (action === "install") {
    plugins.install(manifest);
    return NextResponse.json({ ok: true });
  }
  if (action === "uninstall") {
    plugins.uninstall(manifest.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "hotReload") {
    plugins.hotReload(manifest);
    return NextResponse.json({ ok: true });
  }
  if (action === "enable") {
    plugins.enable(manifest.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "disable") {
    plugins.disable(manifest.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
