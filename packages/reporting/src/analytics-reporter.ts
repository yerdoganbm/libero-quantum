/**
 * Analytics Reporter - failure clusters, flaky tests, trends
 */

import { RunResult } from '@libero/core';
import { ensureDir, writeJson } from '@libero/core';
import { KnowledgeBase, clusterFailures } from '@libero/learning';
import * as path from 'path';

export async function generate(result: RunResult, kbPath: string | null, outputDir: string): Promise<string> {
    ensureDir(outputDir);
    const analyticsPath = path.join(outputDir, 'analytics.json');

    const analytics: any = {
      timestamp: new Date().toISOString(),
      runId: result.runId,
      summary: result.summary,
      failureClusters: [],
      flakyTests: [],
      topFailingTests: [],
    };

    if (kbPath) {
      const kb = new KnowledgeBase(kbPath);

      const clusters = await clusterFailures(kb);
      analytics.failureClusters = clusters.map((c) => ({
        errorType: c.errorType,
        count: c.count,
        suggestedFix: c.suggestedFix,
        topFailures: c.failures.slice(0, 3).map((f) => ({
          testId: f.testId,
          testName: f.testName,
          errorMessage: f.errorMessage,
        })),
      }));

      const flaky = await kb.getFlakyTests(0.1, 10);
      analytics.flakyTests = flaky.map((t) => ({
        testId: t.testId,
        testName: t.testName,
        flakinessScore: t.flakinessScore,
        failures: t.failures,
        totalRuns: t.totalRuns,
      }));

      await kb.close();
    }

    // Top failing tests from this run
    const failedTests = result.suites
      .flatMap((s) => s.tests)
      .filter((t) => t.status === 'fail')
      .slice(0, 10);

    analytics.topFailingTests = failedTests.map((t) => ({
      testId: t.testId,
      testName: t.testName,
      errorMessage: t.error?.message,
      duration: t.duration,
    }));

    writeJson(analyticsPath, analytics);
    return analyticsPath;
}

export const AnalyticsReporter = { generate };
