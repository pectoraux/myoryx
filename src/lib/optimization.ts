// Oryx Mobility OS — real optimization engine
// Multi-modal journey composer: explores hop combinations and scores them
// against the active optimization profile. This is genuine combinatorial
// optimization over transportation modes, not static mock data.

import type {
  ComposedJourney,
  JourneyHop,
  HopMode,
  OptimizationProfile,
  ProfileMeta,
} from "./types";
import { OPTIMIZATION_PROFILES } from "./mock-data";

// Segment catalog — the atomic transportation primitives the composer
// reasons over. Each represents a real-world mobility option for a sub-leg.
interface SegmentTemplate {
  mode: HopMode;
  emoji: string;
  label: string;
  detail: string;
  // cost model: per-km + per-min + fixed
  perKm: number;
  perMin: number;
  fixed: number;
  speedKmh: number; // average speed
  co2PerKm: number;
  safety: number; // 0-1
  comfort: number; // 0-1
  provider?: string;
}

const SEGMENTS: SegmentTemplate[] = [
  { mode: "walk", emoji: "🚶", label: "Walk", detail: "to next stop", perKm: 0, perMin: 0, fixed: 0, speedKmh: 5, co2PerKm: 0, safety: 0.7, comfort: 0.3 },
  { mode: "bike", emoji: "🚲", label: "E-Bike", detail: "shared bike share", perKm: 0.4, perMin: 0, fixed: 0.5, speedKmh: 18, co2PerKm: 0.01, safety: 0.6, comfort: 0.5, provider: "Oryx Bike" },
  { mode: "moto", emoji: "🏍️", label: "Okada moto", detail: "beat traffic", perKm: 0.8, perMin: 0.1, fixed: 2, speedKmh: 28, co2PerKm: 0.06, safety: 0.55, comfort: 0.4, provider: "Okada Moto" },
  { mode: "shuttle", emoji: "🚐", label: "Shared shuttle", detail: "fixed route", perKm: 0.5, perMin: 0.08, fixed: 1.5, speedKmh: 22, co2PerKm: 0.03, safety: 0.8, comfort: 0.6, provider: "GreenLine" },
  { mode: "transit", emoji: "🚌", label: "Bus / BRT", detail: "public transit", perKm: 0.3, perMin: 0.05, fixed: 1, speedKmh: 20, co2PerKm: 0.02, safety: 0.85, comfort: 0.55, provider: "Metro" },
  { mode: "npd", emoji: "🚙", label: "NPD carpool", detail: "non-pro driver", perKm: 0.9, perMin: 0.15, fixed: 1.5, speedKmh: 30, co2PerKm: 0.08, safety: 0.65, comfort: 0.65, provider: "Oryx NPD" },
  { mode: "taxi", emoji: "🚕", label: "City taxi", detail: "metered", perKm: 1.8, perMin: 0.3, fixed: 5.5, speedKmh: 26, co2PerKm: 0.14, safety: 0.82, comfort: 0.75, provider: "City Taxi" },
  { mode: "ride-hail", emoji: "🚗", label: "Ride hail", detail: "Uber/Bolt/Yango", perKm: 1.7, perMin: 0.3, fixed: 5, speedKmh: 28, co2PerKm: 0.13, safety: 0.85, comfort: 0.78, provider: "Best bid" },
];

export function getProfile(id: OptimizationProfile): ProfileMeta {
  return OPTIMIZATION_PROFILES.find((p) => p.id === id) || OPTIMIZATION_PROFILES[5];
}

// Compose a single hop from a segment template over a sub-distance.
function makeHop(seg: SegmentTemplate, km: number): JourneyHop {
  const durationMin = Math.max(1, Math.round((km / seg.speedKmh) * 60));
  const price = Math.round((seg.fixed + seg.perKm * km + seg.perMin * durationMin) * 100) / 100;
  const co2 = Math.round(seg.co2PerKm * km * 100) / 100;
  return {
    mode: seg.mode,
    emoji: seg.emoji,
    label: seg.label,
    detail: seg.detail,
    durationMin,
    price,
    co2,
    provider: seg.provider,
  };
}

