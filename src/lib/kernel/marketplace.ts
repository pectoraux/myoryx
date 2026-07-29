// Oryx Mobility Kernel — Unified Marketplace (M16-M18)
// NPDs, Fleet Connectors, Parcel Network, Merchant APIs, and Mixed Journey
// Composition. This module extends Oryx into a unified mobility marketplace
// where drivers, NPDs, fleets, couriers, and merchants all participate.

import type {
  FleetCapacity,
  FleetConnector,
  MerchantAccount,
  MerchantOrder,
  MixedJourney,
  MixedJourneyHop,
  NPDPublication,
  ParcelAuction,
  ParcelBatch,
  ParcelBid,
  ParcelIntent,
  ParcelSize,
  ParcelUrgency,
} from "./types";
import { generateId, eventBus, createEvent } from "./event-bus";
import { routeDistanceKm } from "./engines";

// ===========================================================================
// NPD Engine — Non-Playable Drivers publish routes, seats, returns
// ===========================================================================

class NPDEngine {
  private publications = new Map<string, NPDPublication>();

  publish(pub: Omit<NPDPublication, "id" | "createdAt" | "seatsTaken" | "matchPct" | "status">): NPDPublication {
    const publication: NPDPublication = {
      ...pub,
      id: generateId("npd"),
      seatsTaken: 0,
      matchPct: 0,
      status: "open",
      createdAt: Date.now(),
    };
    this.publications.set(publication.id, publication);
    eventBus.publish([
      createEvent("npd.published", publication.id, {
        npdName: publication.npdName,
        origin: publication.origin,
        destination: publication.destination,
        seats: publication.seats,
        price: publication.price,
      }, undefined, undefined),
    ]);
    return publication;
  }

  // match NPDs to a rider's route
  match(riderOrigin: string, riderDestination: string, riderTime?: string): NPDPublication[] {
    const matches: NPDPublication[] = [];
    for (const pub of this.publications.values()) {
      if (pub.status !== "open" || pub.seatsTaken >= pub.seats) continue;
      // route overlap
      const originMatch = pub.origin.toLowerCase().includes(riderOrigin.toLowerCase().split(" ")[0]) ||
        riderOrigin.toLowerCase().includes(pub.origin.toLowerCase().split(" ")[0]);
      const destMatch = pub.destination.toLowerCase().includes(riderDestination.toLowerCase().split(" ")[0]) ||
        riderDestination.toLowerCase().includes(pub.destination.toLowerCase().split(" ")[0]);
      // partial match: rider's origin or destination is on the NPD's route waypoints
      const waypointMatch = pub.routeWaypoints.some(
        (w) => w.toLowerCase().includes(riderOrigin.toLowerCase().split(" ")[0]) ||
          w.toLowerCase().includes(riderDestination.toLowerCase().split(" ")[0])
      );
      const matchPct = (originMatch ? 50 : 0) + (destMatch ? 50 : 0) + (waypointMatch ? 20 : 0);
      if (matchPct < 30) continue;
      pub.matchPct = Math.min(100, matchPct);
      matches.push(pub);
    }
    return matches.sort((a, b) => b.matchPct - a.matchPct);
  }

  bookSeat(publicationId: string): boolean {
    const pub = this.publications.get(publicationId);
    if (!pub || pub.seatsTaken >= pub.seats) return false;
    pub.seatsTaken++;
    if (pub.seatsTaken >= pub.seats) pub.status = "matched";
    eventBus.publish([
      createEvent("npd.seat_booked", publicationId, { npdName: pub.npdName, seatsLeft: pub.seats - pub.seatsTaken }, undefined, undefined),
    ]);
    return true;
  }

