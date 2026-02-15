/**
 * HTML Reporter - Generates interactive HTML report
 */

import { RunResult } from '@libero/core';
import { classifyError } from '@libero/learning';
import { writeFile, logger, ensureDir } from '@libero/core';
import * as path from 'path';

export class HtmlReporter {
  generate(result: RunResult, outputDir: string): string {
    ensureDir(outputDir);
    const filePath = path.join(outputDir, 'index.html');
    
    const html = this.buildHtml(result);
    writeFile(filePath, html);
    
    logger.success(`HTML report: ${filePath}`);
    return filePath;
  }

  private buildHtml(result: RunResult): string {
    const passed = result.summary.passed;
    const failed = result.summary.failed;
    const total = result.summary.totalTests;
    const passRate = result.summary.passRate;
    
    const statusColor = passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';

    const rcaBuckets = new Map<string, number>();
    for (const suite of result.suites) {
      for (const test of suite.tests) {
        if (!test.error?.message) continue;
        const category = test.classification?.category || classifyError(test.error.message);
        rcaBuckets.set(category, (rcaBuckets.get(category) || 0) + 1);
      }
    }

    const rcaHtml = Array.from(rcaBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => `<span class="stat">🧠 ${category}: ${count}</span>`)
      .join('');

    const testsHtml = result.suites.map(suite => `
      <div class="suite">
        <h2>📦 ${suite.suiteName}</h2>
        <div class="suite-stats">
          <span class="stat pass">✅ ${suite.passed}</span>
          <span class="stat fail">❌ ${suite.failed}</span>
          <span class="stat flaky">⚠️ ${suite.flaky}</span>
          <span class="stat">⏱️ ${(suite.duration / 1000).toFixed(2)}s</span>
        </div>
        <table class="tests">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Retries</th>
            </tr>
          </thead>
          <tbody>
            ${suite.tests.map(test => `
              <tr class="test-row ${test.status}">
                <td>${test.testName}</td>
                <td><span class="badge ${test.status}">${test.status.toUpperCase()}</span></td>
                <td>${test.duration}ms</td>
                <td>${test.retries}</td>
              </tr>
              ${test.error ? `
                <tr class="error-row">
                  <td colspan="4">
                    <div class="error">
                      <strong>Error:</strong> ${test.error.message}
                      ${test.error.screenshot ? `<br><img src="${test.error.screenshot}" style="max-width: 400px; margin-top: 10px;" />` : ''}
                      ${test.artifacts?.length ? `<br><strong>Artifacts:</strong> ${test.artifacts.map((a) => `<a href="${a}">${a.split('/').pop()}</a>`).join(', ')}` : ''}
                    </div>
                  </td>
                </tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Libero Quantum Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #334155; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #94a3b8; margin-bottom: 1rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .summary-card { background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; }
    .summary-card h3 { font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 2rem; font-weight: bold; color: ${statusColor}; }
    .suite { background: #1e293b; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #334155; }
    .suite h2 { margin-bottom: 1rem; color: #f1f5f9; }
    .suite-stats { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .stat { padding: 0.5rem 1rem; background: #0f172a; border-radius: 6px; font-size: 0.875rem; }
    .stat.pass { background: #10b98120; color: #10b981; }
    .stat.fail { background: #ef444420; color: #ef4444; }
    .stat.flaky { background: #f59e0b20; color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.75rem; background: #0f172a; color: #94a3b8; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 0.75rem; border-top: 1px solid #334155; }
    .test-row.pass { background: #10b98105; }
    .test-row.fail { background: #ef444405; }
    .test-row.flaky { background: #f59e0b05; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.pass { background: #10b981; color: #fff; }
    .badge.fail { background: #ef4444; color: #fff; }
    .badge.flaky { background: #f59e0b; color: #fff; }
    .badge.skip { background: #6b7280; color: #fff; }
    .error-row { background: #ef444410; }
    .error { padding: 1rem; background: #0f172a; border-radius: 6px; font-size: 0.875rem; color: #fca5a5; font-family: 'Courier New', monospace; }
    .error a { color: #93c5fd; }
    .footer { text-align: center; margin-top: 3rem; color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌌 Libero Quantum Test Report</h1>
    <div class="subtitle">Run ID: ${result.runId} | ${new Date(result.timestamp).toLocaleString()}</div>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Pass Rate</h3>
        <div class="value">${passRate}%</div>
      </div>
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${total}</div>
      </div>
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value" style="color: #10b981;">${passed}</div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value" style="color: #ef4444;">${failed}</div>
      </div>
      <div class="summary-card">
        <h3>Duration</h3>
        <div class="value" style="color: #60a5fa; font-size: 1.5rem;">${(result.duration / 1000).toFixed(1)}s</div>
      </div>
    </div>
  </div>

  ${rcaHtml ? `<div class="suite"><h2>🧩 RCA Categories</h2><div class="suite-stats">${rcaHtml}</div></div>` : ''}

  ${testsHtml}

  <div class="footer">
    <p>Generated by <strong>Libero Quantum v6.0</strong> | Powered by ${result.config.runner}</p>
    <p style="margin-top: 0.5rem; color: #475569;">https://github.com/yerdoganbm/libero-quantum</p>
  </div>
</body>
</html>`;
  }
}
