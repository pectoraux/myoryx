import { NextResponse } from "next/server";
import { initKernel, compliance, COUNTRY_CONFIGS, REGULATORY_RULES, runSecurityAudit, disasterRecovery, rateLimiter } from "@/lib/kernel";

export async function GET(req: Request) {
  initKernel();
  const { searchParams } = new URL(req.url);
  const detail = searchParams.get("detail");
  if (detail === "security") return NextResponse.json(runSecurityAudit());
  if (detail === "disaster") return NextResponse.json(disasterRecovery);
  if (detail === "rateLimits") return NextResponse.json(rateLimiter.getConfigs());
  if (detail === "retention") return NextResponse.json(compliance.getDataRetentionPolicy());
  const country = searchParams.get("country");
  if (country) return NextResponse.json({ country: compliance.getCountry(country), rules: compliance.getRules(country) });
  return NextResponse.json({ countries: COUNTRY_CONFIGS, rules: REGULATORY_RULES });
}
