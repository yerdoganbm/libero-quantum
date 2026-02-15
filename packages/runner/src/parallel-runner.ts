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

    if (workers <= 0) {
      return {
        runId: `parallel-${Date.now()}`,
        timestamp: new Date().toISOString(),
        config: {
          runner: options.runner,
          parallel: true,
          workers: 0,
          retries: (options.adapterOptions as any).retries ?? 0,
          timeout: (options.adapterOptions as any).timeout ?? 30000,
          browser: this.resolveBrowser(options),
          headless: (options.adapterOptions as any).headless ?? true,
          baseUrl: (options.adapterOptions as any).baseUrl ?? '',
        },
        suites: [],
        summary: this.calculateSummary([]),
        artifacts: { screenshots: [], videos: [], traces: [], logs: [], reports: [] },
        duration: 0,
      };
    }

    const suiteQueue = [...plan.suites];
    const suiteResults: SuiteResult[] = [];
    const startTime = Date.now();

    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < workers; i++) {
      workerPromises.push(this.workerLoop(i, suiteQueue, suiteResults, options, plan));
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
        retries: (options.adapterOptions as any).retries ?? 0,
        timeout: (options.adapterOptions as any).timeout ?? 30000,
        browser: this.resolveBrowser(options),
        headless: (options.adapterOptions as any).headless ?? true,
        baseUrl: (options.adapterOptions as any).baseUrl ?? '',
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
    options: ParallelRunnerOptions,
    fullPlan: TestPlan
  ): Promise<void> {
    while (suiteQueue.length > 0) {
      const suite = suiteQueue.shift();
      if (!suite) break;

      logger.info(`[Worker ${workerId}] Executing suite: ${suite.name}`);

      try {
        const singleSuitePlan: TestPlan = {
          version: fullPlan.version,
          appName: fullPlan.appName,
          timestamp: fullPlan.timestamp,
          envMatrix: fullPlan.envMatrix,
          config: fullPlan.config,
          suites: [suite],
        };

        const workerOptions = this.buildWorkerScopedOptions(options, workerId);

        let suiteResult: SuiteResult;
        if (options.runner === 'selenium') {
          const adapter = new SeleniumAdapter();
          const result = await adapter.execute(singleSuitePlan, workerOptions as SeleniumAdapterOptions);
          suiteResult = result.suites[0];
        } else {
          const adapter = new PlaywrightAdapter();
          const result = await adapter.execute(singleSuitePlan, workerOptions as PlaywrightAdapterOptions);
          suiteResult = result.suites[0];
        }

        results.push(suiteResult);
        logger.success(`[Worker ${workerId}] Suite complete: ${suite.name}`);
      } catch (error) {
        logger.error(`[Worker ${workerId}] Suite failed: ${suite.name} - ${error}`);
      }
    }
  }

  private buildWorkerScopedOptions(options: ParallelRunnerOptions, workerId: number): PlaywrightAdapterOptions | SeleniumAdapterOptions {
    const base = options.adapterOptions as any;
    const artifactsDir = typeof base.artifactsDir === 'string' ? `${base.artifactsDir}/worker-${workerId}` : base.artifactsDir;

    return {
      ...base,
      artifactsDir,
    } as PlaywrightAdapterOptions | SeleniumAdapterOptions;
  }

  private resolveBrowser(options: ParallelRunnerOptions): string {
    if (options.runner === 'selenium') {
      return ((options.adapterOptions as SeleniumAdapterOptions).browser ?? 'chrome') as string;
    }
    return 'chromium';
  }

  private calculateSummary(suites: SuiteResult[]): RunResult['summary'] {
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
