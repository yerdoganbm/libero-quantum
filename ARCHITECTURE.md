# LIBERO QUANTUM - ARCHITECTURE v6.0 (PRODUCTION)

**Status:** In Development (M1-M6 Milestones)  
**Goal:** Transform from demo/prototype → Production-ready autonomous testing platform

---

## 📋 PRODUCT VISION

Libero Quantum is an **autonomous testing platform** that:
1. **Auto-discovers** your app (sitemap, routes, components, flows)
2. **Generates intelligent test scenarios** (smoke, regression, edge-cases, exploratory)
3. **Executes tests** on Playwright + Selenium (Grid/Remote support)
4. **Reports with root-cause analysis** (failure classification, auto-heal suggestions)
5. **Learns and self-improves** (selector stability, coverage gaps, flaky detection)
6. **Scales to production** (CI/CD integration, parallel execution, artifacts)

**NOT a demo.** Real product, real coverage, real value.

---

## 🏗️ MONOREPO STRUCTURE

```
libero-quantum/
├── packages/
│   ├── cli/                    # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── map.ts
│   │   │   │   ├── generate.ts
│   │   │   │   ├── run.ts
│   │   │   │   └── report.ts
│   │   │   ├── config/
│   │   │   │   ├── detector.ts          # Framework detection
│   │   │   │   ├── generator.ts         # Config file generator
│   │   │   │   └── templates/
│   │   │   ├── index.ts
│   │   │   └── cli.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agent/                  # App mapping & crawling
│   │   ├── src/
│   │   │   ├── crawler/
│   │   │   │   ├── playwright-crawler.ts
│   │   │   │   ├── static-analyzer.ts   # Route config parser
│   │   │   │   └── hybrid-crawler.ts
│   │   │   ├── graph/
│   │   │   │   ├── app-graph.ts          # AppGraph data structure
│   │   │   │   ├── node-factory.ts
│   │   │   │   └── edge-factory.ts
│   │   │   ├── instrumentation/
│   │   │   │   ├── dom-inspector.ts
│   │   │   │   ├── element-extractor.ts
│   │   │   │   └── signature-generator.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── generator/              # Test generation engine
│   │   ├── src/
│   │   │   ├── planner/
│   │   │   │   ├── flow-synthesizer.ts  # Critical user journeys
│   │   │   │   ├── edge-case-generator.ts
│   │   │   │   └── coverage-planner.ts
│   │   │   ├── dsl/
│   │   │   │   ├── test-plan.ts          # DSL schema
│   │   │   │   ├── compiler.ts           # DSL → Playwright/Selenium
│   │   │   │   └── templates/
│   │   │   ├── selector/
│   │   │   │   ├── strategy.ts           # Selector priority logic
│   │   │   │   ├── semantic-extractor.ts
│   │   │   │   └── stability-scorer.ts
│   │   │   ├── assertion/
│   │   │   │   ├── assertion-generator.ts
│   │   │   │   └── smart-waits.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── runner/                 # Test execution orchestrator
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── playwright-adapter.ts
│   │   │   │   ├── selenium-adapter.ts
│   │   │   │   └── base-adapter.ts
│   │   │   ├── executor/
│   │   │   │   ├── orchestrator.ts       # Parallel + retry logic
│   │   │   │   ├── shard-manager.ts
│   │   │   │   └── artifact-collector.ts
│   │   │   ├── matrix/
│   │   │   │   ├── quantum-universe.ts   # Browser x locale x viewport
│   │   │   │   └── matrix-builder.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── reporting/              # Report generation & analysis
│   │   ├── src/
│   │   │   ├── parser/
│   │   │   │   ├── result-parser.ts
│   │   │   │   └── artifact-parser.ts
│   │   │   ├── classifier/
│   │   │   │   ├── failure-classifier.ts # Selector/timing/backend/auth
│   │   │   │   ├── root-cause-engine.ts
│   │   │   │   └── fix-suggester.ts
│   │   │   ├── formats/
│   │   │   │   ├── html-reporter.ts
│   │   │   │   ├── junit-reporter.ts
│   │   │   │   ├── json-reporter.ts
│   │   │   │   └── allure-reporter.ts
│   │   │   ├── dashboard/
│   │   │   │   └── html-templates/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── learning/               # Knowledge base & self-improvement
│   │   ├── src/
│   │   │   ├── kb/
│   │   │   │   ├── knowledge-base.ts     # SQLite/JSON store
│   │   │   │   ├── selector-tracker.ts
│   │   │   │   └── flaky-tracker.ts
│   │   │   ├── healing/
│   │   │   │   ├── selector-healer.ts
│   │   │   │   └── confidence-scorer.ts
│   │   │   ├── evolution/
│   │   │   │   ├── coverage-analyzer.ts
│   │   │   │   ├── gap-detector.ts
│   │   │   │   └── adaptive-explorer.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                 # Optional web dashboard
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── routes.ts
│   │   │   │   └── controllers/
│   │   │   ├── ui/
│   │   │   │   └── static/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── core/                   # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── app-graph.ts
│       │   │   ├── test-plan.ts
│       │   │   ├── run-result.ts
│       │   │   └── config.ts
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   ├── file.ts
│       │   │   └── hash.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── examples/                    # Sample apps for testing
│   ├── react-vite/
│   ├── nextjs/
│   ├── vue/
│   └── vanilla/
│
├── docs/                        # Documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── config-reference.md
│   ├── api.md
│   └── examples/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── package.json                 # Root workspace config
├── tsconfig.json               # Root TS config
├── turbo.json                  # Monorepo build orchestration
├── ARCHITECTURE.md             # This file
├── README.md
└── LICENSE

```

