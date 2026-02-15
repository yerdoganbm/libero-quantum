# M1 QUICKSTART - Acceptance Test

**Goal:** Validate M1 deliverables work end-to-end.

---

## Prerequisites

```bash
cd C:\Users\YUNUS\Desktop\libero-quantum
npm install
npm run build
```

---

## Test Scenario

### 1. Start sample app

```bash
cd examples/react-vite
npm install
npm run dev
# App runs on http://localhost:5174
```

### 2. Run Libero (in another terminal)

```bash
cd examples/react-vite
npx libero init
npx libero map --depth 2 --pages 10
npx libero generate
npx libero run
```

---

## Expected Results

### `npx libero init`
- ✅ Creates `libero.config.json`
- ✅ Creates `.libero/` directories
- ✅ Detects framework: `react`

### `npx libero map`
- ✅ Crawls http://localhost:5174
- ✅ Discovers 4+ routes (/,  /about, /contact, /dashboard)
- ✅ Saves `.libero/app-graph/latest.json`
- ✅ Reports: "X routes, Y elements"

### `npx libero generate`
- ✅ Reads AppGraph
- ✅ Generates 10+ smoke tests
- ✅ Saves `.libero/test-plans/smoke.json`

### `npx libero run`
- ✅ Executes tests with Playwright
- ✅ Pass rate: 80%+ (some may fail intentionally)
- ✅ Generates HTML report: `.libero/reports/{runId}/index.html`
- ✅ Generates JSON: `.libero/reports/{runId}/{runId}.json`

---

## Acceptance Criteria

- [x] All packages build successfully
- [ ] CLI commands run without errors
- [ ] AppGraph contains 4+ routes
- [ ] 10+ tests generated
- [ ] Tests execute and produce report
- [ ] HTML report opens in browser
- [ ] Pass rate >= 70%

---

**Status:** M1 core packages complete. CLI execution pending.
