// Oryx Mobility Kernel — Mobility Knowledge Graph
// In-memory graph store. Every entity (rider, driver, vehicle, road, intent,
// etc.) is a node with typed edges. The optimization engine reasons over
// this unified world model rather than scattered relational joins.

import type { EntityType, GraphNode } from "./types";
import { eventBus, createEvent } from "./event-bus";

class KnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  // index: type → node ids
  private typeIndex = new Map<EntityType, Set<string>>();
  // index: edge type → [sourceId, targetId][]
  private edgeIndex = new Map<string, Array<{ from: string; to: string }>>();

  upsert(node: GraphNode): void {
    const existing = this.nodes.get(node.id);
    this.nodes.set(node.id, { ...node, updatedAt: Date.now() });
    // type index
    if (!existing) {
      if (!this.typeIndex.has(node.type)) this.typeIndex.set(node.type, new Set());
      this.typeIndex.get(node.type)!.add(node.id);
    }
    // edge index
    if (existing) {
      // remove old edges
      for (const [rel, targets] of Object.entries(existing.edges)) {
        const idx = this.edgeIndex.get(rel) || [];
        this.edgeIndex.set(
          rel,
          idx.filter((e) => !(e.from === node.id && targets.includes(e.to)))
        );
      }
    }
    for (const [rel, targets] of Object.entries(node.edges)) {
      if (!this.edgeIndex.has(rel)) this.edgeIndex.set(rel, []);
      for (const to of targets) {
        this.edgeIndex.get(rel)!.push({ from: node.id, to });
      }
    }
    // emit graph event
    eventBus.publish([
      createEvent(
        "graph.node.upserted",
        node.id,
        { type: node.type, label: node.label },
        undefined,
        undefined
      ),
    ]);
  }

  get(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  remove(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;
    this.nodes.delete(id);
    this.typeIndex.get(node.type)?.delete(id);
    for (const [rel, targets] of Object.entries(node.edges)) {
      const idx = this.edgeIndex.get(rel) || [];
      this.edgeIndex.set(
        rel,
        idx.filter((e) => !(e.from === id && targets.includes(e.to)))
      );
    }
  }

  byType(type: EntityType): GraphNode[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.nodes.get(id))
      .filter((n): n is GraphNode => !!n);
  }

  // traverse: follow an edge type from a node
  neighbors(id: string, rel?: string): GraphNode[] {
    const result: GraphNode[] = [];
    const rels = rel ? [rel] : Array.from(this.edgeIndex.keys());
    for (const r of rels) {
      const edges = this.edgeIndex.get(r) || [];
      for (const e of edges) {
        if (e.from === id) {
          const target = this.nodes.get(e.to);
          if (target) result.push(target);
        }
      }
    }
    return result;
  }

  // query: find nodes matching a predicate
  query(predicate: (n: GraphNode) => boolean): GraphNode[] {
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (predicate(node)) result.push(node);
    }
    return result;
  }

  // shortest-path-ish: find connected nodes within N hops
  hops(id: string, maxHops: number): Map<string, number> {
    const dist = new Map<string, number>([[id, 0]]);
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      const d = dist.get(cur)!;
      if (d >= maxHops) continue;
      for (const n of this.neighbors(cur)) {
        if (!dist.has(n.id)) {
          dist.set(n.id, d + 1);
          queue.push(n.id);
        }
      }
    }
    return dist;
  }

  stats(): { totalNodes: number; byType: Record<string, number>; totalEdges: number } {
    const byType: Record<string, number> = {};
    for (const [t, ids] of this.typeIndex) byType[t] = ids.size;
    let totalEdges = 0;
    for (const edges of this.edgeIndex.values()) totalEdges += edges.length;
    return { totalNodes: this.nodes.size, byType, totalEdges };
  }
}

export const graph = new KnowledgeGraph();

