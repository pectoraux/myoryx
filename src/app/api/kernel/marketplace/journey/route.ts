import { NextResponse } from "next/server";
import { initKernel, npdEngine, fleetEngine, composeMixedJourney } from "@/lib/kernel";

// POST — compose mixed journeys combining NPDs, transit, walk, driver, fleet
export async function POST(req: Request) {
  initKernel();
  const body = await req.json();
  const { origin, destination } = body;
  const npdPubs = npdEngine.match(origin, destination);
  const fleetCapacity = fleetEngine.queryAvailableCapacity().map((f) => f.capacity);
  const journeys = composeMixedJourney(origin, destination, { npdPubs, fleetCapacity, includeTransit: true });
  return NextResponse.json(journeys);
}
