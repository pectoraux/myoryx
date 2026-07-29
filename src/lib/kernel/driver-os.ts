// Oryx Mobility Kernel — Driver Operating System (M14-M15)
// Driver profiles, scheduling engine, subscription marketplace with calendar
// compatibility scoring, return ride broadcasting, and AI schedule builder.

import type {
  CompatibilityFactor,
  CoverageArea,
  DriverApplication,
  DriverOSProfile,
  DriverPreferences,
  DriverReview,
  DriverSchedule,
  DriverStats,
  RideHistoryEntry,
  ReturnRideBroadcast,
  ScheduleStop,
  SubscriptionPackage,
} from "./types";
import { generateId, eventBus, createEvent } from "./event-bus";

// ===========================================================================
// Driver Registry — manages all driver profiles
// ===========================================================================

class DriverOS {
  private drivers = new Map<string, DriverOSProfile>();
  private applications: DriverApplication[] = [];
  private broadcasts: ReturnRideBroadcast[] = [];

  // --- Profile management ------------------------------------------------

  register(profile: DriverOSProfile): void {
    this.drivers.set(profile.id, profile);
    eventBus.publish([
      createEvent("driver.registered", profile.id, { name: profile.name, zones: profile.coverageZones }, undefined, undefined),
    ]);
  }

  get(id: string): DriverOSProfile | undefined {
    return this.drivers.get(id);
  }

  all(): DriverOSProfile[] {
    return Array.from(this.drivers.values());
  }

  // filter + search for marketplace
  search(filters: {
    zones?: string[];
    specialty?: string;
    minRating?: number;
    maxPrice?: number;
    vehicleType?: string;
  }): DriverOSProfile[] {
    return this.all().filter((d) => {
      if (filters.zones && !filters.zones.some((z) => d.coverageZones.includes(z))) return false;
      if (filters.specialty) {
        const has = d.subscriptionPackages.some(
          (p) => p.specialty.toLowerCase().includes(filters.specialty!.toLowerCase())
        );
        if (!has) return false;
      }
      if (filters.minRating && d.rating < filters.minRating) return false;
      if (filters.maxPrice) {
        const has = d.subscriptionPackages.some((p) => p.weeklyPrice <= filters.maxPrice!);
        if (!has) return false;
      }
      if (filters.vehicleType && d.vehicleType !== filters.vehicleType) return false;
      return true;
    });
  }

  // --- Statistics --------------------------------------------------------

  updateStats(driverId: string): void {
    const d = this.drivers.get(driverId);
    if (!d) return;
    const completed = d.rideHistory.filter((r) => r.status === "completed");
    d.stats.completedRides = completed.length;
    d.stats.totalRides = d.rideHistory.length;
    d.stats.cancelledRides = d.rideHistory.length - completed.length;
    d.stats.acceptanceRate = Math.round((completed.length / Math.max(1, d.rideHistory.length)) * 100);
    d.stats.totalEarnings = Math.round(completed.reduce((s, r) => s + r.fare, 0) * 100) / 100;
    d.stats.avgEarningsPerRide = Math.round((d.stats.totalEarnings / Math.max(1, completed.length)) * 100) / 100;
    d.stats.avgRating = Math.round((completed.reduce((s, r) => s + r.rating, 0) / Math.max(1, completed.length)) * 10) / 10;
    d.stats.totalKm = Math.round(completed.reduce((s, r) => s + r.distanceKm, 0) * 10) / 10;
    d.stats.emptyKm = Math.round(d.stats.totalKm * (1 - d.efficiency / 100) * 10) / 10;
    d.stats.utilizationPct = d.efficiency;
    d.stats.ridesThisWeek = completed.filter((r) => {
      const rideDate = new Date(r.date);
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return rideDate > weekAgo;
    }).length;
    d.stats.earningsThisWeek = Math.round(
      completed.filter((r) => new Date(r.date) > new Date(Date.now() - 7 * 86400000)).reduce((s, r) => s + r.fare, 0) * 100
    ) / 100;
    d.stats.hoursWorkedThisWeek = Math.round(
      completed.filter((r) => new Date(r.date) > new Date(Date.now() - 7 * 86400000)).reduce((s, r) => s + r.durationMin, 0) / 60 * 10
    ) / 10;
  }

