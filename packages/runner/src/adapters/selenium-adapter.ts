/**
 * Selenium Adapter - Feature parity with Playwright
 */

import { Builder, WebDriver, By, until, WebElement } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { TestPlan, TestSuite, TestCase, TestStep, Assertion, RunResult, SuiteResult, TestResult, ElementDescriptor } from '@libero/core';
import { logger, generateId, ensureDir } from '@libero/core';
import { KnowledgeBase, attemptSelectorHealing, classifyError, suggestFix } from '@libero/learning';
import * as path from 'path';
import * as fs from 'fs';

export interface SeleniumAdapterOptions {
  headless: boolean;
  baseUrl: string;
  timeout: number;
  retries: number;
  screenshotOnFail: boolean;
  artifactsDir: string;
  browser: 'chrome' | 'firefox' | 'edge';
  gridUrl?: string;
  capabilities?: Record<string, any>;
  knowledgeBasePath?: string;
  enableHealing?: boolean;
}

export class SeleniumAdapter {
  private driver: WebDriver | null = null;
  private kb: KnowledgeBase | null = null;

  async execute(plan: TestPlan, options: SeleniumAdapterOptions): Promise<RunResult> {
    const runId = generateId('run');
    const startTime = Date.now();

    logger.info(`Starting Selenium run: ${runId} (${options.browser})`);
    ensureDir(options.artifactsDir);

    if (options.knowledgeBasePath && options.enableHealing) {
      this.kb = new KnowledgeBase(options.knowledgeBasePath);
    }

    this.driver = await this.buildDriver(options);

    await this.driver.manage().setTimeouts({ implicit: 1000, pageLoad: options.timeout, script: options.timeout });

    const suiteResults: SuiteResult[] = [];

    for (const suite of plan.suites) {
      const suiteResult = await this.executeSuite(suite, options);
      suiteResults.push(suiteResult);
    }

    await this.driver.quit();

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
        runner: 'selenium',
        parallel: false,
        workers: 1,
        retries: options.retries,
        timeout: options.timeout,
        browser: options.browser,
        headless: options.headless,
        baseUrl: options.baseUrl,
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



  private async buildDriver(options: SeleniumAdapterOptions): Promise<WebDriver> {
    const builder = new Builder().forBrowser(options.browser);

    if (options.gridUrl) {
      const remoteCaps = {
        browserName: options.browser,
        ...(options.capabilities || {}),
      };

      return builder
        .usingServer(options.gridUrl)
        .withCapabilities(remoteCaps as any)
        .build();
    }

    const chromeOptions = new chrome.Options();
    if (options.headless) {
      chromeOptions.addArguments('--headless=new', '--disable-gpu');
    }
    chromeOptions.addArguments('--no-sandbox', '--disable-dev-shm-usage');

    if (options.browser === 'chrome') {
      builder.setChromeOptions(chromeOptions);
    }

    return builder.build();
  }
  private async executeSuite(suite: TestSuite, options: SeleniumAdapterOptions): Promise<SuiteResult> {
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
      passed: testResults.filter((r) => r.status === 'pass').length,
      failed: testResults.filter((r) => r.status === 'fail').length,
      skipped: testResults.filter((r) => r.status === 'skip').length,
      flaky: testResults.filter((r) => r.status === 'flaky').length,
    };
  }

  private async executeTest(testCase: TestCase, options: SeleniumAdapterOptions): Promise<TestResult> {
    const startTime = Date.now();
    logger.info(`Running: ${testCase.name}`);

    let status: 'pass' | 'fail' | 'flaky' = 'pass';
    let error: any = null;
    let retries = 0;
    const artifacts: string[] = [];

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        // Execute flow
        for (const step of testCase.flow) {
          await this.executeStep(step, options, testCase);
        }

        // Execute assertions
        for (const assertion of testCase.assertions) {
          await this.executeAssertion(assertion, testCase);
        }

        if (attempt > 0) {
          status = 'flaky';
        }

        if (this.kb) {
          await this.kb.recordTestRun(testCase.id, testCase.name, true);
        }
        break;
      } catch (e) {
        error = e;
        retries = attempt + 1;

        if (this.kb) {
          const errorType = classifyError(String(e));
            await this.kb.recordFailure({
              testId: testCase.id,
              testName: testCase.name,
              route: testCase.tags.find((t) => t.startsWith('/')) || undefined,
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
          await this.driver!.navigate().refresh().catch(() => null);
        }
      }
    }

    let screenshotOnError: string | undefined;

    if (error && retries > options.retries) {
      status = 'fail';

      if (this.kb) {
        await this.kb.recordTestRun(testCase.id, testCase.name, false);
      }

      if (options.screenshotOnFail) {
        const screenshotPath = path.join(options.artifactsDir, `${testCase.id}-fail.png`);
        const screenshot = await this.driver!.takeScreenshot().catch(() => null);
        if (screenshot) {
          fs.writeFileSync(screenshotPath, screenshot, 'base64');
          artifacts.push(screenshotPath);
          screenshotOnError = screenshotPath;
        }
      }
    }

    return {
      testId: testCase.id,
      testName: testCase.name,
      status,
      duration: Date.now() - startTime,
      retries,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      error: error
        ? {
            message: String(error),
            stack: error.stack,
            screenshot: screenshotOnError,
          }
        : undefined,
      artifacts,
    };
  }

