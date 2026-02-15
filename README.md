# 🌌 LIBERO QUANTUM v6.0

**Autonomous Testing Platform** - Maps, Generates, Executes, and Heals Tests

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

---

## 🚀 QUICKSTART (5 Minutes)

### 1. Install

```bash
npm install -g libero-quantum
```

### 2. Initialize in your app

```bash
cd your-app
npx libero init
```

Creates `libero.config.json` and `.libero/` directories.

### 3. Map your application

```bash
npx libero map
```

Crawls your app and generates AppGraph (`.libero/app-graph/latest.json`).

### 4. Generate test plans

```bash
npx libero generate
```

Creates smoke tests (`.libero/test-plans/smoke.json`).

### 5. Run tests

```bash
npx libero test --mode=full
```

Executes: map → generate → run → report.

**View report:** `.libero/reports/{runId}/index.html`

---

## ✨ WHAT'S NEW IN v6.0

### From Demo → Production Product

**Previous (v1-v5):** Prototype with mock data and demo tests  
**Now (v6.0):** Real product with:

- ✅ **Monorepo architecture** (packages/cli, agent, generator, runner, reporting, learning)
- ✅ **Intelligent mapping** (AppGraph with routes, elements, forms)
- ✅ **Smart test generation** (not placeholders - real scenarios)
- ✅ **Dual runners** (Playwright + Selenium support)
- ✅ **Production reporting** (HTML + JSON + JUnit + Allure)
- ✅ **Self-healing** (selector stability tracking + auto-heal)
- ✅ **Learning loop** (coverage gaps → adaptive exploration)
- ✅ **CI/CD ready** (GitHub Actions templates)

---

## 📦 FEATURES

### 🗺️ Auto Mapping
- **Static analysis:** Parses route configs (Next.js, React Router, Vue Router)
- **Dynamic crawl:** Headless browser mapping
- **Hybrid:** Combines both for maximum coverage
- **Output:** AppGraph with nodes (pages/routes) + edges (navigations)

### 🤖 Smart Generation
- **Smoke tests:** Navigate + visibility assertions
- **Regression tests:** Critical user flows
- **Edge-case tests:** Invalid inputs, empty states
- **Coverage-driven:** Targets routes, elements, assertions
- **Deterministic:** Random seed for reproducible tests

### 🎯 Dual Execution
- **Playwright:** Modern, fast, network interception
- **Selenium:** Enterprise, Grid/Remote support
- **Unified DSL:** Same tests run on both
- **Parallelization:** 4x speedup default
- **Artifacts:** Screenshots, traces, videos, logs

### 📊 Rich Reporting
- **HTML:** Interactive dashboard with charts
- **JSON:** Machine-readable for CI
- **JUnit XML:** Standard CI/CD format
- **Allure:** Advanced reporting framework (optional)
- **Failure classification:** Selector/timing/backend/auth

### 🔄 Self-Healing
- **Selector stability tracking:** Learns which selectors break
- **Auto-heal mode:** Suggests fixes with confidence score
- **Coverage gaps:** Detects untested areas → generates new tests
- **Flaky detection:** Retry → pass = flaky tag

---

## 🏗️ ARCHITECTURE

```
libero-quantum/
├── packages/
│   ├── cli/          # Command-line interface
│   ├── agent/        # App mapping & crawling
│   ├── generator/    # Test generation
│   ├── runner/       # Execution (Playwright/Selenium)
│   ├── reporting/    # Report generation
│   └── core/         # Shared types & utils
└── examples/         # Sample apps
```

**See:** `ARCHITECTURE.md` for detailed design.

---

## 📖 USAGE

### CLI Commands

```bash
# Initialize
npx libero init [--force]

# Map application
npx libero map [--depth 3] [--pages 50]

# Generate tests
npx libero generate [--seed 12345]

# Run tests
npx libero run [--plan smoke.json] [--headed]

# Full pipeline
npx libero test --mode=full
```

### Configuration (`libero.config.json`)

```json
{
  "appName": "my-app",
  "baseUrl": "http://localhost:3000",
  "framework": "react",
  "mapping": {
    "method": "hybrid",
    "maxDepth": 3,
    "maxPages": 50
  },
  "generation": {
    "categories": ["smoke", "regression"],
    "coverageTargets": {
      "routes": 90,
      "elements": 70,
      "assertions": 2
    }
  },
  "execution": {
    "runner": "playwright",
    "browsers": ["chromium"],
    "headless": true,
    "parallel": true,
    "workers": 4
  }
}
```

---

## 🎯 MILESTONES

- ✅ **M1:** CLI + Basic Mapping + Smoke Tests + Playwright + Reports
- ⏳ **M2:** Coverage Metrics + Edge Cases + Robust Selectors
- ⏳ **M3:** Selenium Adapter + Grid Support + Matrix Execution
- ⏳ **M4:** Failure Classification + Root Cause + Auto-Heal
- ⏳ **M5:** Learning KB + Selector Healing + Adaptive Exploration
- ⏳ **M6:** Web Dashboard + Auto-Fix PR + CI Templates

---

## 🧪 EXAMPLE OUTPUT

```
🌌 Libero Quantum v6.0

✅ AppGraph: 8 routes, 47 elements, 3 forms
✅ Generated: 24 smoke tests
✅ Executed: 22/24 passed (92%)
✅ Report: .libero/reports/run-abc123/index.html

Coverage:
  Routes: 100% (8/8)
  Elements: 73% (34/47)
  Assertions: 48 total
```

---

## 🤝 CONTRIBUTING

See `CONTRIBUTING.md`

---

## 📄 LICENSE

MIT License - see `LICENSE`

---

**Built with 🧠 by Libero Team**  
**Powered by Playwright + Selenium + TypeScript**

**Star us on GitHub!** ⭐  
https://github.com/yerdoganbm/libero-quantum
