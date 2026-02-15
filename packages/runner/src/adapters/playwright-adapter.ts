/**
 * Playwright Adapter - Executes TestPlan with Playwright
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import { TestPlan, TestSuite, TestCase, TestStep, Assertion, RunResult, SuiteResult, TestResult, ElementDescriptor } from '@libero/core';
import { logger, generateId, ensureDir } from '@libero/core';
import { KnowledgeBase, attemptSelectorHealing, classifyError, suggestFix } from '@libero/learning';
import * as path from 'path';

export interface PlaywrightAdapterOptions {
  headless: boolean;
  baseUrl: string;
  timeout: number;
  retries: number;
  screenshotOnFail: boolean;
  traceOnFail: boolean;
  artifactsDir: string;
  knowledgeBasePath?: string;
  enableHealing?: boolean;
}

export class PlaywrightAdapter {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private kb: KnowledgeBase | null = null;

  async execute(plan: TestPlan, options: PlaywrightAdapterOptions): Promise<RunResult> {
    const runId = generateId('run');
    const startTime = Date.now();
    
    logger.info(`Starting Playwright run: ${runId}`);
    ensureDir(options.artifactsDir);

    if (options.knowledgeBasePath && options.enableHealing) {
      this.kb = new KnowledgeBase(options.knowledgeBasePath);
    }

    this.browser = await chromium.launch({ headless: options.headless });
    this.context = await this.browser.newContext({ baseURL: options.baseUrl });
    
    if (options.traceOnFail) {
      await this.context.tracing.start({ screenshots: true, snapshots: true });
    }

    const suiteResults: SuiteResult[] = [];
    
    for (const suite of plan.suites) {
      const suiteResult = await this.executeSuite(suite, options);
      suiteResults.push(suiteResult);
    }

    if (options.traceOnFail) {
      const tracePath = path.join(options.artifactsDir, `${runId}-trace.zip`);
      await this.context.tracing.stop({ path: tracePath });
    }

    await this.browser.close();

    if (this.kb) {
      await this.kb.close();
    }

    const summary = this.calculateSummary(suiteResults);
    const duration = Date.now() - startTime;

    logger.success(`Run complete: ${summary.passed}/${summary.totalTests} passed (${summary.passRate}%)`);

    return {
      runId,
      timestamp: new Date().toISOString(),
      config: {
        runner: 'playwright',
        parallel: false,
        workers: 1,
        retries: options.retries,
        timeout: options.timeout,
        browser: 'chromium',
        headless: options.headless,
        baseUrl: options.baseUrl,
      },
      suites: suiteResults,
      summary,
      artifacts: {
        screenshots: [],
        videos: [],
        traces: options.traceOnFail ? [`${runId}-trace.zip`] : [],
        logs: [],
        reports: [],
      },
      duration,
    };
  }

  private async executeSuite(suite: TestSuite, options: PlaywrightAdapterOptions): Promise<SuiteResult> {
    const testResults: TestResult[] = [];
    
    for (const testCase of suite.tests) {
      const result = await this.executeTest(testCase, options);
      testResults.push(result);
    }

    return {
      suiteId: suite.id,
      suiteName: suite.name,
      tests: testResults,
      duration: testResults.reduce((sum, r) => sum + r.duration, 0),
      passed: testResults.filter(r => r.status === 'pass').length,
      failed: testResults.filter(r => r.status === 'fail').length,
      skipped: testResults.filter(r => r.status === 'skip').length,
      flaky: testResults.filter(r => r.status === 'flaky').length,
    };
  }

  private async executeTest(testCase: TestCase, options: PlaywrightAdapterOptions): Promise<TestResult> {
    const startTime = Date.now();
    const page = await this.context!.newPage();
    
    logger.info(`Running: ${testCase.name}`);

    let status: 'pass' | 'fail' | 'flaky' = 'pass';
    let error: any = null;
    let retries = 0;
    const artifacts: string[] = [];

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        // Execute flow
        for (const step of testCase.flow) {
          await this.executeStep(step, page, options, testCase);
        }

        // Execute assertions
        for (const assertion of testCase.assertions) {
          await this.executeAssertion(assertion, page, testCase);
        }

        if (attempt > 0) {
          status = 'flaky'; // Passed after retry
        }

        // Record success in KB
        if (this.kb) {
          await this.kb.recordTestRun(testCase.id, testCase.name, true);
        }
        break;
      } catch (e) {
        error = e;
        retries = attempt + 1;
        
        // Record failure in KB
        if (this.kb) {
          const errorType = classifyError(String(e));
          await this.kb.recordFailure({
            testId: testCase.id,
            testName: testCase.name,
            route: testCase.tags.find(t => t.startsWith('/')) || undefined,
            errorType,
            errorMessage: String(e),
            selector: this.extractSelector(e),
            timestamp: new Date().toISOString(),
            resolved: false,
            suggestedFix: suggestFix(errorType),
          });
        }
        
        if (attempt < options.retries) {
          logger.warn(`Test failed (attempt ${attempt + 1}), retrying...`);
          await page.reload().catch(() => null);
        }
      }
    }

    let screenshotOnError: string | undefined;

    if (error && retries > options.retries) {
      status = 'fail';
      
      // Record failure run
      if (this.kb) {
        await this.kb.recordTestRun(testCase.id, testCase.name, false);
      }
      
      if (options.screenshotOnFail) {
        const screenshotPath = path.join(options.artifactsDir, `${testCase.id}-fail.png`);
        await page.screenshot({ path: screenshotPath }).catch(() => null);
        artifacts.push(screenshotPath);
        screenshotOnError = screenshotPath;
      }
    }

    await page.close();

    return {
      testId: testCase.id,
      testName: testCase.name,
      status,
      duration: Date.now() - startTime,
      retries,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      error: error ? {
        message: String(error),
        stack: error.stack,
        screenshot: screenshotOnError,
      } : undefined,
      artifacts,
    };
  }

  private async executeStep(step: TestStep, page: Page, options: PlaywrightAdapterOptions, testCase: TestCase): Promise<void> {
    const timeout = step.options?.timeout || options.timeout;

    switch (step.action) {
      case 'navigate':
        await page.goto(String(step.target), { waitUntil: 'domcontentloaded', timeout });
        if (step.options?.waitFor === 'networkidle') {
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
        }
        break;

      case 'click':
        await this.executeWithHealing(step, page, testCase, async (sel) => {
          await page.locator(sel).click({ timeout });
        });
        break;

      case 'fill':
        await this.executeWithHealing(step, page, testCase, async (sel) => {
          await page.locator(sel).fill(String(step.value), { timeout });
        });
        break;

      case 'select':
        await this.executeWithHealing(step, page, testCase, async (sel) => {
          await page.locator(sel).selectOption(String(step.value), { timeout });
        });
        break;

      case 'check':
        await this.executeWithHealing(step, page, testCase, async (sel) => {
          await page.locator(sel).check({ timeout });
        });
        break;

      case 'wait':
        await page.waitForTimeout(step.options?.timeout || 1000);
        break;

      case 'screenshot':
        const screenshotPath = path.join(options.artifactsDir, `${step.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;

      default:
        logger.warn(`Unknown step action: ${step.action}`);
    }
  }

  private async executeWithHealing(
    step: TestStep,
    page: Page,
    testCase: TestCase,
    action: (selector: string) => Promise<void>
  ): Promise<void> {
    const primarySelector = this.resolveSelector(step.target);
    
    try {
      await action(primarySelector);
    } catch (e) {
      // Try healing if enabled and target is ElementDescriptor
      if (this.kb && typeof step.target === 'object' && step.target && 'id' in step.target) {
        const element = step.target as ElementDescriptor;
        logger.warn(`Primary selector failed, attempting healing...`);
        
        const healingResult = await attemptSelectorHealing(
          element,
          this.kb,
          async (sel) => {
            try {
              await page.locator(sel).waitFor({ state: 'visible', timeout: 2000 });
              return true;
            } catch {
              return false;
            }
          },
          testCase.id
        );

        if (healingResult.success && healingResult.selector) {
          logger.success(`Healed selector: ${healingResult.selector}`);
          await action(healingResult.selector);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  private async executeAssertion(assertion: Assertion, page: Page, testCase: TestCase): Promise<void> {
    switch (assertion.type) {
      case 'visible':
        const primarySelector = this.resolveSelector(assertion.target);
        try {
          await page.locator(primarySelector).waitFor({ state: 'visible', timeout: 3000 });
        } catch (e) {
          // Try healing
          if (this.kb && typeof assertion.target === 'object' && assertion.target && 'id' in assertion.target) {
            const element = assertion.target as ElementDescriptor;
            const healingResult = await attemptSelectorHealing(
              element,
              this.kb,
              async (sel) => {
                try {
                  await page.locator(sel).waitFor({ state: 'visible', timeout: 2000 });
                  return true;
                } catch {
                  return false;
                }
              },
              testCase.id
            );
            if (!healingResult.success) throw e;
          } else {
            throw e;
          }
        }
        break;

      case 'url':
        const currentUrl = page.url();
        const expected = String(assertion.expected);
        if (assertion.operator === 'contains') {
          if (!currentUrl.includes(expected)) {
            throw new Error(`URL "${currentUrl}" does not contain "${expected}"`);
          }
        } else {
          if (currentUrl !== expected) {
            throw new Error(`URL mismatch: expected "${expected}", got "${currentUrl}"`);
          }
        }
        break;

      case 'text':
        const textTarget = this.resolveSelector(assertion.target);
        const text = await page.locator(textTarget).textContent();
        if (assertion.operator === 'contains' && !text?.includes(String(assertion.expected))) {
          throw new Error(`Text does not contain "${assertion.expected}"`);
        }
        break;

      default:
        logger.warn(`Unknown assertion type: ${assertion.type}`);
    }
  }

  private extractSelector(error: any): string | undefined {
    const msg = String(error);
    const match = msg.match(/locator\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : undefined;
  }

  private resolveSelector(target: any): string {
    if (typeof target === 'string') return target;
    if (target?.selector?.primary) return target.selector.primary;
    throw new Error('Invalid selector target');
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