---

## 🎯 MILESTONES

### M1: Foundation (CLI + Basic Mapping + Smoke Tests)
**Goal:** User can run `npx libero test` and get basic smoke tests

**Deliverables:**
- CLI commands: init, map, generate, run
- Framework detection (React/Vue/Next/Vite)
- Basic AppGraph (static route + headless crawl)
- Smoke test generation (navigate + visible assertions)
- Playwright runner
- HTML + JSON report

**Acceptance:**
- `npx libero-init` creates config
- `npx libero map` generates AppGraph with 5+ routes
- `npx libero generate` creates 10+ smoke tests
- `npx libero run` executes tests, 80%+ pass rate
- Report shows route coverage

---

### M2: Smart Generation + Coverage
**Goal:** Deep test coverage with edge cases

**Deliverables:**
- Robust selector strategy (data-testid → role → CSS)
- Form detection + auto-fill with validation
- Edge-case generator (invalid inputs, empty states)
- Flow synthesizer (auth → dashboard → action)
- Coverage metrics (route %, element %, assertion density)

**Acceptance:**
- 50+ tests generated (smoke + regression + edge)
- Form tests with validation assertions
- Auth flow tests
- Coverage report: routes 90%+, interactive elements 70%+

---

### M3: Selenium + Grid + Unified Execution
**Goal:** Enterprise-grade execution (Selenium Grid, BrowserStack, etc.)

**Deliverables:**
- Selenium adapter (Selenium 4 + W3C)
- Grid/Remote URL support
- Unified DSL → Playwright + Selenium
- Parallelization + sharding
- Matrix execution (browser × locale × viewport)
- Artifact collection (screenshots, logs, traces, HAR)

**Acceptance:**
- Same tests run on Playwright + Selenium
- Remote Grid execution
- 5x speedup with parallelization
- Artifacts in `.libero/artifacts/`

---

### M4: Reporting + Root Cause + Auto-Heal
**Goal:** Actionable insights and self-healing

**Deliverables:**
- Failure classifier (selector/timing/backend/auth/data)
- Root-cause engine (DOM diff, screenshot diff, console errors)
- Fix suggester with confidence scores
- HTML dashboard (interactive)
- JUnit XML + Allure support
- Flaky detection

**Acceptance:**
- Failure gets classified (e.g., "Selector broken: 85% confidence")
- Suggested fix: "Update selector from `.btn` to `[data-testid='submit']`"
- Flaky tests tagged
- HTML report with screenshots, traces, suggestions

---

### M5: Learning Loop + Self-Improvement
**Goal:** Tests improve over time

**Deliverables:**
- Knowledge Base (SQLite)
- Selector stability tracker
- AppGraph versioning + diff
- Adaptive exploration (coverage gaps → more tests)
- Impacted test selection (changed files → related tests)
- Auto-heal mode (apply high-confidence fixes)

**Acceptance:**
- 2nd run: selector healing suggestions applied
- Coverage gaps detected → new tests generated
- Flaky hotspots identified
- Smart test selection: only 30% tests run for minor change

---

### M6: Dashboard + Auto-Fix PR
**Goal:** Optional web UI + GitHub integration

**Deliverables:**
- Web dashboard (Express + React)
- Trend charts (pass rate, coverage, flaky rate)
- Auto-fix PR workflow (create branch, commit, open PR)
- CI/CD templates (GitHub Actions, GitLab CI)

**Acceptance:**
- Dashboard at `http://localhost:3001`
- Auto-fix creates PR on GitHub
- CI runs tests on every push

---

## 📊 DATA MODELS

### AppGraph Schema
```typescript
interface AppGraph {
  version: string;
  appName: string;
  baseUrl: string;
  timestamp: string;
  nodes: AppNode[];
  edges: AppEdge[];
  signatures: Record<string, Signature>;
}

interface AppNode {
  id: string;
  type: 'route' | 'component' | 'modal' | 'flow';
  url?: string;
  route?: string;
  name: string;
  elements: ElementDescriptor[];
  forms: FormDescriptor[];
  metadata: NodeMetadata;
}

interface AppEdge {
  from: string;
  to: string;
  type: 'navigate' | 'submit' | 'modal' | 'tab';
  trigger: ElementDescriptor;
}

interface ElementDescriptor {
  role: string;
  name?: string;
  selector: SelectorStrategy;
  type: 'button' | 'link' | 'input' | 'heading' | 'other';
  confidence: number;
}

interface SelectorStrategy {
  primary: string;      // data-testid
  fallback: string[];   // [role+name, CSS, XPath]
  stability: number;    // 0-1 score from KB
}
```

