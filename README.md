# 🌌 Libero Quantum - Autonomous UI Testing Platform

**Libero Quantum** is a next-generation autonomous testing platform that maps, generates, executes, learns, and heals UI tests automatically.

## ✨ Features

- 🗺️ **Deep Application Mapping**: Stateful crawling with auth support
- 🧪 **Multi-Generator System**: Smoke, Form, Journey, CRUD, A11y tests
- 🎯 **Coverage-Driven Generation**: Generate tests until coverage targets met
- 🔄 **Selector Healing**: Auto-repair broken selectors
- 📊 **Learning & Analytics**: Knowledge base tracks flaky tests and failures
- 🚀 **Parallel Execution**: Run tests with multiple workers
- 🎭 **Dual Runners**: Playwright AND Selenium support
- 📈 **Rich Reporting**: HTML, JSON, JUnit, Coverage, Analytics

---

## 🚀 Quick Start

### 1. Install

```bash
npm install -g @libero/cli
# or
npx @libero/cli init
```

### 2. Initialize

```bash
cd your-app
npx libero init
```

This creates `libero.config.json`:

```json
{
  "appName": "My App",
  "baseUrl": "http://localhost:3000",
  "mapping": {
    "method": "dynamic",
    "maxDepth": 3,
    "maxPages": 50,
    "deepFormExtraction": false
  },
  "generation": {
    "coverageTargets": {
      "routes": 90,
      "elements": 70,
      "forms": 80
    },
    "formVariants": {
      "enabled": false,
      "includeBoundaryCases": true,
      "includeInvalidCases": true
    }
  },
  "execution": {
    "runner": "playwright",
    "parallel": true,
    "workers": 4
  },
  "learning": {
    "enabled": true,
    "autoHeal": true
  }
}
```

### 3. Map Your App

```bash
# Basic mapping
npx libero map

# With authentication
npx libero map --auth=loginForm

# Custom depth/pages
npx libero map --depth 5 --pages 100

# Deep form extraction (constraints + validation hints)
npx libero map --deep-forms
```

### 4. Generate Tests

```bash
# Basic generation
npx libero generate

# All test types
npx libero generate --type smoke,form,journey,crud,a11y

# Coverage-driven (generates until 90% coverage)
npx libero generate --coverage 90

# With seed for reproducibility
npx libero generate --seed 12345
```

### 5. Run Tests

```bash
# Basic run
npx libero run

# Selenium runner
npx libero run --runner selenium

# Parallel execution
npx libero run --workers 8

# Headed mode
npx libero run --headed
```

### 6. Full Pipeline

```bash
# Quick mode: smoke + form tests
npx libero test --quick

# Full mode: all generators + coverage
npx libero test --full
```

---

## 📝 Configuration

### Auth Strategies

```json
{
  "auth": {
    "strategy": "loginForm",
    "loginUrl": "http://localhost:3000/login",
    "credentials": {
      "username": "test@example.com",
      "password": "testpass"
    }
  }
}
```

Supported strategies:
- `cookie`: Set cookies before crawl
- `localStorage`: Set token in localStorage
- `loginForm`: Auto-login via form
- `custom`: Custom auth script

### Coverage Targets

```json
{
  "generation": {
    "coverageTargets": {
      "routes": 90,
      "elements": 70,
      "forms": 80,
      "assertions": 2,
      "flows": 3
    }
  }
}
```

### Learning & Healing

```json
{
  "learning": {
    "enabled": true,
    "kbPath": ".libero/knowledge-base.db",
    "autoHeal": true,
    "trackFlaky": true
  }
}
```

---

## 📊 Test Generators

### Smoke Tests
Basic navigation + visibility checks

### Form Tests
- Positive: valid data submission
- Negative: empty fields, invalid email
- Edge: long inputs, special characters

### Journey Tests
Multi-step user flows (home → product → cart → checkout)

### CRUD Tests
Create, Read, Update, Delete operations

### A11y Tests
- Heading structure
- Form labels
- Image alt text
- Interactive element names

---

## 🔧 Advanced Usage

### Parallel Execution

```bash
npx libero run --workers 8 --runner playwright
```

### Selector Healing

When a selector fails, Libero tries alternatives:
1. `aria-label`
2. `data-testid`
3. Text content
4. XPath fallbacks

Successful repairs are saved to the knowledge base.

### Failure Analytics

After runs, view:
- Failure clusters by type (timeout, selector, auth, etc.)
- Flaky test rankings
- Suggested fixes

```bash
# Reports generated at:
.libero/reports/<run-id>/
  ├── report.html
  ├── junit.xml
  ├── coverage.json
  └── analytics.json
```

---

## 📦 Monorepo Structure

```
packages/
  ├── agent/       # Crawler + mapping
  ├── cli/         # CLI commands
  ├── core/        # Types + utils
  ├── generator/   # Test generators
  ├── learning/    # Knowledge base + healing
  ├── reporting/   # Reporters (HTML, JUnit, etc.)
  └── runner/      # Playwright + Selenium adapters
```

---

## 🧪 CI Integration

### GitHub Actions

```yaml
name: Libero Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx libero test --quick
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: .libero/reports/
```

### JUnit Integration

```bash
npx libero run
# Outputs: .libero/reports/<run-id>/junit.xml
```

---

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 License

MIT © Libero Team

---

## 🔗 Links

- [Documentation](https://libero-quantum.dev)
- [Examples](./examples)
- [Changelog](./CHANGELOG.md)
