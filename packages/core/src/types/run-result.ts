/**
 * RunResult: Test execution results
 */

export interface RunResult {
  runId: string;
  timestamp: string;
  config: RunConfig;
  suites: SuiteResult[];
  summary: Summary;
  artifacts: ArtifactManifest;
  duration: number;
}

export interface RunConfig {
  runner: 'playwright' | 'selenium';
  parallel: boolean;
  workers: number;
  retries: number;
  timeout: number;
  browser: string;
  headless: boolean;
  baseUrl: string;
}

export interface SuiteResult {
  suiteId: string;
  suiteName: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
}

export interface TestResult {
  testId: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip' | 'flaky';
  duration: number;
  retries: number;
  startTime: string;
  endTime: string;
  error?: ErrorDetails;
  classification?: FailureClassification;
  suggestions?: FixSuggestion[];
  artifacts: string[];
  steps?: StepResult[];
}

export interface StepResult {
  stepId: string;
  action: string;
  status: 'pass' | 'fail';
  duration: number;
  screenshot?: string;
  error?: string;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  screenshot?: string;
  domSnapshot?: string;
  consoleLogs?: string[];
  networkLogs?: any[];
}

export interface FailureClassification {
  category: 'selector' | 'timing' | 'backend' | 'auth' | 'data' | 'visual' | 'network' | 'unknown';
  confidence: number;
  reason: string;
  evidence: Evidence[];
}

export interface Evidence {
  type: 'screenshot' | 'dom' | 'console' | 'network' | 'diff';
  content: string;
  description?: string;
}

export interface FixSuggestion {
  type: 'selector_update' | 'wait_increase' | 'auth_refresh' | 'data_seed' | 'retry' | 'skip';
  confidence: number;
  description: string;
  patch?: Patch;
  autoApplicable: boolean;
}

export interface Patch {
  file: string;
  oldSelector: string;
  newSelector: string;
  line?: number;
}

export interface Summary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  duration: number;
  coverage: Coverage;
}

export interface Coverage {
  routes: {
    total: number;
    covered: number;
    percentage: number;
  };
  elements: {
    total: number;
    interacted: number;
    percentage: number;
  };
  assertions: {
    total: number;
    passed: number;
    percentage: number;
  };
}

export interface ArtifactManifest {
  screenshots: string[];
  videos: string[];
  traces: string[];
  logs: string[];
  reports: string[];
}
