import { NextResponse } from "next/server";
import { initKernel, oauth } from "@/lib/kernel";
export async function GET() { initKernel(); return NextResponse.json(oauth.allClients()); }
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  if (body.action === "register") return NextResponse.json(oauth.registerClient(body.config));
  if (body.action === "authorize") { const t = oauth.authorize(body.clientId, body.scopes); return t ? NextResponse.json(t) : NextResponse.json({error:"invalid client"},{status:400}); }
  if (body.action === "validate") { const t = oauth.validateToken(body.accessToken); return t ? NextResponse.json(t) : NextResponse.json({valid:false},{status:401}); }
  if (body.action === "refresh") { const t = oauth.refreshToken(body.refreshToken); return t ? NextResponse.json(t) : NextResponse.json({error:"invalid token"},{status:401}); }
  return NextResponse.json({error:"unknown action"},{status:400});
}
