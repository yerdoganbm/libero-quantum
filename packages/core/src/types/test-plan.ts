/**
 * TestPlan: Generated test structure
 */

import { ElementDescriptor } from './app-graph';

export interface TestPlan {
  version: string;
  appName: string;
  timestamp: string;
  suites: TestSuite[];
  envMatrix?: EnvMatrix;
  config: TestPlanConfig;
}

export interface TestSuite {
  id: string;
  name: string;
  category: 'smoke' | 'regression' | 'edge' | 'exploratory' | 'visual' | 'a11y';
  tests: TestCase[];
  tags: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  flow: TestStep[];
  assertions: Assertion[];
  tags: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration?: number;
}

export interface TestStep {
  id: string;
  action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'screenshot' | 'check' | 'hover';
  target?: ElementDescriptor | string;
  value?: any;
  options?: StepOptions;
  description?: string;
}

export interface StepOptions {
  timeout?: number;
  waitFor?: 'visible' | 'attached' | 'networkidle' | 'load';
  retries?: number;
  screenshot?: boolean;
}

export interface Assertion {
  type: 'visible' | 'hidden' | 'text' | 'value' | 'url' | 'count' | 'exists' | 'attribute';
  target: ElementDescriptor | string;
  expected?: any;
  operator?: 'equals' | 'contains' | 'matches' | 'gt' | 'lt';
  description?: string;
}

export interface EnvMatrix {
  browsers: BrowserConfig[];
  locales?: string[];
  viewports?: ViewportConfig[];
  networkProfiles?: NetworkProfile[];
}

export interface BrowserConfig {
  name: 'chromium' | 'firefox' | 'webkit' | 'chrome' | 'edge';
  version?: string;
  headless: boolean;
}

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

export interface NetworkProfile {
  name: string;
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
}

export interface TestPlanConfig {
  seed?: number;
  coverageTarget: CoverageTarget;
  flakyRetries: number;
  screenshotOnFail: boolean;
  videoOnFail: boolean;
  traceOnFail: boolean;
}

export interface CoverageTarget {
  routes: number;
  interactiveElements: number;
  assertions: number;
}