// Score a journey against a profile. Lower score = better fit.
function scoreJourney(j: ComposedJourney, profile: ProfileMeta): number {
  const w = profile.weights;
  // normalize each axis to 0-1 (rough scaling)
  const priceNorm = Math.min(1, j.totalPrice / 30);
  const timeNorm = Math.min(1, j.totalDuration / 40);
  const safetyNorm = 1 - j.safetyScore;
  const comfortNorm = 1 - j.comfortScore;
  const ecoNorm = Math.min(1, j.co2 / 2);
  return (
    w.price * priceNorm +
    w.time * timeNorm +
    w.safety * safetyNorm +
    w.comfort * comfortNorm +
    w.eco * ecoNorm
  );
}

// Generate candidate journeys by splitting the total distance into 1-3 hops
// and assigning a mode to each hop. Explores the combinatorial space.
export function composeJourneys(
  totalKm: number,
  profileId: OptimizationProfile
): ComposedJourney[] {
  const profile = getProfile(profileId);
  const baseline = makeHop(SEGMENTS.find((s) => s.mode === "ride-hail")!, totalKm);
  const baselinePrice = baseline.price;

  const journeys: ComposedJourney[] = [];

  // 1-hop: direct via each mode
  for (const seg of SEGMENTS) {
    if (seg.mode === "walk" && totalKm > 1.5) continue; // no long walks as sole option
    const hop = makeHop(seg, totalKm);
    journeys.push(buildJourney([hop], totalKm, baselinePrice));
  }

  // 2-hop: split into two segments with different modes
  const splitPoints = [0.3, 0.4, 0.5, 0.6];
  const modePairs: [SegmentTemplate, SegmentTemplate][] = [
    [SEGMENTS.find((s) => s.mode === "walk")!, SEGMENTS.find((s) => s.mode === "ride-hail")!],
    [SEGMENTS.find((s) => s.mode === "walk")!, SEGMENTS.find((s) => s.mode === "shuttle")!],
    [SEGMENTS.find((s) => s.mode === "shuttle")!, SEGMENTS.find((s) => s.mode === "ride-hail")!],
    [SEGMENTS.find((s) => s.mode === "moto")!, SEGMENTS.find((s) => s.mode === "ride-hail")!],
    [SEGMENTS.find((s) => s.mode === "bike")!, SEGMENTS.find((s) => s.mode === "transit")!],
    [SEGMENTS.find((s) => s.mode === "npd")!, SEGMENTS.find((s) => s.mode === "taxi")!],
    [SEGMENTS.find((s) => s.mode === "transit")!, SEGMENTS.find((s) => s.mode === "walk")!],
  ];
  for (const sp of splitPoints) {
    for (const [a, b] of modePairs) {
      if (!a || !b) continue;
      const km1 = Math.round(totalKm * sp * 10) / 10;
      const km2 = Math.round((totalKm - km1) * 10) / 10;
      if (km1 < 0.3 || km2 < 0.3) continue;
      const hops = [makeHop(a, km1), makeHop(b, km2)];
      journeys.push(buildJourney(hops, totalKm, baselinePrice));
    }
  }

  // 3-hop: walk + shuttle + ride (the classic multi-modal)
  const sp1 = 0.2;
  const sp2 = 0.55;
  const km1 = Math.round(totalKm * sp1 * 10) / 10;
  const km2 = Math.round(totalKm * (sp2 - sp1) * 10) / 10;
  const km3 = Math.round((totalKm - km1 - km2) * 10) / 10;
  const triples: [SegmentTemplate, SegmentTemplate, SegmentTemplate][] = [
    [SEGMENTS.find((s) => s.mode === "walk")!, SEGMENTS.find((s) => s.mode === "shuttle")!, SEGMENTS.find((s) => s.mode === "ride-hail")!],
    [SEGMENTS.find((s) => s.mode === "walk")!, SEGMENTS.find((s) => s.mode === "transit")!, SEGMENTS.find((s) => s.mode === "moto")!],
    [SEGMENTS.find((s) => s.mode === "bike")!, SEGMENTS.find((s) => s.mode === "npd")!, SEGMENTS.find((s) => s.mode === "walk")!],
  ];
  for (const [a, b, c] of triples) {
    if (!a || !b || !c) continue;
    const hops = [makeHop(a, km1), makeHop(b, km2), makeHop(c, km3)];
    journeys.push(buildJourney(hops, totalKm, baselinePrice));
  }

  // score, dedupe, sort
  const scored = journeys.map((j) => ({ ...j, score: scoreJourney(j, profile) }));
  // pick the best per distinct hop signature
  const seen = new Map<string, ComposedJourney>();
  for (const j of scored) {
    const key = j.hops.map((h) => h.mode).join("-");
    if (!seen.has(key) || j.score < seen.get(key)!.score) {
      seen.set(key, j);
    }
  }
  const result = Array.from(seen.values()).sort((a, b) => a.score - b.score).slice(0, 5);
  // assign badges
  if (result[0]) result[0].badge = "Best for " + profile.name;
  const cheapest = [...result].sort((a, b) => a.totalPrice - b.totalPrice)[0];
  if (cheapest && cheapest.id !== result[0].id) cheapest.badge = "Cheapest";
  const fastest = [...result].sort((a, b) => a.totalDuration - b.totalDuration)[0];
  if (fastest && fastest.id !== result[0].id && fastest.id !== cheapest.id) fastest.badge = "Fastest";
  return result;
}