  addRide(driverId: string, ride: Omit<RideHistoryEntry, "id">): void {
    const d = this.drivers.get(driverId);
    if (!d) return;
    d.rideHistory.unshift({ ...ride, id: generateId("ride") });
    if (d.rideHistory.length > 100) d.rideHistory.pop();
    this.updateStats(driverId);
    d.weeklyProgress = Math.min(100, Math.round((d.stats.earningsThisWeek / d.weeklyGoal) * 100));
    eventBus.publish([
      createEvent("driver.ride.completed", driverId, { fare: ride.fare, rating: ride.rating }, undefined, undefined),
    ]);
  }

  addReview(driverId: string, review: Omit<DriverReview, "id">): void {
    const d = this.drivers.get(driverId);
    if (!d) return;
    d.reviews.unshift({ ...review, id: generateId("rev") });
    if (d.reviews.length > 50) d.reviews.pop();
    // recalculate rating
    d.rating = Math.round((d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length) * 10) / 10;
  }

  // --- Subscription marketplace (M14) ------------------------------------

  // The core compatibility scoring algorithm. Matches a rider's calendar
  // against a driver's subscription package coverage.
  scoreCompatibility(
    riderCalendar: { days: number[]; time: string; origin: string; destination: string },
    pkg: SubscriptionPackage,
    driver: DriverOSProfile
  ): { score: number; factors: CompatibilityFactor[] } {
    const factors: CompatibilityFactor[] = [];

    // 1. Day overlap (25%)
    const overlapDays = riderCalendar.days.filter((d) => pkg.coverage.days.includes(d));
    const dayScore = Math.round((overlapDays.length / Math.max(1, riderCalendar.days.length)) * 100);
    factors.push({
      factor: "Schedule overlap",
      score: dayScore,
      detail: `${overlapDays.length}/${riderCalendar.days.length} days match (${overlapDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")})`,
    });

    // 2. Time window compatibility (20%)
    const riderHour = parseInt(riderCalendar.time.split(":")[0]);
    const pkgStart = parseInt(pkg.coverage.timeWindow.split("-")[0]);
    const pkgEnd = parseInt(pkg.coverage.timeWindow.split("-")[1] || "23");
    const timeScore = riderHour >= pkgStart && riderHour <= pkgEnd ? 100 : Math.max(0, 100 - Math.abs(riderHour - pkgStart) * 20);
    factors.push({
      factor: "Time window",
      score: timeScore,
      detail: `Rider ${riderCalendar.time}, package covers ${pkg.coverage.timeWindow}:00-${pkgEnd}:00`,
    });

    // 3. Zone/route match (25%)
    const originMatch = pkg.coverage.zones.some((z) =>
      riderCalendar.origin.toLowerCase().includes(z.toLowerCase()) || z.toLowerCase().includes(riderCalendar.origin.toLowerCase().split(" ")[0])
    );
    const destMatch = pkg.coverage.zones.some((z) =>
      riderCalendar.destination.toLowerCase().includes(z.toLowerCase()) || z.toLowerCase().includes(riderCalendar.destination.toLowerCase().split(" ")[0])
    );
    const zoneScore = (originMatch ? 50 : 0) + (destMatch ? 50 : 0);
    factors.push({
      factor: "Route coverage",
      score: zoneScore,
      detail: originMatch && destMatch ? "Full route covered" : originMatch ? "Pickup zone covered" : destMatch ? "Dropoff zone covered" : "Route not directly covered",
    });

    // 4. Driver reputation (15%)
    const repScore = driver.reputation;
    factors.push({
      factor: "Driver reputation",
      score: repScore,
      detail: `Reputation ${repScore}/100, rating ${driver.rating}★, ${driver.stats.completedRides} rides`,
    });

    // 5. Availability capacity (15%)
    const capacityScore = Math.round((1 - pkg.subscribers / pkg.maxSubscribers) * 100);
    factors.push({
      factor: "Availability",
      score: capacityScore,
      detail: `${pkg.subscribers}/${pkg.maxSubscribers} subscribers, ${pkg.maxSubscribers - pkg.subscribers} slots open`,
    });

    const totalScore = Math.round(
      dayScore * 0.25 + timeScore * 0.20 + zoneScore * 0.25 + repScore * 0.15 + capacityScore * 0.15
    );

    return { score: totalScore, factors };
  }

