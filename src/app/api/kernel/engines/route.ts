import { NextResponse } from "next/server";
import { initKernel, composeRoutes, runReverseAuction, runNegotiation, checkRepricing, discoverPools, discoverCommutes, findReturnRides, speedAgentSolution, savingsAgentSolution, optimizeParcelRoute, composeSplitJourney } from "@/lib/kernel";

// POST — run any optimization engine
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { engine } = body;

  if (engine === "route") {
    const { km, profile, origin, destination } = body;
    return NextResponse.json(composeRoutes(km || 8.5, profile || "balanced", origin, destination));
  }
  if (engine === "auction") {
    const { startPrice, rounds, intensity } = body;
    return NextResponse.json(runReverseAuction(startPrice || 20, rounds || 5, intensity || 0.6));
  }
  if (engine === "negotiation") {
    const { openingPrice, buyerAggressiveness, sellerAggressiveness, maxRounds } = body;
    return NextResponse.json(runNegotiation(openingPrice || 20, buyerAggressiveness || 0.6, sellerAggressiveness || 0.5, maxRounds || 6));
  }
  if (engine === "repricing") {
    const { originalPrice, currentSurge } = body;
    return NextResponse.json(checkRepricing(originalPrice || 15, currentSurge || 1.3));
  }
  if (engine === "pools") {
    const { intent, candidates } = body;
    return NextResponse.json(discoverPools(intent, candidates || []));
  }
  if (engine === "commutes") {
    const { userPattern, candidatePatterns } = body;
    return NextResponse.json(discoverCommutes(userPattern, candidatePatterns || []));
  }
  if (engine === "returnRides") {
    const { origin, destination } = body;
    return NextResponse.json(findReturnRides(destination, origin));
  }
  if (engine === "agentCompare") {
    const { origin, destination, segments } = body;
    return NextResponse.json({
      speed: speedAgentSolution(origin, destination, segments),
      savings: savingsAgentSolution(origin, destination),
    });
  }
  if (engine === "parcel") {
    const { pickup, dropoff, size, deadlineHours } = body;
    return NextResponse.json(optimizeParcelRoute(pickup, dropoff, size || "small", deadlineHours || 4));
  }
  if (engine === "splitJourney") {
    const { segments, objective } = body;
    return NextResponse.json(composeSplitJourney(segments, objective || "speed"));
  }
  return NextResponse.json({ error: "unknown engine" }, { status: 400 });
}
