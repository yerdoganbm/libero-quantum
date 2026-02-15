/**
 * Coverage Reporter - show coverage metrics
 */

import { RunResult, AppGraph, TestPlan } from '@libero/core';
import { ensureDir, writeJson } from '@libero/core';
import { CoverageEngine } from '@libero/generator';
import * as path from 'path';

export class CoverageReporter {
  generate(result: RunResult, plan: TestPlan, graph: AppGraph, outputDir: string): string {
    ensureDir(outputDir);
    const coveragePath = path.join(outputDir, 'coverage.json');

    const engine = new CoverageEngine();
    const snapshot = engine.compute(graph, plan);

    const report = {
      timestamp: new Date().toISOString(),
      runId: result.runId,
      coverage: snapshot,
      summary: {
        totalTests: result.summary.totalTests,
        passed: result.summary.passed,
        failed: result.summary.failed,
      },
    };

    writeJson(coveragePath, report);
    return coveragePath;
  }
}
