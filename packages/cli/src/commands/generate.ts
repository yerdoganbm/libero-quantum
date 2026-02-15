/**
 * libero generate - Generate test plans
 */

import { AppGraph } from '@libero/core';
import { logger, readJson, writeJson } from '@libero/core';
import { SmokeGenerator } from '@libero/generator';
import * as path from 'path';

export async function generateCommand(options: { seed?: number }): Promise<void> {
  logger.info('Generating test plans...');

  // Load AppGraph
  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  const graph = readJson<AppGraph>(graphPath);
  
  if (!graph) {
    logger.error('AppGraph not found. Run: npx libero map');
    process.exit(1);
  }

  // Generate smoke tests
  const smokeGen = new SmokeGenerator();
  const plan = smokeGen.generate(graph, { seed: options.seed });

  // Save
  const planPath = path.join(process.cwd(), '.libero', 'test-plans', 'smoke.json');
  writeJson(planPath, plan);

  logger.success(`TestPlan saved: ${planPath}`);
  logger.info(`  Suites: ${plan.suites.length}`);
  logger.info(`  Tests: ${plan.suites.reduce((sum, s) => sum + s.tests.length, 0)}`);
  logger.info(`  Coverage target: ${plan.config.coverageTarget.routes} routes`);
}