  applyForSubscription(
    riderId: string,
    riderName: string,
    driverId: string,
    packageId: string,
    riderCalendar: { days: number[]; time: string; origin: string; destination: string },
    notes?: string
  ): DriverApplication {
    const driver = this.drivers.get(driverId);
    const pkg = driver?.subscriptionPackages.find((p) => p.id === packageId);
    let compatibilityScore = 0;
    let compatibilityFactors: CompatibilityFactor[] = [];
    if (driver && pkg) {
      const result = this.scoreCompatibility(riderCalendar, pkg, driver);
      compatibilityScore = result.score;
      compatibilityFactors = result.factors;
    }
    const app: DriverApplication = {
      id: generateId("app"),
      riderId,
      riderName,
      driverId,
      packageId,
      status: "pending",
      compatibilityScore,
      compatibilityFactors,
      appliedAt: Date.now(),
      notes,
    };
    this.applications.unshift(app);
    if (this.applications.length > 100) this.applications.pop();
    eventBus.publish([
      createEvent("driver.application.submitted", app.id, { riderName, driverId, compatibilityScore }, undefined, undefined),
    ]);
    return app;
  }

  reviewApplication(applicationId: string, approved: boolean): void {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return;
    app.status = approved ? "approved" : "rejected";
    app.reviewedAt = Date.now();
    if (approved) {
      const driver = this.drivers.get(app.driverId);
      const pkg = driver?.subscriptionPackages.find((p) => p.id === app.packageId);
      if (pkg) pkg.subscribers++;
    }
    eventBus.publish([
      createEvent("driver.application.reviewed", applicationId, { approved, driverId: app.driverId }, undefined, undefined),
    ]);
  }

  getApplications(driverId?: string): DriverApplication[] {
    return driverId ? this.applications.filter((a) => a.driverId === driverId) : this.applications;
  }

  // --- Return ride broadcasting (M15) ------------------------------------

  broadcastReturnRide(
    driverId: string,
    driverName: string,
    origin: string,
    destination: string,
    departInMin: number,
    seats: number,
    price: number,
    vehicle: string,
    rating: number
  ): string {
    const discountPct = 35 + Math.floor(Math.random() * 15);
    const broadcast: ReturnRideBroadcast = {
      id: generateId("rrb"),
      driverId,
      driverName,
      origin,
      destination,
      departInMin,
      seats,
      price: Math.round(price * (1 - discountPct / 100) * 100) / 100,
      vehicle,
      rating,
      discountPct,
    };
    this.broadcasts.unshift(broadcast);
    if (this.broadcasts.length > 30) this.broadcasts.pop();
    eventBus.publish([
      createEvent("driver.return.broadcast", broadcast.id, { driverName, origin, destination, price: broadcast.price }, undefined, undefined),
    ]);
    return broadcast.id;
  }

  getReturnBroadcasts(limit = 10): ReturnRideBroadcast[] {
    return this.broadcasts.slice(0, limit);
  }

  // --- M15: AI Schedule Builder ------------------------------------------
  // Constructs an optimal daily schedule from preferences, earnings goals,
  // and available demand. Chains rides to minimize empty miles.

