/**
 * Knowledge Base: sql.js-based learning store (no native dependencies)
 * Stores element signatures, selector alternatives, flaky stats, failures, repairs
 */

import initSqlJs, { Database } from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';

export interface ElementSignature {
  id: string;
  elementId: string; // from AppGraph
  role: string;
  text?: string;
  attributes: string; // JSON
  primarySelector: string;
  alternativeSelectors: string; // JSON array
  stability: number; // 0-1
  lastSeen: string;
  successCount: number;
  failCount: number;
}

export interface SelectorAttempt {
  id: number;
  signatureId: string;
  selector: string;
  success: boolean;
  timestamp: string;
  context?: string; // test case ID or route
}

export interface TestFailure {
  id: number;
  testId: string;
  testName: string;
  route?: string;
  errorType: string; // timeout, selector, navigation, overlay, auth, network
  errorMessage: string;
  selector?: string;
  timestamp: string;
  resolved: boolean;
  suggestedFix?: string;
}

export interface FlakyTest {
  testId: string;
  testName: string;
  totalRuns: number;
  failures: number;
  flakinessScore: number; // 0-1
  lastFailure?: string;
}

export class KnowledgeBase {
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async init(): Promise<void> {
    if (this.db) return;
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this.initSchema();
  }

  private initSchema(): void {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS element_signatures (
        id TEXT PRIMARY KEY,
        elementId TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT,
        attributes TEXT NOT NULL,
        primarySelector TEXT NOT NULL,
        alternativeSelectors TEXT NOT NULL,
        stability REAL NOT NULL DEFAULT 1.0,
        lastSeen TEXT NOT NULL,
        successCount INTEGER NOT NULL DEFAULT 0,
        failCount INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS selector_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signatureId TEXT NOT NULL,
        selector TEXT NOT NULL,
        success INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        context TEXT,
        FOREIGN KEY (signatureId) REFERENCES element_signatures(id)
      );

      CREATE TABLE IF NOT EXISTS test_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        testId TEXT NOT NULL,
        testName TEXT NOT NULL,
        route TEXT,
        errorType TEXT NOT NULL,
        errorMessage TEXT NOT NULL,
        selector TEXT,
        timestamp TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        suggestedFix TEXT
      );

      CREATE TABLE IF NOT EXISTS flaky_tests (
        testId TEXT PRIMARY KEY,
        testName TEXT NOT NULL,
        totalRuns INTEGER NOT NULL DEFAULT 0,
        failures INTEGER NOT NULL DEFAULT 0,
        flakinessScore REAL NOT NULL DEFAULT 0.0,
        lastFailure TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_signatures_elementId ON element_signatures(elementId);
      CREATE INDEX IF NOT EXISTS idx_attempts_signatureId ON selector_attempts(signatureId);
      CREATE INDEX IF NOT EXISTS idx_failures_testId ON test_failures(testId);
      CREATE INDEX IF NOT EXISTS idx_failures_errorType ON test_failures(errorType);
    `);
    this.save();
  }

  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, data);
  }

  // Element Signatures
  async upsertSignature(sig: Omit<ElementSignature, 'successCount' | 'failCount'>): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run(
      `INSERT INTO element_signatures (id, elementId, role, text, attributes, primarySelector, alternativeSelectors, stability, lastSeen, successCount, failCount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
       ON CONFLICT(id) DO UPDATE SET
         text = excluded.text,
         attributes = excluded.attributes,
         primarySelector = excluded.primarySelector,
         alternativeSelectors = excluded.alternativeSelectors,
         stability = excluded.stability,
         lastSeen = excluded.lastSeen`,
      [sig.id, sig.elementId, sig.role, sig.text || null, sig.attributes, sig.primarySelector, sig.alternativeSelectors, sig.stability, sig.lastSeen]
    );
    this.save();
  }

  async getSignature(id: string): Promise<ElementSignature | null> {
    await this.init();
    if (!this.db) return null;
    const result = this.db.exec('SELECT * FROM element_signatures WHERE id = ?', [id]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToSignature(result[0].columns, result[0].values[0]);
  }

  async getSignatureByElementId(elementId: string): Promise<ElementSignature | null> {
    await this.init();
    if (!this.db) return null;
    const result = this.db.exec('SELECT * FROM element_signatures WHERE elementId = ? ORDER BY lastSeen DESC LIMIT 1', [elementId]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToSignature(result[0].columns, result[0].values[0]);
  }

  async incrementSuccess(signatureId: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run('UPDATE element_signatures SET successCount = successCount + 1 WHERE id = ?', [signatureId]);
    this.save();
  }

  async incrementFail(signatureId: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run('UPDATE element_signatures SET failCount = failCount + 1 WHERE id = ?', [signatureId]);
    this.save();
  }

  // Selector Attempts
  async recordAttempt(attempt: Omit<SelectorAttempt, 'id'>): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run(
      `INSERT INTO selector_attempts (signatureId, selector, success, timestamp, context) VALUES (?, ?, ?, ?, ?)`,
      [attempt.signatureId, attempt.selector, attempt.success ? 1 : 0, attempt.timestamp, attempt.context || null]
    );
    this.save();
  }

  async getRecentAttempts(signatureId: string, limit = 10): Promise<SelectorAttempt[]> {
    await this.init();
    if (!this.db) return [];
    const result = this.db.exec('SELECT * FROM selector_attempts WHERE signatureId = ? ORDER BY timestamp DESC LIMIT ?', [signatureId, limit]);
    if (!result.length) return [];
    return result[0].values.map((v) => this.rowToAttempt(result[0].columns, v));
  }

  // Test Failures
  async recordFailure(failure: Omit<TestFailure, 'id'>): Promise<number> {
    await this.init();
    if (!this.db) return 0;
    this.db.run(
      `INSERT INTO test_failures (testId, testName, route, errorType, errorMessage, selector, timestamp, resolved, suggestedFix)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [failure.testId, failure.testName, failure.route || null, failure.errorType, failure.errorMessage, failure.selector || null, failure.timestamp, failure.resolved ? 1 : 0, failure.suggestedFix || null]
    );
    this.save();
    return 1;
  }