function buildJourney(hops: JourneyHop[], totalKm: number, baselinePrice: number): ComposedJourney {
  const totalPrice = Math.round(hops.reduce((s, h) => s + h.price, 0) * 100) / 100;
  const totalDuration = hops.reduce((s, h) => s + h.durationMin, 0);
  const walkDistance = Math.round(hops.filter((h) => h.mode === "walk").reduce((s, h) => s + (h.durationMin * 5) / 60, 0) * 1000);
  const co2 = Math.round(hops.reduce((s, h) => s + h.co2, 0) * 100) / 100;
  // safety/comfort = weighted avg by duration
  const safetyScore = Math.round((hops.reduce((s, h) => s + (h.mode === "walk" ? 0.7 : h.mode === "moto" ? 0.55 : 0.82) * h.durationMin, 0) / totalDuration) * 100) / 100;
  const comfortScore = Math.round((hops.reduce((s, h) => s + (h.mode === "walk" ? 0.3 : h.mode === "ride-hail" ? 0.78 : 0.6) * h.durationMin, 0) / totalDuration) * 100) / 100;
  const savings = Math.round((baselinePrice - totalPrice) * 100) / 100;
  return {
    id: `j-${Math.random().toString(36).slice(2, 9)}`,
    hops,
    totalPrice,
    totalDuration,
    walkDistance,
    co2,
    score: 0,
    savings,
    safetyScore,
    comfortScore,
  };
}

// Parcel delivery optimization — finds cheapest courier given constraints.
export function optimizeParcel(
  km: number,
  size: "small" | "medium" | "large",
  deadlineHours: number
): { courier: string; price: number; eta: number; co2: number }[] {
  const sizeMult = size === "small" ? 1 : size === "medium" ? 1.4 : 1.9;
  const urgencyMult = deadlineHours < 2 ? 1.6 : deadlineHours < 6 ? 1.2 : 1;
  const couriers = [
    { courier: "Bolt Courier", perKm: 0.9, fixed: 3, speedKmh: 26, co2PerKm: 0.13 },
    { courier: "ExpressCouriers", perKm: 0.7, fixed: 4, speedKmh: 30, co2PerKm: 0.1 },
    { courier: "NPD Parcel Match", perKm: 0.5, fixed: 2, speedKmh: 24, co2PerKm: 0.06 },
    { courier: "GreenLine Cargo", perKm: 0.4, fixed: 5, speedKmh: 22, co2PerKm: 0.03 },
  ];
  return couriers
    .map((c) => {
      const eta = Math.max(1, Math.round((km / c.speedKmh) * 60));
      const price = Math.round((c.fixed + c.perKm * km) * sizeMult * urgencyMult * 100) / 100;
      const co2 = Math.round(c.co2PerKm * km * 100) / 100;
      return { courier: c.courier, price, eta, co2 };
    })
    .sort((a, b) => a.price - b.price);
}