  buildSchedule(driverId: string, date: string): DriverSchedule {
    const driver = this.drivers.get(driverId);
    if (!driver) return { id: generateId("sch"), driverId, date, stops: [], projectedEarnings: 0, projectedHours: 0, utilizationPct: 0, emptyMilesPct: 0, aiOptimized: false };

    const stops: ScheduleStop[] = [];
    let currentTime = parseInt(driver.workingHours.start.split(":")[0]);
    const endHour = parseInt(driver.workingHours.end.split(":")[0]);
    let totalEarnings = 0;
    let totalDuration = 0;

    // Demand patterns by hour (from the optimizer demand model)
    const demandByHour: Record<number, { type: string; origin: string; destination: string; fare: number; duration: number }> = {
      6: { type: "subscription", origin: "East Legon", destination: "AIS Legon", fare: 35, duration: 25 },
      7: { type: "pool", origin: "Madina", destination: "Octagon", fare: 28, duration: 35 },
      8: { type: "ride", origin: "East Legon", destination: "Octagon", fare: 22, duration: 30 },
      9: { type: "ride", origin: "Spintex", destination: "Airport", fare: 18, duration: 20 },
      10: { type: "parcel", origin: "Accra Mall", destination: "Osu", fare: 15, duration: 18 },
      11: { type: "ride", origin: "Circle", destination: "Labadi", fare: 16, duration: 22 },
      12: { type: "parcel", origin: "Octagon", destination: "Spintex", fare: 14, duration: 20 },
      13: { type: "break", origin: "", destination: "", fare: 0, duration: 45 },
      14: { type: "ride", origin: "Airport", destination: "East Legon", fare: 20, duration: 25 },
      15: { type: "subscription", origin: "AIS Legon", destination: "East Legon", fare: 35, duration: 25 },
      16: { type: "pool", origin: "Octagon", destination: "Madina", fare: 28, duration: 35 },
      17: { type: "return", origin: "Airport", destination: "East Legon", fare: 12, duration: 20 },
      18: { type: "ride", origin: "Octagon", destination: "Spintex", fare: 24, duration: 30 },
      19: { type: "ride", origin: "East Legon", destination: "Osu", fare: 18, duration: 22 },
      20: { type: "pool", origin: "Osu", destination: "East Legon", fare: 16, duration: 25 },
    };

    let lastDestination = "";
    for (let hour = currentTime; hour < endHour; hour++) {
      const demand = demandByHour[hour];
      if (!demand) continue;

      // skip if outside preferred neighborhoods
      if (demand.origin && driver.preferredNeighborhoods.length > 0) {
        const inZone = driver.preferredNeighborhoods.some(
          (z) => demand.origin.includes(z) || demand.destination.includes(z)
        );
        if (!inZone && Math.random() > 0.3) continue;
      }

      // skip if exceeds max working hours
      if (totalDuration / 60 >= driver.maxWorkingHoursPerDay) break;

      // chain: if last destination matches this origin, mark as chained
      const chainsToNext = lastDestination && demand.origin &&
        (lastDestination.includes(demand.origin) || demand.origin.includes(lastDestination));

      const stop: ScheduleStop = {
        id: generateId("stop"),
        time: `${String(hour).padStart(2, "0")}:00`,
        type: demand.type as ScheduleStop["type"],
        title: demand.type === "break" ? "Lunch break" :
               demand.type === "subscription" ? "School pickup" :
               demand.type === "pool" ? "Commute pool" :
               demand.type === "return" ? "Return ride" :
               demand.type === "parcel" ? "Parcel delivery" : "Ride",
        origin: demand.origin || "—",
        destination: demand.destination || "—",
        fare: demand.fare,
        durationMin: demand.duration,
        chainsToNext,
        riderName: demand.type === "subscription" ? "Kofi Jr." : demand.type === "pool" ? "4 riders" : undefined,
      };
      stops.push(stop);
      totalEarnings += demand.fare;
      totalDuration += demand.duration;
      lastDestination = demand.destination;
      // advance time by duration
      hour += Math.floor(demand.duration / 60);
    }

    const projectedHours = Math.round((totalDuration / 60) * 10) / 10;
    const utilizationPct = Math.round((totalDuration / ((endHour - currentTime) * 60)) * 100);
    const emptyMilesPct = Math.max(0, 100 - driver.efficiency - Math.round(stops.filter((s) => s.chainsToNext).length / Math.max(1, stops.length) * 20));

    const schedule: DriverSchedule = {
      id: generateId("sch"),
      driverId,
      date,
      stops,
      projectedEarnings: totalEarnings,
      projectedHours,
      utilizationPct,
      emptyMilesPct,
      aiOptimized: true,
    };

    eventBus.publish([
      createEvent("driver.schedule.built", driverId, { stops: stops.length, earnings: totalEarnings, hours: projectedHours }, undefined, undefined),
    ]);

    return schedule;
  }