  async getFailuresByType(errorType: string, limit = 50): Promise<TestFailure[]> {
    await this.init();
    if (!this.db) return [];
    const result = this.db.exec('SELECT * FROM test_failures WHERE errorType = ? AND resolved = 0 ORDER BY timestamp DESC LIMIT ?', [errorType, limit]);
    if (!result.length) return [];
    return result[0].values.map((v) => this.rowToFailure(result[0].columns, v));
  }

  async markFailureResolved(id: number): Promise<void> {
    await this.init();
    if (!this.db) return;
    this.db.run('UPDATE test_failures SET resolved = 1 WHERE id = ?', [id]);
    this.save();
  }

  // Flaky Tests
  async recordTestRun(testId: string, testName: string, passed: boolean): Promise<void> {
    await this.init();
    if (!this.db) return;
    const existing = this.db.exec('SELECT * FROM flaky_tests WHERE testId = ?', [testId]);
    if (!existing.length || !existing[0].values.length) {
      const lastFail = passed ? null : new Date().toISOString();
      this.db.run(
        'INSERT INTO flaky_tests (testId, testName, totalRuns, failures, flakinessScore, lastFailure) VALUES (?, ?, 1, ?, ?, ?)',
        [testId, testName, passed ? 0 : 1, passed ? 0.0 : 1.0, lastFail || null]
      );
    } else {
      const row = this.rowToFlaky(existing[0].columns, existing[0].values[0]);
      const totalRuns = row.totalRuns + 1;
      const failures = row.failures + (passed ? 0 : 1);
      const flakinessScore = failures / totalRuns;
      const lastFail = passed ? (row.lastFailure || null) : new Date().toISOString();
      this.db.run(
        'UPDATE flaky_tests SET totalRuns = ?, failures = ?, flakinessScore = ?, lastFailure = ? WHERE testId = ?',
        [totalRuns, failures, flakinessScore, lastFail || null, testId]
      );
    }
    this.save();
  }

  async getFlakyTests(threshold = 0.1, limit = 20): Promise<FlakyTest[]> {
    await this.init();
    if (!this.db) return [];
    const result = this.db.exec('SELECT * FROM flaky_tests WHERE flakinessScore >= ? AND totalRuns >= 3 ORDER BY flakinessScore DESC LIMIT ?', [threshold, limit]);
    if (!result.length) return [];
    return result[0].values.map((v) => this.rowToFlaky(result[0].columns, v));
  }

  async close(): Promise<void> {
    this.save();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private rowToSignature(columns: string[], values: any[]): ElementSignature {
    const obj: any = {};
    columns.forEach((col, i) => (obj[col] = values[i]));
    return obj as ElementSignature;
  }

  private rowToAttempt(columns: string[], values: any[]): SelectorAttempt {
    const obj: any = {};
    columns.forEach((col, i) => (obj[col] = values[i]));
    return obj as SelectorAttempt;
  }

  private rowToFailure(columns: string[], values: any[]): TestFailure {
    const obj: any = {};
    columns.forEach((col, i) => (obj[col] = values[i]));
    return obj as TestFailure;
  }

  private rowToFlaky(columns: string[], values: any[]): FlakyTest {
    const obj: any = {};
    columns.forEach((col, i) => (obj[col] = values[i]));
    return obj as FlakyTest;
  }
}
