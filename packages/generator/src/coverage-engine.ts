/**
 * Coverage Engine: compute coverage from TestPlan + AppGraph
 */

import {
  AppGraph,
  TestPlan,
  CoverageSnapshot,
  CoverageGoals,
  createEmptyCoverage,
  ElementDescriptor,
} from '@libero/core';

function elementId(el: ElementDescriptor | string): string {
  if (typeof el === 'string') return el;
  return (el as ElementDescriptor).id ?? (el as ElementDescriptor).selector?.primary ?? String(el);
}

function nodeIdFromUrl(url: string, graph: AppGraph): string | null {
  const base = graph.baseUrl.replace(/\/$/, '');
  const path = typeof url === 'string' ? url.replace(base, '').split('?')[0] || '/' : '/';
  const node = graph.nodes.find(
    (n) => n.route === path || n.url === url || (n.url && url.startsWith(n.url))
  );
  return node?.id ?? null;
}

export class CoverageEngine {
  compute(graph: AppGraph, plan: TestPlan): CoverageSnapshot {
    const snapshot = createEmptyCoverage();

    const routeNodes = graph.nodes.filter((n) => n.type === 'route');
    const totalElements = routeNodes.reduce((s, n) => s + n.elements.length, 0);
    const totalForms = routeNodes.reduce((s, n) => s + (n.forms?.length ?? 0), 0);

    snapshot.routes.total = routeNodes.length;
    snapshot.elements.total = totalElements;
    snapshot.forms.total = totalForms;

    const coveredNodeIds = new Set<string>();
    const coveredElementIds = new Set<string>();
    const coveredFormKeys = new Set<string>(); // nodeId:formId
    let assertionCount = 0;
    let flowCount = 0;

    for (const suite of plan.suites) {
      for (const test of suite.tests) {
        if (test.flow.length >= 2) flowCount++;

        for (const step of test.flow) {
          if (step.action === 'navigate' && step.target) {
            const url = typeof step.target === 'string' ? step.target : (step.target as any).url ?? step.target;
            const nid = nodeIdFromUrl(String(url), graph);
            if (nid) coveredNodeIds.add(nid);
          }
          if (
            (step.action === 'click' || step.action === 'fill' || step.action === 'select' || step.action === 'check' || step.action === 'hover') &&
            step.target
          ) {
            const eid = elementId(step.target as ElementDescriptor | string);
            coveredElementIds.add(eid);
            const node = routeNodes.find((n) => n.elements.some((e) => elementId(e) === eid));
            if (node && step.action === 'fill') {
              const form = node.forms?.find((f) =>
                f.fields?.some((fd) => (fd.selector?.primary ?? fd.name) === eid)
              );
              if (form) coveredFormKeys.add(`${node.id}:${form.id}`);
            }
          }
        }

        for (const a of test.assertions) {
          assertionCount++;
          if (a.target && typeof a.target === 'object' && 'id' in a.target) {
            coveredElementIds.add((a.target as ElementDescriptor).id ?? (a.target as any).selector?.primary);
          }
        }
      }
    }

    // Forms: consider covered if we have a test that fills any field of that form
    for (const node of routeNodes) {
      for (const form of node.forms ?? []) {
        const key = `${node.id}:${form.id}`;
        if (coveredFormKeys.has(key)) continue;
        const anyFieldCovered = form.fields?.some((f) =>
          coveredElementIds.has(String(f.selector?.primary ?? f.name))
        );
        if (anyFieldCovered) coveredFormKeys.add(key);
      }
    }

    snapshot.routes.covered = coveredNodeIds.size;
    snapshot.routes.percentage =
      snapshot.routes.total > 0 ? Math.round((coveredNodeIds.size / snapshot.routes.total) * 100) : 0;
    snapshot.routes.nodeIds = Array.from(coveredNodeIds);

    snapshot.elements.covered = coveredElementIds.size;
    snapshot.elements.percentage =
      snapshot.elements.total > 0 ? Math.round((coveredElementIds.size / snapshot.elements.total) * 100) : 0;

    snapshot.forms.covered = coveredFormKeys.size;
    snapshot.forms.percentage =
      snapshot.forms.total > 0 ? Math.round((coveredFormKeys.size / snapshot.forms.total) * 100) : 0;

    snapshot.assertions = assertionCount;
    snapshot.flows = flowCount;
    snapshot.timestamp = new Date().toISOString();

    return snapshot;
  }

  meetsTarget(snapshot: CoverageSnapshot, target: Partial<CoverageGoals>): boolean {
    if (target.routes != null && snapshot.routes.percentage < target.routes) return false;
    if (target.elements != null && snapshot.elements.percentage < target.elements) return false;
    if (target.forms != null && snapshot.forms.percentage < target.forms) return false;
    if (target.assertions != null && snapshot.assertions < target.assertions) return false;
    if (target.flows != null && snapshot.flows < target.flows) return false;
    return true;
  }
}
