/**
 * Coverage: routes, elements, forms, assertions
 */

export interface CoverageSnapshot {
  routes: { total: number; covered: number; percentage: number; nodeIds: string[] };
  elements: { total: number; covered: number; percentage: number };
  forms: { total: number; covered: number; percentage: number };
  assertions: number;
  flows: number; // multi-step flows
  timestamp: string;
}

/** Target percentages/counts to meet during generation (0-100 for routes/elements/forms). */
export interface CoverageGoals {
  routes: number;
  elements: number;
  forms: number;
  assertions: number;
  flows: number;
}

export function createEmptyCoverage(): CoverageSnapshot {
  return {
    routes: { total: 0, covered: 0, percentage: 0, nodeIds: [] },
    elements: { total: 0, covered: 0, percentage: 0 },
    forms: { total: 0, covered: 0, percentage: 0 },
    assertions: 0,
    flows: 0,
    timestamp: new Date().toISOString(),
  };
}