// Seed the graph with the Accra mobility world
export function seedGraph(): void {
  if (graph.stats().totalNodes > 0) return;
  // neighborhoods
  const hoods = [
    { id: "n-east-legon", label: "East Legon" },
    { id: "n-osu", label: "Osu" },
    { id: "n-spintex", label: "Spintex" },
    { id: "n-madina", label: "Madina" },
    { id: "n-circle", label: "Nkrumah Circle" },
    { id: "n-airport", label: "Airport" },
    { id: "n-legon", label: "Legon" },
    { id: "n-tema", label: "Tema" },
  ];
  for (const h of hoods) {
    graph.upsert({
      id: h.id,
      type: "neighborhood",
      label: h.label,
      edges: {},
      attrs: {},
      updatedAt: Date.now(),
    });
  }
  // roads connecting neighborhoods
  const roads = [
    { id: "r1", from: "n-east-legon", to: "n-airport", label: "Airport Rd" },
    { id: "r2", from: "n-osu", to: "n-circle", label: "Ring Rd" },
    { id: "r3", from: "n-spintex", to: "n-airport", label: "Spintex Rd" },
    { id: "r4", from: "n-madina", to: "n-legon", label: "Madina-Legon Rd" },
    { id: "r5", from: "n-circle", to: "n-tema", label: "Tema Motorway" },
  ];
  for (const r of roads) {
    graph.upsert({
      id: r.id,
      type: "route",
      label: r.label,
      edges: { connects: [r.from, r.to] },
      attrs: { distanceKm: 3 + Math.random() * 8 },
      updatedAt: Date.now(),
    });
  }
  // transit lines
  graph.upsert({
    id: "t-brt",
    type: "transit",
    label: "BRT Line 1",
    edges: { serves: ["n-circle", "n-tema"] },
    attrs: { mode: "bus", frequency: "10m" },
    updatedAt: Date.now(),
  });
  // sample providers
  const providers = [
    { id: "p-uber", label: "Uber", category: "ride_hail" },
    { id: "p-bolt", label: "Bolt", category: "ride_hail" },
    { id: "p-yango", label: "Yango", category: "ride_hail" },
    { id: "p-indrive", label: "inDrive", category: "ride_hail" },
    { id: "p-taxi", label: "City Taxi", category: "ride_hail" },
  ];
  for (const p of providers) {
    graph.upsert({
      id: p.id,
      type: "provider",
      label: p.label,
      edges: {},
      attrs: { category: p.category },
      updatedAt: Date.now(),
    });
  }

  // --- Full entity coverage (spec: first-class domain models) -----------

  // Businesses (merchants, employers, schools)
  const businesses = [
    { id: "b-octagon", label: "The Octagon", kind: "office", hood: "n-circle" },
    { id: "b-ais", label: "AIS Legon", kind: "school", hood: "n-legon" },
    { id: "b-mall", label: "Accra Mall", kind: "shopping", hood: "n-airport" },
    { id: "b-airport", label: "Kotoka Airport", kind: "airport", hood: "n-airport" },
    { id: "b-stadium", label: "Accra Sports Stadium", kind: "venue", hood: "n-circle" },
  ];
  for (const b of businesses) {
    graph.upsert({
      id: b.id,
      type: "business",
      label: b.label,
      edges: { located_in: [b.hood] },
      attrs: { kind: b.kind },
      updatedAt: Date.now(),
    });
  }

  // Riders
  const riders = [
    { id: "rd-1", name: "Kwame A.", hood: "n-east-legon" },
    { id: "rd-2", name: "Ama O.", hood: "n-osu" },
    { id: "rd-3", name: "Esi B.", hood: "n-spintex" },
    { id: "rd-4", name: "Daniel M.", hood: "n-madina" },
  ];
  for (const r of riders) {
    graph.upsert({
      id: r.id,
      type: "rider",
      label: r.name,
      edges: { lives_in: [r.hood], commutes_to: ["b-octagon"] },
      attrs: { rides: 312, saved: 2841 },
      updatedAt: Date.now(),
    });
  }

  // Drivers (professional)
  const drivers = [
    { id: "dr-1", name: "Kofi Mensah", hood: "n-east-legon", provider: "p-uber" },
    { id: "dr-2", name: "Grace Adjei", hood: "n-osu", provider: "p-bolt" },
    { id: "dr-3", name: "Ibrahim S.", hood: "n-spintex", provider: "p-yango" },
    { id: "dr-4", name: "Ama Boateng", hood: "n-airport", provider: "p-indrive" },
  ];
  for (const d of drivers) {
    graph.upsert({
      id: d.id,
      type: "driver",
      label: d.name,
      edges: { operates_in: [d.hood], works_for: [d.provider] },
      attrs: { rating: 4.8, reputation: 94, rides: 245 },
      updatedAt: Date.now(),
    });
  }

  // NPDs (non-playable drivers — ordinary vehicle owners)
  const npds = [
    { id: "npd-1", name: "Kwabena O.", hood: "n-east-legon", dest: "n-airport" },
    { id: "npd-2", name: "Selina A.", hood: "n-madina", dest: "n-osu" },
    { id: "npd-3", name: "David K.", hood: "n-legon", dest: "n-circle" },
  ];
  for (const n of npds) {
    graph.upsert({
      id: n.id,
      type: "npd",
      label: n.name,
      edges: { based_in: [n.hood], traveling_to: [n.dest] },
      attrs: { seats: 2, vehicle: "Toyota Camry" },
      updatedAt: Date.now(),
    });
  }

  // Fleets
  const fleets = [
    { id: "fl-1", name: "CityCab Dispatch", vehicles: 240, hood: "n-circle" },
    { id: "fl-2", name: "GreenLine Shuttles", vehicles: 60, hood: "n-legon" },
    { id: "fl-3", name: "ExpressCouriers", vehicles: 120, hood: "n-airport" },
  ];
  for (const f of fleets) {
    graph.upsert({
      id: f.id,
      type: "fleet",
      label: f.name,
      edges: { operates_in: [f.hood], provides: ["p-taxi"] },
      attrs: { vehicles: f.vehicles, utilization: 78 },
      updatedAt: Date.now(),
    });
  }

  // Vehicles
  const vehicles = [
    { id: "v-1", name: "Toyota Corolla", driver: "dr-1", type: "sedan" },
    { id: "v-2", name: "Hyundai Kona EV", driver: "dr-2", type: "ev" },
    { id: "v-3", name: "Toyota HiAce", driver: "dr-4", type: "van" },
    { id: "v-4", name: "Yamaha Moto", driver: "dr-3", type: "moto" },
  ];
  for (const v of vehicles) {
    graph.upsert({
      id: v.id,
      type: "vehicle",
      label: v.name,
      edges: { driven_by: [v.driver] },
      attrs: { type: v.type, capacity: v.type === "van" ? 8 : v.type === "moto" ? 1 : 4 },
      updatedAt: Date.now(),
    });
  }

  // Parcels (active deliveries in the network)
  const parcels = [
    { id: "pa-1", from: "b-mall", to: "n-osu", size: "small" },
    { id: "pa-2", from: "b-mall", to: "n-east-legon", size: "medium" },
  ];
  for (const p of parcels) {
    graph.upsert({
      id: p.id,
      type: "parcel",
      label: `Parcel ${p.id}`,
      edges: { pickup_at: [p.from], deliver_to: [p.to] },
      attrs: { size: p.size, status: "open" },
      updatedAt: Date.now(),
    });
  }

  // Connectors as graph nodes
  const connectorNodes = [
    { id: "c-osm", label: "OpenStreetMap", category: "maps" },
    { id: "c-weather", label: "Weather Stream", category: "weather" },
    { id: "c-uber", label: "Uber API", category: "ride_hail" },
    { id: "c-fleet", label: "Fleet Dispatch", category: "fleet" },
  ];
  for (const c of connectorNodes) {
    graph.upsert({
      id: c.id,
      type: "connector",
      label: c.label,
      edges: {},
      attrs: { category: c.category, status: "live" },
      updatedAt: Date.now(),
    });
  }
}
