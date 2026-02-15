/**
 * Orchestrator: run generators until coverage target is met
 */

import {
  AppGraph,
  TestPlan,
  LiberoConfig,
  CoverageGoals,
  CoverageSnapshot,
  GenerationConfig,
} from '@libero/core';
import { generateId } from '@libero/core';
import { SmokeGenerator } from './smoke-generator';
import { FormGenerator } from './form-generator';
import { JourneyGenerator } from './journey-generator';
import { CoverageEngine } from './coverage-engine';
import { logger } from '@libero/core';

const MAX_ITERATIONS = 10;

export interface OrchestratorOptions {
  seed?: number;
  scenarioTypes?: Array<'smoke' | 'form' | 'journey'>;
  coverageTarget?: Partial<CoverageGoals>;
  maxTests?: number;
}

export function getDefaultCoverageTarget(config: GenerationConfig): CoverageGoals {
  const t = config.coverageTargets;
  return {
    routes: t?.routes ?? 90,
    elements: t?.elements ?? 70,
    forms: t?.forms ?? 80,
    assertions: t?.assertions ?? 2,
    flows: t?.flows ?? 3,
  };
}

export function runOrchestrator(
  graph: AppGraph,
  config: LiberoConfig | null,
  options: OrchestratorOptions
): TestPlan {
  const coverageTarget: CoverageGoals = {
    routes: options.coverageTarget?.routes ?? config?.generation?.coverageTargets?.routes ?? 90,
    elements: options.coverageTarget?.elements ?? config?.generation?.coverageTargets?.elements ?? 70,
    forms: options.coverageTarget?.forms ?? config?.generation?.coverageTargets?.forms ?? 80,
    assertions: options.coverageTarget?.assertions ?? config?.generation?.coverageTargets?.assertions ?? 2,
    flows: options.coverageTarget?.flows ?? config?.generation?.coverageTargets?.flows ?? 3,
  };

  const types = options.scenarioTypes ?? ['smoke', 'form', 'journey'];
  const seed = options.seed ?? Date.now();
  const maxTests = options.maxTests ?? 500;

  const engine = new CoverageEngine();
  const smokeGen = new SmokeGenerator();
  const formGen = new FormGenerator();
  const journeyGen = new JourneyGenerator({ maxSteps: 5, maxJourneys: 25, seed });

  let plan: TestPlan = {
    version: '6.0.0',
    appName: graph.appName,
    timestamp: new Date().toISOString(),
    suites: [],
    config: {
      seed,
      coverageTarget: {
        routes: graph.nodes.filter((n) => n.type === 'route').length,
        interactiveElements: 0,
        assertions: 0,
      },
      flakyRetries: 2,
      screenshotOnFail: true,
      videoOnFail: false,
      traceOnFail: true,
    },
  };

  let iteration = 0;
  let snapshot: CoverageSnapshot = engine.compute(graph, plan);
  let smokeAdded = false;

  while (iteration < MAX_ITERATIONS) {
    if (engine.meetsTarget(snapshot, coverageTarget)) {
      logger.info(`Coverage target met after ${iteration} iteration(s)`);
      break;
    }

    const totalTests = plan.suites.reduce((s, u) => s + u.tests.length, 0);
    if (totalTests >= maxTests) {
      logger.warn(`Reached max tests (${maxTests}); stopping`);
      break;
    }

    let added = 0;

    if (types.includes('smoke') && !smokeAdded && snapshot.routes.percentage < (coverageTarget.routes ?? 0)) {
      const smokePlan = smokeGen.generate(graph, { seed });
      for (const suite of smokePlan.suites) {
        plan.suites.push(suite);
        added += suite.tests.length;
      }
      smokeAdded = true;
    }

    if (types.includes('form') && snapshot.forms.percentage < (coverageTarget.forms ?? 0)) {
      const formTests = formGen.generate(graph);
      if (formTests.length > 0) {
        plan.suites.push({
          id: generateId('suite'),
          name: `Form Tests (iter ${iteration})`,
          category: 'regression',
          tests: formTests,
          tags: ['form', 'validation'],
        });
        added += formTests.length;
      }
    }

    if (types.includes('journey') && snapshot.flows < (coverageTarget.flows ?? 0)) {
      const journeyTests = journeyGen.generate(graph);
      if (journeyTests.length > 0) {
        plan.suites.push({
          id: generateId('suite'),
          name: `Journey Tests (iter ${iteration})`,
          category: 'regression',
          tests: journeyTests,
          tags: ['journey', 'navigation'],
        });
        added += journeyTests.length;
      }
    }

    snapshot = engine.compute(graph, plan);
    iteration++;

    if (added === 0) break;
  }

  plan.timestamp = new Date().toISOString();
  logger.info(
    `Coverage: routes ${snapshot.routes.percentage}%, elements ${snapshot.elements.percentage}%, forms ${snapshot.forms.percentage}%, assertions ${snapshot.assertions}, flows ${snapshot.flows}`
  );
  return plan;
}
