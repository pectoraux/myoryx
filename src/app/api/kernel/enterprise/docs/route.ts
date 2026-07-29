import { NextResponse } from "next/server";
import { initKernel, docsGenerator, SDKS } from "@/lib/kernel";
export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const sdkId = searchParams.get("sdk");
  if (sdkId) { const sdk = SDKS.find(s => s.id === sdkId); return sdk ? NextResponse.json(docsGenerator.generateSDKDocs(sdk)) : NextResponse.json({error:"not found"},{status:404}); }
  if (searchParams.get("type") === "api") return NextResponse.json(docsGenerator.generateAPIDocs());
  return NextResponse.json({ sdks: SDKS.map(s => ({ id: s.id, name: s.name, version: s.version, description: s.description })) });
}
