/**
 * libero run - Execute tests
 */

import { TestPlan, LiberoConfig, AppGraph } from '@libero/core';
import { logger, readJson, writeJson } from '@libero/core';
import { PlaywrightAdapter, SeleniumAdapter } from '@libero/runner';
import { HtmlReporter, JsonReporter, JUnitReporter, CoverageReporter, AnalyticsReporter } from '@libero/reporting';
import { KnowledgeBase, clusterFailures } from '@libero/learning';
import * as path from 'path';

export async function runCommand(options: { plan?: string; headless?: boolean; runner?: string }): Promise<void> {
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
  const runner = options.runner || config.execution.runner;
  const artifactsBaseDir = path.join(process.cwd(), '.libero', 'artifacts');
  const tempRunId = Date.now().toString();
  const kbPath = path.join(process.cwd(), config.learning?.kbPath || '.libero/knowledge-base.db');
  
  let result;
  if (runner === 'selenium') {
    const adapter = new SeleniumAdapter();
    result = await adapter.execute(plan, {
      headless: options.headless ?? config.execution.headless,
      baseUrl: config.baseUrl,
      timeout: config.execution.timeout,
      retries: config.execution.retries,
      screenshotOnFail: config.execution.screenshotOnFail,
      artifactsDir: path.join(artifactsBaseDir, tempRunId),
      browser: 'chrome',
      knowledgeBasePath: config.learning?.enabled ? kbPath : undefined,
      enableHealing: config.learning?.autoHeal ?? false,
    });
  } else {
    const adapter = new PlaywrightAdapter();
    result = await adapter.execute(plan, {
      headless: options.headless ?? config.execution.headless,
      baseUrl: config.baseUrl,
      timeout: config.execution.timeout,
      retries: config.execution.retries,
      screenshotOnFail: config.execution.screenshotOnFail,
      traceOnFail: config.execution.traceOnFail,
      artifactsDir: path.join(artifactsBaseDir, tempRunId),
      knowledgeBasePath: config.learning?.enabled ? kbPath : undefined,
      enableHealing: config.learning?.autoHeal ?? false,
    });
  }

  // Save result
  const resultPath = path.join(process.cwd(), '.libero', 'reports', `${result.runId}.json`);
  writeJson(resultPath, result);

  // Generate reports
  const reportDir = path.join(process.cwd(), '.libero', 'reports', result.runId);
  
  const jsonReporter = new JsonReporter();
  jsonReporter.generate(result, reportDir);
  
  const htmlReporter = new HtmlReporter();
  const htmlPath = htmlReporter.generate(result, reportDir);

  // JUnit XML
  if (config.reporting.formats.includes('junit')) {
    const junitReporter = new JUnitReporter();
    const junitPath = junitReporter.generate(result, reportDir);
    logger.info(`  JUnit: ${junitPath}`);
  }

  // Coverage
  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  const graph = readJson<AppGraph>(graphPath);
  if (graph) {
    const coverageReporter = new CoverageReporter();
    const coveragePath = coverageReporter.generate(result, plan, graph, reportDir);
    logger.info(`  Coverage: ${coveragePath}`);
  }

  // Analytics
  if (config.learning?.enabled) {
    const analyticsPath = await AnalyticsReporter.generate(result, kbPath, reportDir);
    logger.info(`  Analytics: ${analyticsPath}`);
  }

  logger.success(`Reports generated: ${reportDir}`);
  logger.info(`  HTML: ${htmlPath}`);
  logger.info(`  Pass Rate: ${result.summary.passRate}%`);
  logger.info(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);

  // Show failure clusters if KB enabled
  if (config.learning?.enabled && result.summary.failed > 0) {
    const kb = new KnowledgeBase(kbPath);
    const clusters = await clusterFailures(kb);
    if (clusters.length > 0) {
      logger.info('\n🔍 Failure Analysis:');
      clusters.slice(0, 3).forEach((cluster) => {
        logger.warn(`  ${cluster.errorType}: ${cluster.count} occurrences`);
        logger.info(`     → ${cluster.suggestedFix}`);
      });
    }
    const flaky = await kb.getFlakyTests(0.1, 5);
    if (flaky.length > 0) {
      logger.info('\n⚠️  Flaky Tests:');
      flaky.forEach((t) => {
        logger.warn(`  ${t.testName} (${(t.flakinessScore * 100).toFixed(1)}% flaky, ${t.failures}/${t.totalRuns} failed)`);
      });
    }
    await kb.close();
  }

  if (result.summary.failed > 0) {
    logger.warn(`${result.summary.failed} tests failed`);
    process.exitCode = 1;
  }
}