  // update preferences
  updatePreferences(driverId: string, prefs: Partial<DriverPreferences>): void {
    const d = this.drivers.get(driverId);
    if (!d) return;
    if (prefs.weeklyGoal !== undefined) d.weeklyGoal = prefs.weeklyGoal;
    if (prefs.monthlyGoal !== undefined) d.monthlyGoal = prefs.monthlyGoal;
    if (prefs.preferredNeighborhoods) d.preferredNeighborhoods = prefs.preferredNeighborhoods;
    if (prefs.workingHours) d.workingHours = prefs.workingHours;
    if (prefs.preferredRideTypes) d.preferredRideTypes = prefs.preferredRideTypes;
    if (prefs.preferredVehicle) d.preferredVehicle = prefs.preferredVehicle;
    if (prefs.maxWorkingHoursPerDay) d.maxWorkingHoursPerDay = prefs.maxWorkingHoursPerDay;
  }

  stats() {
    return {
      totalDrivers: this.drivers.size,
      available: Array.from(this.drivers.values()).filter((d) => d.status === "available").length,
      champions: Array.from(this.drivers.values()).filter((d) => d.champion).length,
      pendingApplications: this.applications.filter((a) => a.status === "pending").length,
      activeBroadcasts: this.broadcasts.length,
      totalSubscribers: Array.from(this.drivers.values()).reduce(
        (s, d) => s + d.subscriptionPackages.reduce((ss, p) => ss + p.subscribers, 0), 0
      ),
    };
  }
}

export const driverOS = new DriverOS();

// --- Seed driver profiles ------------------------------------------------

