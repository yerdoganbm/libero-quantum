/**
 * AppGraph builder
 */

import { AppGraph, AppNode, AppEdge, GraphMetadata, ElementDescriptor, getCurrentGraphVersion } from '@libero/core';
import { hashObject } from '@libero/core';

export class AppGraphBuilder {
  build(
    appName: string,
    baseUrl: string,
    nodes: AppNode[],
    edges: AppEdge[],
    framework?: string,
    crawlDuration?: number
  ): AppGraph {
    const signatures: Record<string, any> = {};
    
    for (const node of nodes) {
      signatures[node.id] = {
        domHash: hashObject(node.elements),
        timestamp: node.metadata.firstSeen,
      };
    }

    const metadata: GraphMetadata = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalElements: nodes.reduce((sum, n) => sum + n.elements.length, 0),
      totalForms: nodes.reduce((sum, n) => sum + n.forms.length, 0),
      crawlDuration: crawlDuration || 0,
      crawlMethod: 'dynamic',
    };

    return {
      version: getCurrentGraphVersion(),
      appName,
      baseUrl,
      timestamp: new Date().toISOString(),
      framework,
      nodes,
      edges,
      signatures,
      metadata,
    };
  }

  /**
   * Merge multiple graphs (for hybrid crawl)
   */
  merge(graphs: AppGraph[]): AppGraph {
    if (graphs.length === 0) throw new Error('No graphs to merge');
    if (graphs.length === 1) return graphs[0];

    const base = graphs[0];
    const nodeMap = new Map<string, AppNode>();
    const edgeSet = new Set<string>();
    const allEdges: AppEdge[] = [];

    for (const graph of graphs) {
      for (const node of graph.nodes) {
        if (!nodeMap.has(node.id)) {
          nodeMap.set(node.id, node);
        } else {
          // Merge elements
          const existing = nodeMap.get(node.id)!;
          existing.elements = this.mergeElements(existing.elements, node.elements);
        }
      }
      
      for (const edge of graph.edges) {
        const key = `${edge.from}->${edge.to}-${edge.type}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          allEdges.push(edge);
        }
      }
    }

    return this.build(
      base.appName,
      base.baseUrl,
      Array.from(nodeMap.values()),
      allEdges,
      base.framework,
      graphs.reduce((sum, g) => sum + (g.metadata.crawlDuration || 0), 0)
    );
  }

  private mergeElements(a: ElementDescriptor[], b: ElementDescriptor[]): ElementDescriptor[] {
    const map = new Map<string, ElementDescriptor>();
    for (const el of [...a, ...b]) {
      const key = el.selector.primary || el.text || el.id;
      if (!map.has(key)) map.set(key, el);
    }
    return Array.from(map.values());
  }
}