  all(): NPDPublication[] {
    return Array.from(this.publications.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  open(): NPDPublication[] {
    return this.all().filter((p) => p.status === "open");
  }
}

export const npdEngine = new NPDEngine();

// ===========================================================================
// Fleet Connector Framework — expose capacity via connector APIs
// ===========================================================================

class FleetEngine {
  private fleets = new Map<string, FleetConnector>();

  connect(fleet: Omit<FleetConnector, "lastSyncAt" | "eventsProcessed">): FleetConnector {
    const connector: FleetConnector = {
      ...fleet,
      lastSyncAt: Date.now(),
      eventsProcessed: 0,
    };
    this.fleets.set(fleet.id, connector);
    eventBus.publish([
      createEvent("fleet.connected", fleet.id, { fleetName: fleet.fleetName, vehicles: fleet.vehicleCount, zones: fleet.zones }, undefined, undefined),
    ]);
    return connector;
  }

  disconnect(fleetId: string): void {
    const fleet = this.fleets.get(fleetId);
    if (fleet) fleet.connected = false;
  }

  // sync capacity from a fleet's connector API
  syncCapacity(fleetId: string, capacity: FleetCapacity[]): void {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return;
    fleet.capacity = capacity;
    fleet.lastSyncAt = Date.now();
    fleet.eventsProcessed++;
    eventBus.publish([
      createEvent("fleet.capacity_synced", fleetId, {
        fleetName: fleet.fleetName,
        availableVehicles: capacity.filter((c) => c.available).length,
        totalVehicles: capacity.length,
      }, undefined, undefined),
    ]);
  }

  // query available capacity across all connected fleets
  queryAvailableCapacity(zone?: string, vehicleType?: string): Array<{ fleet: FleetConnector; capacity: FleetCapacity }> {
    const results: Array<{ fleet: FleetConnector; capacity: FleetCapacity }> = [];
    for (const fleet of this.fleets.values()) {
      if (!fleet.connected) continue;
      for (const cap of fleet.capacity) {
        if (!cap.available) continue;
        if (zone && !cap.currentZone.toLowerCase().includes(zone.toLowerCase())) continue;
        if (vehicleType && cap.vehicleType !== vehicleType) continue;
        results.push({ fleet, capacity: cap });
      }
    }
    return results.sort((a, b) => a.capacity.etaMin - b.capacity.etaMin);
  }

  // fleet marketplace: fleets participate in liquidity pools
  joinLiquidityPool(fleetId: string, poolId: string): void {
    eventBus.publish([
      createEvent("fleet.joined_pool", fleetId, { fleetId, poolId }, undefined, undefined),
    ]);
  }

  all(): FleetConnector[] {
    return Array.from(this.fleets.values());
  }

  connected(): FleetConnector[] {
    return this.all().filter((f) => f.connected);
  }

  stats() {
    const all = this.all();
    return {
      totalFleets: all.length,
      connected: all.filter((f) => f.connected).length,
      totalVehicles: all.reduce((s, f) => s + f.vehicleCount, 0),
      availableVehicles: all.reduce((s, f) => s + f.capacity.filter((c) => c.available).length, 0),
      avgUtilization: Math.round(all.reduce((s, f) => s + f.utilizationPct, 0) / Math.max(1, all.length)),
    };
  }
}

export const fleetEngine = new FleetEngine();

// ===========================================================================
// Parcel Network — marketplace, auctions, pooling, batching, routing
// ===========================================================================

class ParcelNetwork {
  private parcels = new Map<string, ParcelIntent>();
  private auctions = new Map<string, ParcelAuction>();
  private batches = new Map<string, ParcelBatch>();

  // --- Parcel creation ---------------------------------------------------

  create(parcel: Omit<ParcelIntent, "id" | "createdAt" | "updatedAt" | "status" | "trackingHistory" | "quotedPrice"> & { quotedPrice?: number }): ParcelIntent {
    const km = routeDistanceKm(parcel.pickup, parcel.dropoff);
    const sizeMult = parcel.size === "small" ? 1 : parcel.size === "medium" ? 1.4 : parcel.size === "large" ? 1.9 : 2.5;
    const urgencyMult = parcel.urgency === "express" ? 1.5 : parcel.urgency === "same_day" ? 1.3 : parcel.urgency === "scheduled" ? 0.9 : 1;
    const quotedPrice = parcel.quotedPrice || Math.round((3 + 0.7 * km) * sizeMult * urgencyMult * 100) / 100;

    const intent: ParcelIntent = {
      ...parcel,
      id: generateId("parcel"),
      quotedPrice,
      status: "created",
      trackingHistory: [{
        id: generateId("trk"),
        status: "created",
        location: parcel.pickup,
        timestamp: Date.now(),
        note: "Parcel intent created",
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.parcels.set(intent.id, intent);
    eventBus.publish([
      createEvent("parcel.created", intent.id, {
        pickup: intent.pickup, dropoff: intent.dropoff, size: intent.size, quotedPrice,
        merchantId: intent.merchantId,
      }, undefined, undefined),
    ]);
    // auto-optimize: start auction + check batching
    this.startAuction(intent.id);
    this.checkBatching(intent);
    return intent;
  }

  // --- Parcel auctions (couriers bid for delivery) -----------------------

  startAuction(parcelId: string): ParcelAuction {
    const parcel = this.parcels.get(parcelId);
    if (!parcel) throw new Error("Parcel not found");
    const openingPrice = parcel.quotedPrice;
    const auction: ParcelAuction = {
      id: generateId("pauc"),
      parcelId,
      openingPrice,
      currentBestPrice: openingPrice,
      bids: [],
      rounds: 0,
      status: "open",
    };
    // generate courier bids — real couriers with different cost models
    const couriers = [
      { id: "bolt-courier", name: "Bolt Courier", type: "fleet" as const, rating: 4.6, perKm: 0.9, fixed: 3, speed: 26, co2: 0.13 },
      { id: "express", name: "ExpressCouriers", type: "fleet" as const, rating: 4.7, perKm: 0.7, fixed: 4, speed: 30, co2: 0.1 },
      { id: "npd-parcel", name: "NPD Parcel Match", type: "npd" as const, rating: 4.4, perKm: 0.5, fixed: 2, speed: 24, co2: 0.06 },
      { id: "greenline", name: "GreenLine Cargo", type: "fleet" as const, rating: 4.5, perKm: 0.4, fixed: 5, speed: 22, co2: 0.03 },
      { id: "oryx-fleet", name: "Oryx Fleet Pool", type: "fleet" as const, rating: 4.8, perKm: 0.6, fixed: 3.5, speed: 28, co2: 0.08 },
    ];
    const km = routeDistanceKm(parcel.pickup, parcel.dropoff);
    const sizeMult = parcel.size === "small" ? 1 : parcel.size === "medium" ? 1.4 : parcel.size === "large" ? 1.9 : 2.5;
    for (const c of couriers) {
      const eta = Math.max(1, Math.round((km / c.speed) * 60));
      const price = Math.round((c.fixed + c.perKm * km) * sizeMult * 100) / 100;
      const co2 = Math.round(c.co2 * km * 100) / 100;
      const bid: ParcelBid = {
        id: generateId("bid"),
        courierId: c.id,
        courierName: c.name,
        courierType: c.type,
        courierRating: c.rating,
        price,
        eta,
        co2,
        timestamp: Date.now(),
      };
      auction.bids.push(bid);
      if (price < auction.currentBestPrice) auction.currentBestPrice = price;
    }
    auction.bids.sort((a, b) => a.price - b.price);
    auction.winningBid = auction.bids[0];
    auction.rounds = 1;
    auction.status = "settled";
    auction.settledAt = Date.now();
    // update parcel
    parcel.auctionId = auction.id;
    parcel.finalPrice = auction.winningBid?.price;
    parcel.courier = auction.winningBid?.courierName;
    parcel.courierRating = auction.winningBid?.courierRating;
    parcel.status = "optimizing";
    parcel.updatedAt = Date.now();
    parcel.trackingHistory.push({
      id: generateId("trk"),
      status: "optimizing",
      location: parcel.pickup,
      timestamp: Date.now(),
      note: `Auction settled: ${parcel.courier} at $${parcel.finalPrice}`,
    });
    this.auctions.set(auction.id, auction);
    eventBus.publish([
      createEvent("parcel.auction.settled", auction.id, {
        parcelId, winner: parcel.courier, price: parcel.finalPrice,
      }, undefined, undefined),
    ]);
    return auction;
  }

  // --- Parcel batching + route consolidation -----------------------------

  checkBatching(parcel: ParcelIntent): ParcelBatch | null {
    // find other parcels going to the same area
    const candidates = Array.from(this.parcels.values()).filter((p) =>
      p.id !== parcel.id &&
      p.status === "optimizing" &&
      !p.batchId &&
      // same dropoff area
      p.dropoff.toLowerCase().includes(parcel.dropoff.toLowerCase().split(" ")[0])
    );
    if (candidates.length < 2) return null;
    // form a batch
    const batchParcelIds = [parcel.id, ...candidates.slice(0, 4).map((c) => c.id)];
    const batchParcels = batchParcelIds.map((id) => this.parcels.get(id)!).filter(Boolean);
    const totalWeight = Math.round(batchParcels.reduce((s, p) => s + p.weightKg, 0) * 10) / 10;
    const soloTotalCost = Math.round(batchParcels.reduce((s, p) => s + (p.finalPrice || p.quotedPrice), 0) * 100) / 100;
    const batchedCost = Math.round(soloTotalCost * 0.4 * 100) / 100; // 60% saving
    const saving = Math.round((soloTotalCost - batchedCost) * 100) / 100;
    const consolidatedRoute = [parcel.pickup, ...batchParcels.map((p) => p.dropoff)];
    const batch: ParcelBatch = {
      id: generateId("batch"),
      parcelIds: batchParcelIds,
      totalWeight,
      totalStops: batchParcels.length,
      consolidatedRoute,
      soloTotalCost,
      batchedCost,
      saving,
      status: "ready",
    };
    this.batches.set(batch.id, batch);
    // mark parcels as batched
    for (const p of batchParcels) {
      p.batchId = batch.id;
      p.batchedWith = batchParcelIds.filter((id) => id !== p.id);
      p.type = "batched";
      p.finalPrice = Math.round((p.finalPrice || p.quotedPrice) * 0.4 * 100) / 100;
      p.trackingHistory.push({
        id: generateId("trk"),
        status: "optimizing",
        location: p.pickup,
        timestamp: Date.now(),
        note: `Batched with ${batchParcels.length - 1} other parcels, saving $${Math.round((p.quotedPrice - p.finalPrice) * 100) / 100}`,
      });
    }
    eventBus.publish([
      createEvent("parcel.batched", batch.id, {
        parcels: batchParcelIds.length, saving, route: consolidatedRoute,
      }, undefined, undefined),
    ]);
    return batch;
  }

  dispatch(parcelId: string): void {
    const parcel = this.parcels.get(parcelId);
    if (!parcel) return;
    parcel.status = "dispatched";
    parcel.updatedAt = Date.now();
    parcel.trackingHistory.push({
      id: generateId("trk"),
      status: "dispatched",
      location: parcel.pickup,
      timestamp: Date.now(),
      note: `Dispatched to ${parcel.courier}`,
    });
    eventBus.publish([
      createEvent("parcel.dispatched", parcelId, { courier: parcel.courier, price: parcel.finalPrice }, undefined, undefined),
    ]);
  }

  // --- Queries -----------------------------------------------------------

  getParcel(id: string): ParcelIntent | undefined {
    return this.parcels.get(id);
  }

  allParcels(): ParcelIntent[] {
    return Array.from(this.parcels.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getAuction(id: string): ParcelAuction | undefined {
    return this.auctions.get(id);
  }

  allBatches(): ParcelBatch[] {
    return Array.from(this.batches.values()).sort((a, b) => {
      const aTime = this.parcels.get(a.parcelIds[0])?.createdAt || 0;
      const bTime = this.parcels.get(b.parcelIds[0])?.createdAt || 0;
      return bTime - aTime;
    });
  }

  stats() {
    const all = this.allParcels();
    return {
      totalParcels: all.length,
      delivered: all.filter((p) => p.status === "delivered").length,
      inTransit: all.filter((p) => p.status === "dispatched" || p.status === "in_transit").length,
      optimizing: all.filter((p) => p.status === "optimizing" || p.status === "created").length,
      activeBatches: this.batches.size,
      totalBatchSaving: Math.round(Array.from(this.batches.values()).reduce((s, b) => s + b.saving, 0) * 100) / 100,
      avgCost: all.length ? Math.round(all.reduce((s, p) => s + (p.finalPrice || p.quotedPrice), 0) / all.length * 100) / 100 : 0,
    };
  }
}

export const parcelNetwork = new ParcelNetwork();

// ===========================================================================
// Merchant Integration — orders auto-generate parcel intents
// ===========================================================================

class MerchantEngine {
  private merchants = new Map<string, MerchantAccount>();
  private orders = new Map<string, MerchantOrder>();

  register(merchant: Omit<MerchantAccount, "id" | "createdAt" | "totalOrders" | "totalParcelsDelivered" | "totalSpent" | "avgDeliveryCost" | "connected">): MerchantAccount {
    const account: MerchantAccount = {
      ...merchant,
      id: generateId("merch"),
      totalOrders: 0,
      totalParcelsDelivered: 0,
      totalSpent: 0,
      avgDeliveryCost: 0,
      connected: true,
      createdAt: Date.now(),
    };
    this.merchants.set(account.id, account);
    eventBus.publish([
      createEvent("merchant.registered", account.id, { name: account.name, type: account.type }, undefined, undefined),
    ]);
    return account;
  }

  // When a customer checks out on a merchant site, the merchant's system
  // creates an order via API. Oryx auto-generates a parcel intent.
  createOrder(order: Omit<MerchantOrder, "id" | "createdAt" | "status" | "parcelIntentId">): { order: MerchantOrder; parcel: ParcelIntent } {
    const merchant = this.merchants.get(order.merchantId);
    const fullOrder: MerchantOrder = {
      ...order,
      id: generateId("mord"),
      status: "created",
      createdAt: new Date().toISOString(),
    };
    this.orders.set(fullOrder.id, fullOrder);
    // auto-generate parcel intent
    const parcel = parcelNetwork.create({
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      pickup: order.pickup,
      dropoff: order.dropoff,
      size: order.size,
      weightKg: order.weightKg,
      urgency: order.urgency,
      deadline: order.deadline,
      type: "one_time",
      quotedPrice: order.deliveryFee,
    });
    fullOrder.parcelIntentId = parcel.id;
    fullOrder.status = "optimized";
    // update merchant stats
    if (merchant) {
      merchant.totalOrders++;
    }
    eventBus.publish([
      createEvent("merchant.order.created", fullOrder.id, {
        merchantName: order.merchantName, orderRef: order.orderRef, parcelIntentId: parcel.id,
      }, undefined, undefined),
    ]);
    return { order: fullOrder, parcel };
  }

  getOrders(merchantId?: string): MerchantOrder[] {
    const all = Array.from(this.orders.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return merchantId ? all.filter((o) => o.merchantId === merchantId) : all;
  }

  all(): MerchantAccount[] {
    return Array.from(this.merchants.values());
  }

  stats() {
    return {
      totalMerchants: this.merchants.size,
      connected: Array.from(this.merchants.values()).filter((m) => m.connected).length,
      totalOrders: this.orders.size,
      pendingDispatch: Array.from(this.orders.values()).filter((o) => o.status === "optimized").length,
    };
  }
}

export const merchantEngine = new MerchantEngine();

// ===========================================================================
// Mixed Journey Composer — combine NPD + transit + walk + driver + fleet
// ===========================================================================

export function composeMixedJourney(
  origin: string,
  destination: string,
  options: { npdPubs?: NPDPublication[]; fleetCapacity?: FleetCapacity[]; includeTransit?: boolean }
): MixedJourney[] {
  const km = routeDistanceKm(origin, destination);
  const journeys: MixedJourney[] = [];

  // 1. Direct ride-hail (baseline)
  journeys.push({
    id: generateId("mj"),
    hops: [{
      mode: "ride-hail", provider: "Best bid", emoji: "🚗", label: "Ride Hail",
      origin, destination, durationMin: Math.round((km / 28) * 60), price: Math.round((5 + 1.7 * km) * 100) / 100,
      co2: Math.round(0.13 * km * 100) / 100,
    }],
    totalPrice: Math.round((5 + 1.7 * km) * 100) / 100,
    totalDuration: Math.round((km / 28) * 60),
    co2: Math.round(0.13 * km * 100) / 100,
    score: 50,
    providers: ["ride-hail"],
  });

  // 2. NPD + walk (if NPDs match the route)
  if (options.npdPubs && options.npdPubs.length > 0) {
    for (const npd of options.npdPubs.slice(0, 3)) {
      const walkToNpd = Math.max(1, Math.round(routeDistanceKm(origin, npd.origin) / 5 * 60));
      const npdDuration = Math.max(5, Math.round(routeDistanceKm(npd.origin, npd.destination) / 30 * 60));
      const walkFromNpd = Math.max(1, Math.round(routeDistanceKm(npd.destination, destination) / 5 * 60));
      const hops: MixedJourneyHop[] = [
        { mode: "walk", provider: "Walk", emoji: "🚶", label: `Walk to ${npd.origin}`, origin, destination: npd.origin, durationMin: walkToNpd, price: 0, co2: 0 },
        { mode: "npd", provider: `NPD: ${npd.npdName}`, emoji: "🚙", label: `Carpool with ${npd.npdName}`, origin: npd.origin, destination: npd.destination, durationMin: npdDuration, price: npd.price, co2: Math.round(0.08 * routeDistanceKm(npd.origin, npd.destination) * 100) / 100, seats: npd.seats - npd.seatsTaken, npdId: npd.id },
        { mode: "walk", provider: "Walk", emoji: "🚶", label: `Walk to destination`, origin: npd.destination, destination, durationMin: walkFromNpd, price: 0, co2: 0 },
      ];
      const totalPrice = npd.price;
      const totalDuration = walkToNpd + npdDuration + walkFromNpd;
      const co2 = Math.round(0.08 * routeDistanceKm(npd.origin, npd.destination) * 100) / 100;
      journeys.push({
        id: generateId("mj"), hops, totalPrice, totalDuration, co2,
        score: 30 + npd.matchPct * 0.4,
        badge: `NPD carpool · ${npd.matchPct}% match`,
        providers: ["walk", `NPD: ${npd.npdName}`],
      });
    }
  }

  // 3. Walk + transit + walk (public transport)
  if (options.includeTransit !== false && km > 3) {
    const walk1 = Math.max(1, Math.round(km * 0.2 / 5 * 60));
    const transitDur = Math.round(km * 0.6 / 20 * 60);
    const walk2 = Math.max(1, Math.round(km * 0.2 / 5 * 60));
    const transitPrice = Math.round((1 + 0.3 * km * 0.6) * 100) / 100;
    journeys.push({
      id: generateId("mj"),
      hops: [
        { mode: "walk", provider: "Walk", emoji: "🚶", label: "Walk to stop", origin, destination: "Transit stop", durationMin: walk1, price: 0, co2: 0 },
        { mode: "transit", provider: "BRT Bus", emoji: "🚌", label: "Public transit", origin: "Transit stop", destination: "Transit stop", durationMin: transitDur, price: transitPrice, co2: Math.round(0.02 * km * 100) / 100 },
        { mode: "walk", provider: "Walk", emoji: "🚶", label: "Walk to destination", origin: "Transit stop", destination, durationMin: walk2, price: 0, co2: 0 },
      ],
      totalPrice: transitPrice, totalDuration: walk1 + transitDur + walk2,
      co2: Math.round(0.02 * km * 100) / 100, score: 35,
      badge: "Eco · public transit", providers: ["walk", "BRT Bus"],
    });
  }

  // 4. Fleet vehicle + walk (if fleet capacity available)
  if (options.fleetCapacity && options.fleetCapacity.length > 0) {
    const cap = options.fleetCapacity[0];
    const fleetDur = Math.max(5, Math.round(km / 26 * 60));
    const fleetPrice = Math.round((4 + 1.5 * km) * 100) / 100;
    journeys.push({
      id: generateId("mj"),
      hops: [
        { mode: "walk", provider: "Walk", emoji: "🚶", label: "Walk to pickup", origin, destination: cap.currentZone, durationMin: 2, price: 0, co2: 0 },
        { mode: cap.vehicleType as any, provider: `Fleet: ${cap.vehicleId}`, emoji: "🚐", label: `Fleet vehicle`, origin: cap.currentZone, destination, durationMin: fleetDur, price: fleetPrice, co2: Math.round(0.1 * km * 100) / 100 },
      ],
      totalPrice: fleetPrice, totalDuration: 2 + fleetDur,
      co2: Math.round(0.1 * km * 100) / 100, score: 45,
      badge: `Fleet · ${cap.etaMin}min ETA`, providers: ["walk", "Fleet"],
    });
  }

  // 5. Moto + ride-hail (mixed speed/savings)
  if (km > 4) {
    const motoKm = Math.round(km * 0.4 * 10) / 10;
    const rideKm = Math.round((km - motoKm) * 10) / 10;
    journeys.push({
      id: generateId("mj"),
      hops: [
        { mode: "moto", provider: "Okada", emoji: "🏍️", label: "Moto to bypass traffic", origin, destination: "Main road", durationMin: Math.round(motoKm / 28 * 60), price: Math.round((2 + 0.8 * motoKm) * 100) / 100, co2: Math.round(0.06 * motoKm * 100) / 100 },
        { mode: "ride-hail", provider: "Best bid", emoji: "🚗", label: "Ride to destination", origin: "Main road", destination, durationMin: Math.round(rideKm / 28 * 60), price: Math.round((5 + 1.7 * rideKm) * 100) / 100, co2: Math.round(0.13 * rideKm * 100) / 100 },
      ],
      totalPrice: Math.round((2 + 0.8 * motoKm + 5 + 1.7 * rideKm) * 100) / 100,
      totalDuration: Math.round(motoKm / 28 * 60 + rideKm / 28 * 60),
      co2: Math.round((0.06 * motoKm + 0.13 * rideKm) * 100) / 100,
      score: 55, badge: "Speed hybrid",
      providers: ["Okada", "ride-hail"],
    });
  }

  // sort by score
  return journeys.sort((a, b) => b.score - a.score);
}

// ===========================================================================
// Seed data
// ===========================================================================

export function seedMarketplace(): void {
  // NPDs
  if (npdEngine.all().length === 0) {
    npdEngine.publish({
      npdId: "npd-1", npdName: "Kwabena O.", avatar: "KO",
      origin: "East Legon", destination: "Airport", departAt: "08:00", departWindowMin: 15,
      seats: 2, price: 6, vehicle: "Toyota Camry", rating: 4.6,
      returnJourney: { departAt: "17:00", seats: 2, price: 5 },
      routeWaypoints: ["East Legon", "Airport", "Spintex"],
    });
    npdEngine.publish({
      npdId: "npd-2", npdName: "Selina A.", avatar: "SA",
      origin: "Madina", destination: "Osu", departAt: "07:30", departWindowMin: 20,
      seats: 1, price: 4, vehicle: "Hyundai Accent", rating: 4.4,
      routeWaypoints: ["Madina", "Legon", "Osu"],
    });
    npdEngine.publish({
      npdId: "npd-3", npdName: "David K.", avatar: "DK",
      origin: "Legon", destination: "Circle", departAt: "08:15", departWindowMin: 10,
      seats: 3, price: 3.5, vehicle: "Kia Cerato", rating: 4.7,
      returnJourney: { departAt: "18:00", seats: 3, price: 3 },
      recurring: { days: [1, 2, 3, 4, 5], time: "08:15" },
      routeWaypoints: ["Legon", "Madina", "Circle"],
    });
    npdEngine.publish({
      npdId: "npd-4", npdName: "Akua M.", avatar: "AM",
      origin: "Spintex", destination: "Labadi", departAt: "09:00", departWindowMin: 30,
      seats: 2, price: 5, vehicle: "Honda CR-V", rating: 4.5,
      routeWaypoints: ["Spintex", "Teshie", "Labadi"],
    });
  }

  // Fleets
  if (fleetEngine.all().length === 0) {
    fleetEngine.connect({
      id: "fc-1", fleetName: "CityCab Dispatch", pluginId: "DispatchSync v2", connected: true,
      capacity: [
        { vehicleId: "cab-101", vehicleType: "sedan", currentZone: "Osu", available: true, capacityKg: 200, seats: 4, etaMin: 3 },
        { vehicleId: "cab-102", vehicleType: "sedan", currentZone: "Airport", available: true, capacityKg: 200, seats: 4, etaMin: 5 },
        { vehicleId: "cab-103", vehicleType: "suv", currentZone: "Circle", available: true, capacityKg: 300, seats: 6, etaMin: 4 },
      ],
      vehicleCount: 240, utilizationPct: 78, zones: ["CBD", "Osu", "Airport"], avgFare: 14,
    });
    fleetEngine.connect({
      id: "fc-2", fleetName: "GreenLine Shuttles", pluginId: "ShuttleBridge", connected: true,
      capacity: [
        { vehicleId: "shut-201", vehicleType: "van", currentZone: "East Legon", available: true, capacityKg: 500, seats: 8, etaMin: 6 },
        { vehicleId: "shut-202", vehicleType: "minibus", currentZone: "Legon", available: true, capacityKg: 800, seats: 15, etaMin: 8 },
      ],
      vehicleCount: 60, utilizationPct: 84, zones: ["East Legon", "Legon"], avgFare: 6,
    });
    fleetEngine.connect({
      id: "fc-3", fleetName: "ExpressCouriers", pluginId: "CourierLink", connected: true,
      capacity: [
        { vehicleId: "exp-301", vehicleType: "van", currentZone: "Airport", available: true, capacityKg: 600, seats: 2, etaMin: 4 },
        { vehicleId: "exp-302", vehicleType: "sedan", currentZone: "Spintex", available: false, capacityKg: 200, seats: 4, etaMin: 0 },
      ],
      vehicleCount: 120, utilizationPct: 71, zones: ["Citywide"], avgFare: 9,
    });
  }

  // Merchants
  if (merchantEngine.all().length === 0) {
    merchantEngine.register({
      name: "Accra Gadgets", type: "ecommerce", apiKey: "ag_live_xxxx",
      subscription: "pro", defaultServiceLevel: "express", businessZones: ["Osu", "Airport"],
    });
    merchantEngine.register({
      name: "Spintex Pharma", type: "pharmacy", apiKey: "sp_live_xxxx",
      subscription: "enterprise", defaultServiceLevel: "same_day", businessZones: ["Spintex"],
    });
    merchantEngine.register({
      name: "Makola Styles", type: "retail", apiKey: "mk_live_xxxx",
      subscription: "free", defaultServiceLevel: "standard", businessZones: ["Circle"],
    });

    // create some merchant orders (auto-generates parcel intents)
    const merchants = merchantEngine.all();
    merchantEngine.createOrder({
      merchantId: merchants[0].id, merchantName: "Accra Gadgets",
      orderRef: "AG-2024-001", customerName: "Kwame A.",
      pickup: "Osu Warehouse", dropoff: "Labadi",
      size: "small", weightKg: 1.5, urgency: "express", deadline: "Today 6 PM", deliveryFee: 15,
    });
    merchantEngine.createOrder({
      merchantId: merchants[1].id, merchantName: "Spintex Pharma",
      orderRef: "SP-2024-042", customerName: "Ama O.",
      pickup: "Spintex Depot", dropoff: "East Legon",
      size: "small", weightKg: 0.5, urgency: "same_day", deadline: "Today 4 PM", deliveryFee: 12,
    });
    merchantEngine.createOrder({
      merchantId: merchants[2].id, merchantName: "Makola Styles",
      orderRef: "MK-2024-118", customerName: "Esi B.",
      pickup: "Makola Market", dropoff: "Tema",
      size: "large", weightKg: 5, urgency: "standard", deadline: "Tomorrow 12 PM", deliveryFee: 22,
    });
  }
}
