/**
 * Parallel Test Runner: execute tests with workers
 */

import { TestPlan, TestSuite, RunResult, SuiteResult } from '@libero/core';
import { logger } from '@libero/core';
import { PlaywrightAdapter } from './adapters/playwright-adapter';
import { SeleniumAdapter } from './adapters/selenium-adapter';
import type { PlaywrightAdapterOptions } from './adapters/playwright-adapter';
import type { SeleniumAdapterOptions } from './adapters/selenium-adapter';

export interface ParallelRunnerOptions {
  workers: number;
  runner: 'playwright' | 'selenium';
  adapterOptions: PlaywrightAdapterOptions | SeleniumAdapterOptions;
}

export class ParallelRunner {
  async execute(plan: TestPlan, options: ParallelRunnerOptions): Promise<RunResult> {
    const workers = Math.min(options.workers, plan.suites.length);
    logger.info(`Running tests with ${workers} parallel workers`);

    const suiteQueue = [...plan.suites];
    const suiteResults: SuiteResult[] = [];
    const startTime = Date.now();

    // Create worker pool
    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < workers; i++) {
      workerPromises.push(this.workerLoop(i, suiteQueue, suiteResults, options));
    }

    await Promise.all(workerPromises);

    const duration = Date.now() - startTime;
    const summary = this.calculateSummary(suiteResults);

    logger.success(`Parallel run complete: ${summary.passed}/${summary.totalTests} passed (${summary.passRate}%)`);

    return {
      runId: `parallel-${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: {
        runner: options.runner,
        parallel: true,
        workers,
        retries: (options.adapterOptions as any).retries || 0,
        timeout: (options.adapterOptions as any).timeout || 30000,
        browser: 'chromium',
        headless: (options.adapterOptions as any).headless || true,
        baseUrl: (options.adapterOptions as any).baseUrl || '',
      },
      suites: suiteResults,
      summary,
      artifacts: {
        screenshots: [],
        videos: [],
        traces: [],
        logs: [],
        reports: [],
      },
      duration,
    };
  }

  private async workerLoop(
    workerId: number,
    suiteQueue: TestSuite[],
    results: SuiteResult[],
    options: ParallelRunnerOptions
  ): Promise<void> {
    while (suiteQueue.length > 0) {
      const suite = suiteQueue.shift();
      if (!suite) break;

      logger.info(`[Worker ${workerId}] Executing suite: ${suite.name}`);

      try {
        // Create adapter per worker
        let suiteResult: SuiteResult;
        if (options.runner === 'selenium') {
          const adapter = new SeleniumAdapter();
          const singleSuitePlan = { ...{} as TestPlan, suites: [suite] };
          const result = await adapter.execute(singleSuitePlan, options.adapterOptions as SeleniumAdapterOptions);
          suiteResult = result.suites[0];
        } else {
          const adapter = new PlaywrightAdapter();
          const singleSuitePlan = { ...{} as TestPlan, suites: [suite] };
          const result = await adapter.execute(singleSuitePlan, options.adapterOptions as PlaywrightAdapterOptions);
          suiteResult = result.suites[0];
        }

        results.push(suiteResult);
        logger.success(`[Worker ${workerId}] Suite complete: ${suite.name}`);
      } catch (error) {
        logger.error(`[Worker ${workerId}] Suite failed: ${suite.name} - ${error}`);
      }
    }
  }

  private calculateSummary(suites: SuiteResult[]): any {
    const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0);
    const passed = suites.reduce((sum, s) => sum + s.passed, 0);
    const failed = suites.reduce((sum, s) => sum + s.failed, 0);
    const skipped = suites.reduce((sum, s) => sum + s.skipped, 0);
    const flaky = suites.reduce((sum, s) => sum + s.flaky, 0);

    return {
      totalTests,
      passed,
      failed,
      skipped,
      flaky,
      passRate: totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0,
      duration: suites.reduce((sum, s) => sum + s.duration, 0),
      coverage: {
        routes: { total: 0, covered: 0, percentage: 0 },
        elements: { total: 0, interacted: 0, percentage: 0 },
        assertions: { total: 0, passed: 0, percentage: 0 },
      },
    };
  }
}
