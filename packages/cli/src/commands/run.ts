/**
 * libero run - Execute tests
 */

import { TestPlan, LiberoConfig } from '@libero/core';
import { logger, readJson, writeJson } from '@libero/core';
import { PlaywrightAdapter } from '@libero/runner';
import { HtmlReporter, JsonReporter } from '@libero/reporting';
import * as path from 'path';

export async function runCommand(options: { plan?: string; headless?: boolean }): Promise<void> {
  logger.info('Executing tests...');

  // Load config
  const config = readJson<LiberoConfig>(path.join(process.cwd(), 'libero.config.json'));
  if (!config) {
    logger.error('libero.config.json not found. Run: npx libero init');
    process.exit(1);
  }

  // Load test plan (prefer full.json, fallback to smoke.json)
  const defaultPlanPath = path.join(process.cwd(), '.libero', 'test-plans', 'full.json');
  const fallbackPlanPath = path.join(process.cwd(), '.libero', 'test-plans', 'smoke.json');
  const planPath = options.plan || (readJson<TestPlan>(defaultPlanPath) ? defaultPlanPath : fallbackPlanPath);
  const plan = readJson<TestPlan>(planPath);
  
  if (!plan) {
    logger.error(`TestPlan not found: ${planPath}. Run: npx libero generate`);
    process.exit(1);
  }

  // Execute
  const adapter = new PlaywrightAdapter();
  const artifactsBaseDir = path.join(process.cwd(), '.libero', 'artifacts');
  const tempRunId = Date.now().toString();
  const result = await adapter.execute(plan, {
    headless: options.headless ?? config.execution.headless,
    baseUrl: config.baseUrl,
    timeout: config.execution.timeout,
    retries: config.execution.retries,
    screenshotOnFail: config.execution.screenshotOnFail,
    traceOnFail: config.execution.traceOnFail,
    artifactsDir: path.join(artifactsBaseDir, tempRunId),
  });

  // Save result
  const resultPath = path.join(process.cwd(), '.libero', 'reports', `${result.runId}.json`);
  writeJson(resultPath, result);

  // Generate reports
  const reportDir = path.join(process.cwd(), '.libero', 'reports', result.runId);
  
  const jsonReporter = new JsonReporter();
  jsonReporter.generate(result, reportDir);
  
  const htmlReporter = new HtmlReporter();
  const htmlPath = htmlReporter.generate(result, reportDir);

  logger.success(`Reports generated: ${reportDir}`);
  logger.info(`  HTML: ${htmlPath}`);
  logger.info(`  Pass Rate: ${result.summary.passRate}%`);
  logger.info(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);

  if (result.summary.failed > 0) {
    logger.warn(`${result.summary.failed} tests failed`);
    process.exitCode = 1;
  }
}
