/**
 * Config: Libero configuration
 */

export interface LiberoConfig {
  version: string;
  appName: string;
  baseUrl: string;
  framework?: FrameworkType;
  buildTool?: BuildTool;
  
  // Mapping
  mapping: MappingConfig;
  
  // Generation
  generation: GenerationConfig;
  
  // Execution
  execution: ExecutionConfig;
  
  // Reporting
  reporting: ReportingConfig;
  
  // Learning
  learning: LearningConfig;
  
  // Auth (optional)
  auth?: AuthConfig;
  
  // Custom selectors hint
  selectors?: SelectorsHint;
}

export type FrameworkType = 'react' | 'vue' | 'angular' | 'svelte' | 'nextjs' | 'nuxt' | 'vanilla';
export type BuildTool = 'vite' | 'webpack' | 'cra' | 'next' | 'parcel' | 'rollup';

export interface MappingConfig {
  method: 'static' | 'dynamic' | 'hybrid';
  maxDepth: number;
  maxPages: number;
  timeout: number;
  followExternalLinks: boolean;
  captureScreenshots: boolean;
}

export interface GenerationConfig {
  categories: Array<'smoke' | 'regression' | 'edge' | 'exploratory' | 'visual' | 'a11y'>;
  coverageTargets: {
    routes: number;
    elements: number;
    forms: number;
    assertions: number;
    flows: number;
  };
  edgeCases: boolean;
  visualRegression: boolean;
  accessibility: boolean;
}

export interface ExecutionConfig {
  runner: 'playwright' | 'selenium' | 'both';
  browsers: string[];
  headless: boolean;
  parallel: boolean;
  workers: number;
  retries: number;
  timeout: number;
  screenshotOnFail: boolean;
  videoOnFail: boolean;
  traceOnFail: boolean;
  
  // Selenium specific
  selenium?: {
    gridUrl?: string;
    capabilities?: Record<string, any>;
  };
}

export interface ReportingConfig {
  formats: Array<'html' | 'json' | 'junit' | 'allure'>;
  outputDir: string;
  openOnComplete: boolean;
  includeArtifacts: boolean;
}

export interface LearningConfig {
  enabled: boolean;
  kbPath: string;
  autoHeal: boolean;
  autoHealConfidenceThreshold: number;
  trackFlaky: boolean;
  adaptiveExploration: boolean;
}

export interface AuthConfig {
  strategy: 'none' | 'basic' | 'session' | 'oauth' | 'custom';
  loginUrl?: string;
  credentials?: {
    username: string;
    password: string;
  };
  sessionSetup?: string; // Path to custom auth script
}

export interface SelectorsHint {
  dataTestIdAttribute?: string;
  preferredStrategies?: Array<'data-testid' | 'role' | 'label' | 'css' | 'xpath'>;
  blacklist?: string[]; // Selectors to avoid
}

export const DEFAULT_CONFIG: Partial<LiberoConfig> = {
  version: '6.0.0',
  mapping: {
    method: 'hybrid',
    maxDepth: 3,
    maxPages: 50,
    timeout: 30000,
    followExternalLinks: false,
    captureScreenshots: true,
  },
  generation: {
    categories: ['smoke', 'regression'],
    coverageTargets: {
      routes: 90,
      elements: 70,
      forms: 80,
      assertions: 2,
      flows: 3,
    },
    edgeCases: true,
    visualRegression: false,
    accessibility: false,
  },
  execution: {
    runner: 'playwright',
    browsers: ['chromium'],
    headless: true,
    parallel: true,
    workers: 4,
    retries: 2,
    timeout: 30000,
    screenshotOnFail: true,
    videoOnFail: false,
    traceOnFail: true,
  },
  reporting: {
    formats: ['html', 'json'],
    outputDir: '.libero/reports',
    openOnComplete: false,
    includeArtifacts: true,
  },
  learning: {
    enabled: true,
    kbPath: '.libero/knowledge-base.db',
    autoHeal: false,
    autoHealConfidenceThreshold: 0.85,
    trackFlaky: true,
    adaptiveExploration: true,
  },
  auth: {
    strategy: 'none',
  },
};
