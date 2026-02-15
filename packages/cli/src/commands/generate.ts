/**
 * libero generate - Generate test plans
 */

import { AppGraph, TestSuite, LiberoConfig, logger, readJson, writeJson, generateId, migrateAppGraph } from '@libero/core';
import { SmokeGenerator, FormGenerator, runOrchestrator } from '@libero/generator';

import * as path from 'path';

const ORCHESTRATOR_TYPES = new Set(['smoke', 'form', 'journey'] as const);

export async function generateCommand(options: {
  seed?: number;
  type?: string;
  coverage?: number;
  aiMode?: AIMode;
}): Promise<void> {
  logger.info('Generating test plans...');

  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  const rawGraph = readJson<AppGraph>(graphPath);

  if (!rawGraph) {
    logger.error('AppGraph not found. Run: npx libero map');
    process.exit(1);
  }

  const graph = migrateAppGraph(rawGraph);

  const seed = options.seed ?? Date.now();

  const configPath = path.join(process.cwd(), 'libero.config.json');
  const config = readJson<LiberoConfig>(configPath);


  let plan: { version: string; appName: string; timestamp: string; suites: TestSuite[]; config: any };

  if (options.coverage != null && options.coverage > 0) {
    const pct = options.coverage > 1 ? Math.min(100, options.coverage) : Math.round(options.coverage * 100);


    plan = runOrchestrator(graph, effectiveConfig, {
      seed,
      scenarioTypes: scenarioTypes.length > 0 ? scenarioTypes : ['smoke', 'form', 'journey'],
      coverageTarget: { routes: pct, elements: pct, forms: pct, assertions: 2, flows: 3 },
      maxTests: 500,
    });
  } else {
    const suites: TestSuite[] = [];

    if (types.includes('smoke')) {
      const smokePlan = new SmokeGenerator().generate(graph, { seed });
      suites.push(...smokePlan.suites);
    }

    if (types.includes('form')) {
      const formGen = new FormGenerator();
      const formVariantConfig = config?.generation?.formVariants;
      const formTests = formGen.generate(graph, {

        seed,
        includeBoundaryCases: formVariantConfig?.enabled ? formVariantConfig.includeBoundaryCases : false,
        includeInvalidCases: formVariantConfig?.enabled ? formVariantConfig.includeInvalidCases : true,
      });
      if (formTests.length > 0) {
        suites.push({
          id: generateId('suite'),
          name: 'Form Tests',
          category: 'regression',
          tests: formTests,
          tags: ['form', 'validation'],
        });
      }
    }

    if (types.includes('journey')) {
      const { JourneyGenerator } = await import('@libero/generator');
      const journeyTests = new JourneyGenerator({ maxSteps: 5, maxJourneys: 25, seed }).generate(graph);
      if (journeyTests.length > 0) {
        suites.push({
          id: generateId('suite'),
          name: 'Journey Tests',
          category: 'regression',
          tests: journeyTests,
          tags: ['journey', 'navigation'],
        });
      }
    }

    if (types.includes('crud')) {
      const { CRUDGenerator } = await import('@libero/generator');
      const crudTests = new CRUDGenerator().generate(graph);
      if (crudTests.length > 0) {
        suites.push({
          id: generateId('suite'),
          name: 'CRUD Tests',
          category: 'regression',
          tests: crudTests,
          tags: ['crud'],
        });
      }
    }

    if (types.includes('a11y')) {
      const { A11yGenerator } = await import('@libero/generator');
      const a11yTests = new A11yGenerator().generate(graph);
      if (a11yTests.length > 0) {
        suites.push({
          id: generateId('suite'),
          name: 'Accessibility Tests',
          category: 'a11y',
          tests: a11yTests,
          tags: ['a11y', 'accessibility'],
        });
      }
    }

    plan = {
      version: '6.0.0',
      appName: graph.appName,
      timestamp: new Date().toISOString(),
      suites,
      config: {
        seed,
        coverageTarget: {
          routes: graph.nodes.length,
          interactiveElements: 0,
          assertions: 0,
        },
        flakyRetries: 2,
        screenshotOnFail: true,
        videoOnFail: false,
        traceOnFail: true,
      },
    };
  }

  const planPath = path.join(process.cwd(), '.libero', 'test-plans', 'full.json');
  writeJson(planPath, plan);

  logger.success(`TestPlan saved: ${planPath}`);
  logger.info(`  Suites: ${plan.suites.length}`);
  logger.info(`  Tests: ${plan.suites.reduce((sum, suite) => sum + suite.tests.length, 0)}`);
  logger.info(`  Types: ${types.join(', ')}`);
  if (requestedCoverage != null) logger.info(`  Coverage target: ${requestedCoverage}`);
}
