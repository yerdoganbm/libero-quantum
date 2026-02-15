/**
 * Journey Generator: multi-step user flows from AppGraph edges
 */

import {
  AppGraph,
  AppNode,
  AppEdge,
  TestCase,
  TestStep,
  Assertion,
  ElementDescriptor,
} from '@libero/core';
import { logger, generateId } from '@libero/core';

export class JourneyGenerator {
  /** Max steps per journey; max journeys to generate per run */
  constructor(private options: { maxSteps?: number; maxJourneys?: number; seed?: number } = {}) {
    this.options.maxSteps = this.options.maxSteps ?? 5;
    this.options.maxJourneys = this.options.maxJourneys ?? 20;
  }

  generate(graph: AppGraph): TestCase[] {
    if (!graph.edges?.length) {
      logger.info('No edges in graph; skipping journey generation');
      return [];
    }

    const routeNodes = graph.nodes.filter((n) => n.type === 'route');
    const byId = new Map(routeNodes.map((n) => [n.id, n]));
    const outEdges = new Map<string, AppEdge[]>();
    for (const e of graph.edges) {
      if (!outEdges.has(e.from)) outEdges.set(e.from, []);
      outEdges.get(e.from)!.push(e);
    }

    const tests: TestCase[] = [];
    const seenPaths = new Set<string>();
    let generated = 0;
    const maxJourneys = this.options.maxJourneys ?? 20;
    const maxSteps = this.options.maxSteps ?? 5;

    const startNodes = routeNodes.filter((n) => n.route === '/' || n.route === '' || !n.route);
    const starts = startNodes.length ? startNodes : routeNodes.slice(0, 3);

    for (const start of starts) {
      if (generated >= maxJourneys) break;
      this.walk(start.id, [], byId, outEdges, graph, seenPaths, tests, 0, maxSteps, () => generated >= maxJourneys);
      if (tests.length > generated) generated = tests.length;
    }

    if (generated < maxJourneys) {
      for (const node of routeNodes) {
        if (generated >= maxJourneys) break;
        this.walk(node.id, [], byId, outEdges, graph, seenPaths, tests, 0, maxSteps, () => generated >= maxJourneys);
        generated = tests.length;
      }
    }

    logger.success(`Generated ${tests.length} journey tests`);
    return tests;
  }

  private walk(
    nodeId: string,
    path: string[],
    byId: Map<string, AppNode>,
    outEdges: Map<string, AppEdge[]>,
    graph: AppGraph,
    seenPaths: Set<string>,
    tests: TestCase[],
    depth: number,
    maxSteps: number,
    stop: () => boolean
  ): void {
    if (stop()) return;
    const pathKey = [...path, nodeId].join('->');
    if (seenPaths.has(pathKey)) return;
    const node = byId.get(nodeId);
    if (!node) return;

    const edges = outEdges.get(nodeId) ?? [];
    if (depth >= maxSteps - 1 || edges.length === 0) {
      if (path.length >= 1) {
        const tc = this.buildJourneyTest([...path, nodeId], byId, graph);
        if (tc && !seenPaths.has(pathKey)) {
          seenPaths.add(pathKey);
          tests.push(tc);
        }
      }
      return;
    }

    for (const edge of edges) {
      const nextId = edge.to;
      if (!byId.has(nextId)) continue;
      const nextPath = [...path, nodeId];
      if (nextPath.length >= 2) {
        const pathKey2 = [...nextPath, nextId].join('->');
        if (!seenPaths.has(pathKey2)) {
          const tc = this.buildJourneyTest([...nextPath, nextId], byId, graph);
          if (tc) {
            seenPaths.add(pathKey2);
            tests.push(tc);
          }
        }
      }
      this.walk(nextId, [...path, nodeId], byId, outEdges, graph, seenPaths, tests, depth + 1, maxSteps, stop);
    }
  }

  private buildJourneyTest(pathNodeIds: string[], byId: Map<string, AppNode>, graph: AppGraph): TestCase | null {
    if (pathNodeIds.length < 2) return null;

    const steps: TestStep[] = [];
    const assertions: Assertion[] = [];
    const nodeNames: string[] = [];

    for (let i = 0; i < pathNodeIds.length; i++) {
      const node = byId.get(pathNodeIds[i]);
      if (!node) return null;
      nodeNames.push(node.name);

      if (i === 0) {
        steps.push({
          id: generateId('step'),
          action: 'navigate',
          target: node.url || graph.baseUrl + (node.route || '/'),
          description: `Navigate to ${node.name}`,
        });
        assertions.push({
          type: 'url',
          target: node.route || '/',
          expected: node.route || '/',
          operator: 'contains',
          description: `URL contains ${node.route || '/'}`,
        });
        continue;
      }

      const edge = graph.edges?.find((e) => e.from === pathNodeIds[i - 1] && e.to === pathNodeIds[i]);
      const trigger = edge?.trigger;
      if (trigger) {
        steps.push({
          id: generateId('step'),
          action: 'click',
          target: trigger as ElementDescriptor,
          description: `Go to ${node.name}`,
          options: { timeout: 5000 },
        });
      }
      steps.push({
        id: generateId('step'),
        action: 'wait',
        options: { timeout: 2000, waitFor: 'networkidle' },
        description: 'Wait for navigation',
      });
      assertions.push({
        type: 'url',
        target: node.route || '/',
        expected: node.route || '/',
        operator: 'contains',
        description: `Landed on ${node.name}`,
      });
    }

    return {
      id: generateId('test'),
      name: `[Journey] ${nodeNames.join(' → ')}`,
      description: `Multi-step flow: ${nodeNames.join(' → ')}`,
      flow: steps,
      assertions,
      tags: ['journey', 'navigation', ...pathNodeIds],
      priority: pathNodeIds.length > 2 ? 'high' : 'medium',
      estimatedDuration: steps.length * 2000,
    };
  }
}