export function seedDrivers(): void {
  if (driverOS.all().length > 0) return;

  const drivers: Array<Omit<DriverOSProfile, "rideHistory" | "reviews" | "subscriptionPackages">> = [
    {
      id: "dos-1", userId: "d1", name: "Kofi Mensah", avatar: "KM", vehicle: "Toyota Corolla", vehicleType: "sedan",
      rating: 4.9, reputation: 96, coverageZones: ["East Legon", "Airport", "Octagon"],
      coverageMap: [
        { zone: "East Legon", lat: 5.6446, lng: -0.1672, radiusKm: 3, demand: "high", avgFare: 18 },
        { zone: "Airport", lat: 5.6051, lng: -0.1668, radiusKm: 2.5, demand: "high", avgFare: 22 },
        { zone: "Octagon", lat: 5.5636, lng: -0.2026, radiusKm: 2, demand: "medium", avgFare: 16 },
      ],
      stats: {} as DriverStats, weeklyGoal: 1800, monthlyGoal: 7200, weeklyProgress: 78,
      preferredNeighborhoods: ["East Legon", "Airport"], workingHours: { start: "06:00", end: "21:00", days: [1,2,3,4,5,6] },
      preferredRideTypes: ["ride", "pool", "subscription"], preferredVehicle: "sedan", maxWorkingHoursPerDay: 10,
      calendarSync: true, minPreNoticeHours: 2, champion: true, savingsGenerated: 1240, pooledTrips: 64,
      punctuality: 98, efficiency: 41, status: "available", createdAt: Date.now(),
    },
    {
      id: "dos-2", userId: "d2", name: "Grace Adjei", avatar: "GA", vehicle: "Hyundai Kona EV", vehicleType: "ev",
      rating: 4.9, reputation: 94, coverageZones: ["Osu", "Labadi", "Airport"],
      coverageMap: [
        { zone: "Osu", lat: 5.5597, lng: -0.1757, radiusKm: 2.5, demand: "high", avgFare: 15 },
        { zone: "Labadi", lat: 5.5731, lng: -0.1824, radiusKm: 2, demand: "medium", avgFare: 14 },
        { zone: "Airport", lat: 5.6051, lng: -0.1668, radiusKm: 3, demand: "high", avgFare: 22 },
      ],
      stats: {} as DriverStats, weeklyGoal: 1600, monthlyGoal: 6400, weeklyProgress: 82,
      preferredNeighborhoods: ["Osu", "Labadi"], workingHours: { start: "07:00", end: "20:00", days: [1,2,3,4,5] },
      preferredRideTypes: ["ride", "subscription", "parcel"], preferredVehicle: "ev", maxWorkingHoursPerDay: 8,
      calendarSync: true, minPreNoticeHours: 3, champion: true, savingsGenerated: 980, pooledTrips: 71,
      punctuality: 96, efficiency: 52, status: "available", createdAt: Date.now(),
    },
    {
      id: "dos-3", userId: "d3", name: "Ama Boateng", avatar: "AB", vehicle: "Toyota HiAce", vehicleType: "van",
      rating: 4.8, reputation: 91, coverageZones: ["Spintex", "Airport", "Tema"],
      coverageMap: [
        { zone: "Spintex", lat: 5.6295, lng: -0.1441, radiusKm: 3, demand: "medium", avgFare: 17 },
        { zone: "Tema", lat: 5.6037, lng: -0.0168, radiusKm: 5, demand: "low", avgFare: 25 },
      ],
      stats: {} as DriverStats, weeklyGoal: 2200, monthlyGoal: 8800, weeklyProgress: 71,
      preferredNeighborhoods: ["Spintex", "Tema"], workingHours: { start: "05:00", end: "19:00", days: [1,2,3,4,5,6] },
      preferredRideTypes: ["pool", "subscription", "parcel"], preferredVehicle: "van", maxWorkingHoursPerDay: 12,
      calendarSync: false, minPreNoticeHours: 4, champion: false, savingsGenerated: 1530, pooledTrips: 142,
      punctuality: 94, efficiency: 38, status: "busy", createdAt: Date.now(),
    },
    {
      id: "dos-4", userId: "d4", name: "Daniel Quaye", avatar: "DQ", vehicle: "Hyundai Sonata", vehicleType: "sedan",
      rating: 4.8, reputation: 89, coverageZones: ["Airport", "Octagon", "East Legon"],
      coverageMap: [
        { zone: "Airport", lat: 5.6051, lng: -0.1668, radiusKm: 4, demand: "high", avgFare: 24 },
        { zone: "Octagon", lat: 5.5636, lng: -0.2026, radiusKm: 2, demand: "high", avgFare: 18 },
      ],
      stats: {} as DriverStats, weeklyGoal: 1500, monthlyGoal: 6000, weeklyProgress: 65,
      preferredNeighborhoods: ["Airport"], workingHours: { start: "08:00", end: "22:00", days: [0,1,2,3,4,5,6] },
      preferredRideTypes: ["ride"], preferredVehicle: "sedan", maxWorkingHoursPerDay: 8,
      calendarSync: true, minPreNoticeHours: 1, champion: false, savingsGenerated: 610, pooledTrips: 0,
      punctuality: 92, efficiency: 68, status: "available", createdAt: Date.now(),
    },
  ];

  for (const d of drivers) {
    const profile: DriverOSProfile = {
      ...d,
      rideHistory: [],
      reviews: [],
      subscriptionPackages: [],
    };

    // add subscription packages
    if (d.id === "dos-1") {
      profile.subscriptionPackages = [
        { id: "pkg-1a", driverId: d.id, name: "School Run", specialty: "Weekly school transport", weeklyPrice: 180, features: ["Mon-Fri pickup", "Live child tracking", "Verified driver"], coverage: { days: [1,2,3,4,5], timeWindow: "6-9", tripsPerWeek: 10, zones: ["East Legon", "AIS Legon"] }, subscribers: 14, maxSubscribers: 20, rating: 4.9, minCommitmentWeeks: 4 },
        { id: "pkg-1b", driverId: d.id, name: "Airport Express", specialty: "Airport specialist", weeklyPrice: 150, features: ["Flight tracking", "On-time guarantee", "Meet & greet"], coverage: { days: [0,1,2,3,4,5,6], timeWindow: "4-22", tripsPerWeek: 5, zones: ["Airport", "East Legon"] }, subscribers: 8, maxSubscribers: 15, rating: 4.8, minCommitmentWeeks: 2 },
      ];
    }
    if (d.id === "dos-2") {
      profile.subscriptionPackages = [
        { id: "pkg-2a", driverId: d.id, name: "Corporate Executive", specialty: "Corporate executive transport", weeklyPrice: 420, features: ["Mercedes E-Class", "Professional attire", "NDA available", "Wifi"], coverage: { days: [1,2,3,4,5], timeWindow: "7-19", tripsPerWeek: 20, zones: ["Osu", "Airport", "Octagon"] }, subscribers: 6, maxSubscribers: 8, rating: 4.9, minCommitmentWeeks: 8 },
      ];
    }
    if (d.id === "dos-3") {
      profile.subscriptionPackages = [
        { id: "pkg-3a", driverId: d.id, name: "Family Transport", specialty: "Family transport with child seats", weeklyPrice: 240, features: ["Child seats", "Grocery space", "Multi-stop"], coverage: { days: [1,2,3,4,5,6], timeWindow: "5-19", tripsPerWeek: 15, zones: ["Spintex", "Tema"] }, subscribers: 9, maxSubscribers: 12, rating: 4.8, minCommitmentWeeks: 4 },
        { id: "pkg-3b", driverId: d.id, name: "Parcel Route", specialty: "Recurring parcel deliveries", weeklyPrice: 200, features: ["Daily route", "Proof of delivery", "Batched"], coverage: { days: [1,2,3,4,5], timeWindow: "9-17", tripsPerWeek: 25, zones: ["Spintex", "Airport"] }, subscribers: 5, maxSubscribers: 10, rating: 4.7, minCommitmentWeeks: 2 },
      ];
    }
    if (d.id === "dos-4") {
      profile.subscriptionPackages = [
        { id: "pkg-4a", driverId: d.id, name: "Medical Appointments", specialty: "Medical appointment specialist", weeklyPrice: 200, features: ["Wheelchair accessible", "On-time guarantee", "Insurance aware"], coverage: { days: [1,2,3,4,5], timeWindow: "8-18", tripsPerWeek: 8, zones: ["Airport", "Octagon", "Ridge"] }, subscribers: 7, maxSubscribers: 10, rating: 4.8, minCommitmentWeeks: 4 },
      ];
    }

    // add ride history
    const rideTypes = ["ride", "pool", "parcel", "subscription", "return"];
    const origins = d.coverageZones;
    for (let i = 0; i < 15; i++) {
      const origin = origins[Math.floor(Math.random() * origins.length)];
      const dest = ["Octagon", "Airport", "Osu", "East Legon", "Spintex"][Math.floor(Math.random() * 5)];
      profile.rideHistory.push({
        id: `rh-${d.id}-${i}`,
        date: new Date(Date.now() - i * 86400000 * Math.random()).toISOString(),
        rider: ["Kwame A.", "Ama O.", "Esi B.", "Daniel M.", "Fatima A."][Math.floor(Math.random() * 5)],
        origin, destination: dest,
        fare: Math.round((10 + Math.random() * 25) * 100) / 100,
        durationMin: 15 + Math.floor(Math.random() * 30),
        distanceKm: Math.round((3 + Math.random() * 12) * 10) / 10,
        rating: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
        type: rideTypes[Math.floor(Math.random() * rideTypes.length)] as RideHistoryEntry["type"],
        status: Math.random() > 0.05 ? "completed" : "cancelled",
      });
    }

    // add reviews
    const reviewComments = [
      { comment: "Always on time, very professional.", tags: ["punctual", "professional"] },
      { comment: "Great driver, saved me money with pool suggestions.", tags: ["helpful", "savings"] },
      { comment: "Clean car, safe driving. Highly recommend.", tags: ["safe", "clean"] },
      { comment: "Excellent with kids during school runs.", tags: ["child-friendly", "reliable"] },
    ];
    for (let i = 0; i < 5; i++) {
      const rc = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      profile.reviews.push({
        id: `rev-${d.id}-${i}`,
        riderName: ["Kwame A.", "Ama O.", "Esi B.", "Daniel M."][Math.floor(Math.random() * 4)],
        riderAvatar: ["KA", "AO", "EB", "DM"][Math.floor(Math.random() * 4)],
        rating: Math.round((4.5 + Math.random() * 0.5) * 10) / 10,
        comment: rc.comment,
        date: new Date(Date.now() - i * 3 * 86400000).toISOString(),
        tags: rc.tags,
      });
    }

    driverOS.register(profile);
    driverOS.updateStats(d.id);
  }

  // seed return ride broadcasts
  driverOS.broadcastReturnRide("dos-1", "Kofi Mensah", "Airport", "East Legon", 18, 2, 18, "Toyota Corolla", 4.9);
  driverOS.broadcastReturnRide("dos-2", "Grace Adjei", "Osu", "Airport", 7, 1, 15, "Hyundai Kona EV", 4.9);
  driverOS.broadcastReturnRide("dos-3", "Ama Boateng", "Tema", "Spintex", 22, 3, 20, "Toyota HiAce", 4.8);
}
