/**
 * JUnit XML Reporter - for CI integration
 */

import { RunResult, SuiteResult, TestResult } from '@libero/core';
import { ensureDir, writeFile } from '@libero/core';
import * as path from 'path';

export class JUnitReporter {
  generate(result: RunResult, outputDir: string): string {
    ensureDir(outputDir);
    const xmlPath = path.join(outputDir, 'junit.xml');

    const xml = this.buildXml(result);
    writeFile(xmlPath, xml);

    return xmlPath;
  }

  private buildXml(result: RunResult): string {
    const totalTests = result.summary.totalTests;
    const failures = result.summary.failed;
    const skipped = result.summary.skipped;
    const time = (result.duration / 1000).toFixed(3);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites name="${result.config.runner}" tests="${totalTests}" failures="${failures}" skipped="${skipped}" time="${time}" timestamp="${result.timestamp}">\n`;

    for (const suite of result.suites) {
      xml += this.buildSuiteXml(suite);
    }

    xml += `</testsuites>\n`;
    return xml;
  }

  private buildSuiteXml(suite: SuiteResult): string {
    const time = (suite.duration / 1000).toFixed(3);
    let xml = `  <testsuite name="${this.escape(suite.suiteName)}" tests="${suite.tests.length}" failures="${suite.failed}" skipped="${suite.skipped}" time="${time}">\n`;

    for (const test of suite.tests) {
      xml += this.buildTestXml(test);
    }

    xml += `  </testsuite>\n`;
    return xml;
  }

  private buildTestXml(test: TestResult): string {
    const time = (test.duration / 1000).toFixed(3);
    const className = test.testName.split(' - ')[0] || 'Test';
    const testName = test.testName;

    let xml = `    <testcase classname="${this.escape(className)}" name="${this.escape(testName)}" time="${time}">\n`;

    if (test.status === 'fail' && test.error) {
      xml += `      <failure message="${this.escape(test.error.message)}">\n`;
      xml += this.escape(test.error.stack || test.error.message);
      xml += `\n      </failure>\n`;
    }

    if (test.status === 'skip') {
      xml += `      <skipped />\n`;
    }

    if (test.retries > 0) {
      xml += `      <!-- Retries: ${test.retries} -->\n`;
    }

    xml += `    </testcase>\n`;
    return xml;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
