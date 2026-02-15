/**
 * Failure Analysis: cluster errors by type and suggest fixes
 */

import { TestFailure, KnowledgeBase } from './knowledge-base';

export type ErrorType = 'timeout' | 'selector' | 'navigation' | 'detached' | 'overlay' | 'auth' | 'network' | 'assertion' | 'unknown';

export function classifyError(errorMessage: string): ErrorType {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
  if (msg.includes('selector') || msg.includes('not found') || msg.includes('no element')) return 'selector';
  if (msg.includes('navigation') || msg.includes('navigating')) return 'navigation';
  if (msg.includes('detached') || msg.includes('stale element')) return 'detached';
  if (msg.includes('overlay') || msg.includes('obscured') || msg.includes('covered')) return 'overlay';
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('403') || msg.includes('401')) return 'auth';
  if (msg.includes('network') || msg.includes('net::') || msg.includes('failed to fetch')) return 'network';
  if (msg.includes('expect') || msg.includes('assert')) return 'assertion';
  return 'unknown';
}

export function suggestFix(errorType: ErrorType): string {
  switch (errorType) {
    case 'timeout':
      return `Increase timeout or add explicit wait for element/network idle. Check if page is slow to load.`;
    case 'selector':
      return `Selector may have changed. Enable auto-healing or update selector. Consider using data-testid or stable attributes.`;
    case 'navigation':
      return `Add wait for navigation to complete (networkidle/load). Check if navigation triggers are stable.`;
    case 'detached':
      return `Element detached from DOM during action. Add retry logic or wait for DOM to stabilize.`;
    case 'overlay':
      return `Element obscured by overlay/modal. Close overlay first or scroll element into view.`;
    case 'auth':
      return `Session expired or auth required. Refresh session, re-login, or check auth strategy.`;
    case 'network':
      return `Network request failed. Check API availability, add retry logic, or mock network responses.`;
    case 'assertion':
      return `Assertion failed. Verify expected value is correct or update test data.`;
    default:
      return `Unknown error. Review error message and test flow.`;
  }
}

export interface FailureCluster {
  errorType: ErrorType;
  count: number;
  failures: TestFailure[];
  suggestedFix: string;
}

export async function clusterFailures(kb: KnowledgeBase): Promise<FailureCluster[]> {
  const types: ErrorType[] = ['timeout', 'selector', 'navigation', 'detached', 'overlay', 'auth', 'network', 'assertion'];
  const clusters: FailureCluster[] = [];

  for (const type of types) {
    const failures = await kb.getFailuresByType(type, 50);
    if (failures.length > 0) {
      clusters.push({
        errorType: type,
        count: failures.length,
        failures,
        suggestedFix: suggestFix(type),
      });
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}