  private async executeStep(step: TestStep, options: SeleniumAdapterOptions, testCase: TestCase): Promise<void> {
    const timeout = step.options?.timeout || options.timeout;

    switch (step.action) {
      case 'navigate':
        await this.driver!.get(String(step.target));
        if (step.options?.waitFor === 'networkidle') {
          await this.driver!.sleep(1000); // Selenium doesn't have built-in network idle wait
        }
        break;

      case 'click':
        await this.executeWithHealing(step, testCase, async (sel) => {
          const element = await this.findElement(sel, timeout);
          await element.click();
        });
        break;

      case 'fill':
        await this.executeWithHealing(step, testCase, async (sel) => {
          const element = await this.findElement(sel, timeout);
          await element.clear();
          await element.sendKeys(String(step.value));
        });
        break;

      case 'select':
        await this.executeWithHealing(step, testCase, async (sel) => {
          const element = await this.findElement(sel, timeout);
          await element.sendKeys(String(step.value));
        });
        break;

      case 'check':
        await this.executeWithHealing(step, testCase, async (sel) => {
          const element = await this.findElement(sel, timeout);
          const selected = await element.isSelected();
          if (!selected) await element.click();
        });
        break;

      case 'wait':
        await this.driver!.sleep(step.options?.timeout || 1000);
        break;

      case 'screenshot':
        const screenshotPath = path.join(options.artifactsDir, `${step.id}.png`);
        const screenshot = await this.driver!.takeScreenshot();
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        break;

      default:
        logger.warn(`Unknown step action: ${step.action}`);
    }
  }

  private async executeWithHealing(
    step: TestStep,
    testCase: TestCase,
    action: (selector: string) => Promise<void>
  ): Promise<void> {
    const primarySelector = this.resolveSelector(step.target);

    try {
      await action(primarySelector);
    } catch (e) {
      if (this.kb && typeof step.target === 'object' && step.target && 'id' in step.target) {
        const element = step.target as ElementDescriptor;
        logger.warn(`Primary selector failed, attempting healing...`);

        const healingResult = await attemptSelectorHealing(
          element,
          this.kb,
          async (sel) => {
            try {
              await this.findElement(sel, 2000);
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

  private async executeAssertion(assertion: Assertion, testCase: TestCase): Promise<void> {
    switch (assertion.type) {
      case 'visible':
        const primarySelector = this.resolveSelector(assertion.target);
        try {
          const element = await this.findElement(primarySelector, 3000);
          const displayed = await element.isDisplayed();
          if (!displayed) throw new Error(`Element ${primarySelector} is not visible`);
        } catch (e) {
          if (this.kb && typeof assertion.target === 'object' && assertion.target && 'id' in assertion.target) {
            const element = assertion.target as ElementDescriptor;
            const healingResult = await attemptSelectorHealing(
              element,
              this.kb,
              async (sel) => {
                try {
                  const el = await this.findElement(sel, 2000);
                  return await el.isDisplayed();
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
        const currentUrl = await this.driver!.getCurrentUrl();
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
        const element = await this.findElement(textTarget, 3000);
        const text = await element.getText();
        if (assertion.operator === 'contains' && !text?.includes(String(assertion.expected))) {
          throw new Error(`Text does not contain "${assertion.expected}"`);
        }
        break;

      default:
        logger.warn(`Unknown assertion type: ${assertion.type}`);
    }
  }

  private async findElement(selector: string, timeout: number): Promise<WebElement> {
    const by = this.selectorToBy(selector);
    await this.driver!.wait(until.elementLocated(by), timeout);
    return await this.driver!.findElement(by);
  }

  private selectorToBy(selector: string): By {
    if (selector.startsWith('//') || selector.startsWith('(//')) {
      return By.xpath(selector);
    }
    if (selector.startsWith('#')) {
      return By.id(selector.slice(1));
    }
    if (selector.includes('[') && selector.includes('=')) {
      const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
      if (match) {
        return By.css(selector);
      }
    }
    return By.css(selector);
  }

  private resolveSelector(target: any): string {
    if (typeof target === 'string') return target;
    if (target?.selector?.primary) return target.selector.primary;
    throw new Error('Invalid selector target');
  }

  private extractSelector(error: any): string | undefined {
    const msg = String(error);
    const match = msg.match(/no such element: Unable to locate element: (.+)/);
    return match ? match[1] : undefined;
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
