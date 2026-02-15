/**
 * libero generate - Generate test plans
 */

import { AppGraph, TestSuite, LiberoConfig, AIMode, logger, readJson, writeJson, generateId, migrateAppGraph, resolveAIMode, applyAIMode } from '@libero/core';
import { SmokeGenerator, FormGenerator, runOrchestrator } from '@libero/generator';
import * as path from 'path';

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
  const aiMode = resolveAIMode(options.aiMode, config);
  const effectiveConfig = config ? applyAIMode(config, aiMode) : null;

  if (aiMode !== 'off') {
    logger.info(`AI mode active: ${aiMode}`);
  }

  const types = options.type
    ? options.type.split(',').map((t) => t.trim())
    : aiMode === 'autopilot'
      ? ['smoke', 'form', 'journey', 'crud', 'a11y']
      : aiMode === 'assist'
        ? ['smoke', 'form', 'journey']
        : ['smoke', 'form'];

  let plan: { version: string; appName: string; timestamp: string; suites: TestSuite[]; config: any };

  const requestedCoverage = options.coverage ?? (aiMode === 'autopilot' ? 85 : aiMode === 'assist' ? 75 : undefined);

  if (requestedCoverage != null && requestedCoverage > 0) {
    const pct = requestedCoverage > 1 ? Math.min(100, requestedCoverage) : Math.round(requestedCoverage * 100);

    plan = runOrchestrator(graph, effectiveConfig ?? null, {
      seed,
      scenarioTypes: types as Array<'smoke' | 'form' | 'journey'>,
      coverageTarget: { routes: pct, elements: pct, forms: pct, assertions: 2, flows: 3 },
      maxTests: 500,
    });
  } else {
    const suites: TestSuite[] = [];

    if (types.includes('smoke')) {
      const smokeGen = new SmokeGenerator();
      const smokePlan = smokeGen.generate(graph, { seed });
      suites.push(...smokePlan.suites);
    }

    if (types.includes('form')) {
      const formGen = new FormGenerator();
      const formVariantConfig = effectiveConfig?.generation?.formVariants;
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
      const journeyGen = new JourneyGenerator({ maxSteps: 5, maxJourneys: 25, seed });
      const journeyTests = journeyGen.generate(graph);
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
      const crudGen = new CRUDGenerator();
      const crudTests = crudGen.generate(graph);
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
      const a11yGen = new A11yGenerator();
      const a11yTests = a11yGen.generate(graph);
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
  logger.info(`  Tests: ${plan.suites.reduce((sum, s) => sum + s.tests.length, 0)}`);
  logger.info(`  Types: ${types.join(', ')}`);
  if (requestedCoverage != null) logger.info(`  Coverage target: ${requestedCoverage}`);
}
