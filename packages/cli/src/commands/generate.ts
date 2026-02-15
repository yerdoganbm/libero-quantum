/**
 * libero generate - Generate test plans
 */

import { AppGraph, TestSuite } from '@libero/core';
import { logger, readJson, writeJson, generateId } from '@libero/core';
import { SmokeGenerator, FormGenerator } from '@libero/generator';
import * as path from 'path';

export async function generateCommand(options: { seed?: number; type?: string }): Promise<void> {
  logger.info('Generating test plans...');

  // Load AppGraph
  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  const graph = readJson<AppGraph>(graphPath);
  
  if (!graph) {
    logger.error('AppGraph not found. Run: npx libero map');
    process.exit(1);
  }

  const suites: TestSuite[] = [];
  const types = options.type ? options.type.split(',') : ['smoke', 'form'];

  // Generate smoke tests
  if (types.includes('smoke')) {
    const smokeGen = new SmokeGenerator();
    const smokePlan = smokeGen.generate(graph, { seed: options.seed });
    suites.push(...smokePlan.suites);
  }

  // Generate form tests
  if (types.includes('form')) {
    const formGen = new FormGenerator();
    const formTests = formGen.generate(graph);
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

  const plan = {
    version: '6.0.0',
    appName: graph.appName,
    timestamp: new Date().toISOString(),
    suites,
    config: {
      seed: options.seed || Date.now(),
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

  // Save
  const planPath = path.join(process.cwd(), '.libero', 'test-plans', 'full.json');
  writeJson(planPath, plan);

  logger.success(`TestPlan saved: ${planPath}`);
  logger.info(`  Suites: ${plan.suites.length}`);
  logger.info(`  Tests: ${plan.suites.reduce((sum, s) => sum + s.tests.length, 0)}`);
  logger.info(`  Types: ${types.join(', ')}`);
}
