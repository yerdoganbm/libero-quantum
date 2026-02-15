import assert from 'node:assert/strict';
import { ParallelRunner } from '../packages/runner/src/parallel-runner';
import type { TestPlan } from '../packages/core/src/types/test-plan';

async function testEmptyPlan(): Promise<void> {
  const runner = new ParallelRunner();
  const plan: TestPlan = {
    version: '6.0.0',
    appName: 'demo',
    timestamp: new Date().toISOString(),
    suites: [],
    config: {
      coverageTarget: { routes: 0, interactiveElements: 0, assertions: 0 },
      flakyRetries: 0,
      screenshotOnFail: false,
      videoOnFail: false,
      traceOnFail: false,
    },
  };

  const result = await runner.execute(plan, {
    workers: 4,
    runner: 'playwright',
    adapterOptions: {
      headless: true,
      baseUrl: 'http://localhost:3000',
      timeout: 1000,
      retries: 0,
      screenshotOnFail: false,
      traceOnFail: false,
      artifactsDir: '.tmp/artifacts',
    },
  });

  assert.equal(result.suites.length, 0);
  assert.equal(result.summary.totalTests, 0);
  assert.equal(result.config.workers, 0);
}

testEmptyPlan().then(() => {
  console.log('parallel-runner.spec.ts passed');
});
