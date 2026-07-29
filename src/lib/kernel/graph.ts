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
}