### TestPlan Schema
```typescript
interface TestPlan {
  version: string;
  suites: TestSuite[];
  envMatrix?: EnvMatrix;
}

interface TestSuite {
  id: string;
  name: string;
  category: 'smoke' | 'regression' | 'edge' | 'exploratory' | 'visual' | 'a11y';
  tests: TestCase[];
}

interface TestCase {
  id: string;
  name: string;
  flow: TestStep[];
  assertions: Assertion[];
  tags: string[];
}

interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'wait' | 'screenshot';
  target: ElementDescriptor | string;
  value?: any;
  options?: StepOptions;
}
```

### RunResult Schema
```typescript
interface RunResult {
  runId: string;
  timestamp: string;
  config: RunConfig;
  suites: SuiteResult[];
  summary: Summary;
  artifacts: ArtifactManifest;
}

interface SuiteResult {
  suiteId: string;
  tests: TestResult[];
}

interface TestResult {
  testId: string;
  status: 'pass' | 'fail' | 'skip' | 'flaky';
  duration: number;
  retries: number;
  error?: ErrorDetails;
  classification?: FailureClassification;
  suggestions?: FixSuggestion[];
  artifacts: string[];
}

interface FailureClassification {
  category: 'selector' | 'timing' | 'backend' | 'auth' | 'data' | 'visual' | 'unknown';
  confidence: number;
  reason: string;
  evidence: Evidence[];
}

interface FixSuggestion {
  type: 'selector_update' | 'wait_increase' | 'auth_refresh' | 'data_seed';
  confidence: number;
  description: string;
  patch?: string;
}
```

---

## 🔧 CORE ALGORITHMS

### 1. Intelligent Selector Strategy
```typescript
function selectBestSelector(element: Element, kb: KnowledgeBase): SelectorStrategy {
  const candidates = [
    extractDataTestId(element),
    extractRoleAndName(element),
    extractLabelFor(element),
    extractStableCSS(element),
    extractXPath(element)
  ];
  
  const scored = candidates.map(sel => ({
    selector: sel,
    stability: kb.getSelectorStability(sel) ?? 0.5,
    priority: getPriority(sel.type)
  }));
  
  scored.sort((a, b) => 
    (b.stability * b.priority) - (a.stability * a.priority)
  );
  
  return {
    primary: scored[0].selector,
    fallback: scored.slice(1, 4).map(s => s.selector),
    stability: scored[0].stability
  };
}
```

### 2. Flow Synthesis (Graph Search)
```typescript
function synthesizeFlows(graph: AppGraph, config: FlowConfig): Flow[] {
  const flows: Flow[] = [];
  
  // Critical flows from config
  for (const flowDef of config.criticalFlows) {
    const path = findShortestPath(graph, flowDef.start, flowDef.end);
    if (path) {
      flows.push(buildFlow(path, flowDef.name));
    }
  }
  
  // Auto-discover flows
  const hubs = findHubNodes(graph); // nodes with high degree
  for (const hub of hubs) {
    const reachable = bfs(graph, hub);
    flows.push(...generateExplorationFlows(hub, reachable));
  }
  
  return deduplicateFlows(flows);
}
```

### 3. Auto-Heal Selector
```typescript
async function healSelector(
  oldSelector: string,
  page: Page,
  elementContext: ElementContext,
  kb: KnowledgeBase
): Promise<HealResult> {
  // Try semantic match
  const semanticMatches = await findSemanticMatches(page, elementContext);
  
  for (const match of semanticMatches) {
    const newSelector = await extractSelector(match);
    const confidence = calculateConfidence(elementContext, match, kb);
    
    if (confidence > 0.7) {
      return {
        success: true,
        newSelector,
        confidence,
        reason: 'Semantic match based on role/text/position'
      };
    }
  }
  
  return { success: false, confidence: 0 };
}
```

---

## 🚀 QUICKSTART (Post-M1)

```bash
# 1. Install
npm install -g libero-quantum@latest

# 2. Initialize in your app
cd my-app
npx libero init

# 3. Map your app
npx libero map

# 4. Generate tests
npx libero generate

# 5. Run tests
npx libero test --mode=full

# View report
open .libero/reports/latest/index.html
```

---

## 📝 ACCEPTANCE CRITERIA

- ✅ Monorepo with 7 packages
- ✅ CLI with 5 commands (init, map, generate, run, report)
- ✅ Works on React/Vue/Next/Vanilla apps
- ✅ Generates 50+ real tests (not placeholders)
- ✅ Playwright + Selenium runners
- ✅ HTML + JUnit + JSON reports
- ✅ Failure classification + fix suggestions
- ✅ Knowledge Base with selector stability
- ✅ CI/CD templates
- ✅ Strict TypeScript, tested, linted
- ✅ Example apps pass acceptance tests

---

**Next:** Start M1 implementation.
