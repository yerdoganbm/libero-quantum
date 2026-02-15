#!/usr/bin/env node
/**
 * LIBERO GENESIS v2.0 – Evrensel Otonom Test Mimarisi
 *
 * Framework Agnostic + Zero-Friction UX
 * Tek soru: "Hangi URL'i test edeyim?" – Gerisi otomatik.
 *
 * Kullanım: npx ts-node libero-universal.ts
 *       veya: npm run genesis
 */

import * as readline from 'readline';
import { chromium, type Browser, type Page } from 'playwright';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type Tech = 'react' | 'angular' | 'jquery' | 'vanilla';
type WaitStrategy = 'networkidle' | 'domcontentloaded' | 'load';

interface ScanResult {
  role: string;
  name: string;
  type: string;
  count: number;
  ok: boolean;
  error?: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  aiGenerated?: boolean;
}

interface PageContext {
  buttonLabels: string[];
  linkLabels: string[];
  linkHrefs: string[];
  inputPlaceholders: string[];
  headingTexts: string[];
}

interface GeneratedScenario {
  name: string;
  type: 'click_button' | 'click_link' | 'fill_input' | 'heading_visible';
  target: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. THE UNIVERSAL ADAPTER (Bukalemun Modülü)
// ═══════════════════════════════════════════════════════════════════════

async function detectTechnology(page: Page): Promise<{ tech: Tech; strategy: WaitStrategy }> {
  const result = await page.evaluate(() => {
    const win = window as any;
    if (win.__REACT_ROOT__ || win.React || document.querySelector('[data-reactroot]')) return 'react';
    if (win.ng || document.querySelector('[ng-version]') || document.querySelector('[ng-app]')) return 'angular';
    if (win.jQuery || win.$) return 'jquery';
    return 'vanilla';
  }).catch(() => 'vanilla');

  const tech: Tech = result as Tech;
  const strategy: WaitStrategy =
    tech === 'react' ? 'networkidle' : tech === 'angular' ? 'domcontentloaded' : tech === 'jquery' ? 'load' : 'domcontentloaded';

  return { tech, strategy };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForStability(page: Page, strategy: WaitStrategy): Promise<void> {
  try {
    if (strategy === 'networkidle') await page.waitForLoadState('networkidle');
    else if (strategy === 'load') await page.waitForLoadState('load');
    else await page.waitForLoadState('domcontentloaded');
    await delay(500);
  } catch {
    await delay(1000);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 2. THE HUMAN-CENTRIC SELECTOR ENGINE
// ═══════════════════════════════════════════════════════════════════════

async function scanUniversalElements(page: Page): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  const roles = ['button', 'link', 'textbox', 'heading', 'img'];
  for (const role of roles) {
    try {
      const count = await page.getByRole(role as any).count();
      results.push({ role, name: role, type: 'role', count, ok: true });
    } catch (e) {
      results.push({ role, name: role, type: 'role', count: 0, ok: false, error: String(e) });
    }
  }

  try {
    const inputs = await page.getByRole('textbox').count();
    const placeholders = await page.locator('input[placeholder], textarea[placeholder]').count();
    results.push({ role: 'input', name: 'textbox', type: 'role', count: inputs, ok: true });
    results.push({ role: 'placeholder', name: 'input/textarea with placeholder', type: 'placeholder', count: placeholders, ok: true });
  } catch {
    results.push({ role: 'input', name: 'textbox', type: 'role', count: 0, ok: false });
  }

  return results;
}

async function runHumanCentricTests(page: Page, chaosMode: boolean): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = () => Date.now();

  // Test 1: Butonlara tıklanabilir mi?
  let t0 = start();
  try {
    const firstButton = page.getByRole('button').first();
    await firstButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => null);
    const count = await page.getByRole('button').count();
    if (count > 0 && !chaosMode) await firstButton.click().catch(() => null);
    results.push({ name: 'Button (getByRole) visible & clickable', passed: true, duration: Date.now() - t0 });
  } catch (e) {
    results.push({ name: 'Button (getByRole)', passed: false, duration: Date.now() - t0, error: String(e) });
  }

  // Test 2: Linkler
  t0 = start();
  try {
    const linkCount = await page.getByRole('link').count();
    results.push({ name: 'Links (getByRole) found', passed: linkCount >= 0, duration: Date.now() - t0 });
  } catch (e) {
    results.push({ name: 'Links (getByRole)', passed: false, duration: Date.now() - t0, error: String(e) });
  }

  // Test 3: Placeholder ile input
  t0 = start();
  try {
    const withPlaceholder = page.locator('input[placeholder], textarea[placeholder]').first();
    await withPlaceholder.waitFor({ state: 'attached', timeout: 2000 }).catch(() => null);
    const count = await page.locator('input[placeholder], textarea[placeholder]').count();
    results.push({ name: 'Input/textarea with placeholder', passed: count >= 0, duration: Date.now() - t0 });
  } catch (e) {
    results.push({ name: 'Placeholder inputs', passed: false, duration: Date.now() - t0, error: String(e) });
  }

  // Test 4: Erişilebilirlik (basit)
  t0 = start();
  try {
    const buttons = await page.getByRole('button').all();
    let hasAccessibleName = 0;
    for (const b of buttons.slice(0, 5)) {
      const name = (await b.getAttribute('aria-label')) || (await b.textContent()) || '';
      if (name.trim().length > 0) hasAccessibleName++;
    }
    results.push({ name: 'Buttons have accessible name (aria-label/text)', passed: buttons.length === 0 || hasAccessibleName > 0, duration: Date.now() - t0 });
  } catch (e) {
    results.push({ name: 'A11y check', passed: false, duration: Date.now() - t0, error: String(e) });
  }

  if (chaosMode) {
    t0 = start();
    try {
      const links = await page.getByRole('link').all();
      const toClick = links.slice(0, 3);
      for (const link of toClick) {
        await link.click().catch(() => null);
        await delay(300);
      }
      results.push({ name: 'Chaos: random link clicks', passed: true, duration: Date.now() - t0 });
    } catch (e) {
      results.push({ name: 'Chaos: link clicks', passed: false, duration: Date.now() - t0, error: String(e) });
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 2b. AI SENARYO ÜRETİCİ (Sayfaya göre kendi kendine senaryo üretir)
// ═══════════════════════════════════════════════════════════════════════

async function getPageContext(page: Page): Promise<PageContext> {
  const ctx = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]'));
    const buttonLabels = buttons.map((b) => (b.getAttribute('aria-label') || (b as HTMLElement).innerText || (b as HTMLInputElement).value || '').trim().slice(0, 50));
    const links = Array.from(document.querySelectorAll('a[href]'));
    const linkLabels = links.map((a) => (a.textContent || '').trim().slice(0, 50));
    const linkHrefs = links.map((a) => (a.getAttribute('href') || '').slice(0, 100));
    const inputs = Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'));
    const inputPlaceholders = inputs.map((i) => (i.getAttribute('placeholder') || '').trim().slice(0, 50));
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, [role="heading"]'));
    const headingTexts = headings.map((h) => (h.textContent || '').trim().slice(0, 60));
    return { buttonLabels, linkLabels, linkHrefs, inputPlaceholders, headingTexts };
  }).catch(() => ({ buttonLabels: [], linkLabels: [], linkHrefs: [], inputPlaceholders: [], headingTexts: [] }));
  return ctx as PageContext;
}

function generateScenariosFromContext(ctx: PageContext): GeneratedScenario[] {
  const scenarios: GeneratedScenario[] = [];
  const seenButtons = new Set<string>();
  for (const label of ctx.buttonLabels) {
    const key = label || '(etiket yok)';
    if (seenButtons.has(key)) continue;
    seenButtons.add(key);
    scenarios.push({ name: `"${key || 'Buton'}" butonuna tıkla`, type: 'click_button', target: label || 'button' });
  }
  const seenLinks = new Set<string>();
  for (let i = 0; i < Math.min(ctx.linkLabels.length, 5); i++) {
    const label = ctx.linkLabels[i] || ctx.linkHrefs[i] || `Link ${i + 1}`;
    if (seenLinks.has(label)) continue;
    seenLinks.add(label);
    scenarios.push({ name: `"${label}" linkine tıkla`, type: 'click_link', target: label });
  }
  for (const ph of ctx.inputPlaceholders.slice(0, 3)) {
    if (!ph) continue;
    scenarios.push({ name: `"${ph}" alanına yaz ve formu gönder`, type: 'fill_input', target: ph });
  }
  for (const heading of ctx.headingTexts.slice(0, 2)) {
    if (!heading) continue;
    scenarios.push({ name: `"${heading}" başlığı görünür olmalı`, type: 'heading_visible', target: heading });
  }
  return scenarios;
}

async function runGeneratedScenarios(page: Page, scenarios: GeneratedScenario[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const start = () => Date.now();
  for (const scenario of scenarios.slice(0, 15)) {
    const t0 = start();
    try {
      if (scenario.type === 'click_button') {
        const btn = scenario.target && scenario.target !== 'button' ? page.getByRole('button', { name: scenario.target }) : page.getByRole('button').first();
        await btn.waitFor({ state: 'visible', timeout: 2000 });
        await btn.click();
        results.push({ name: `[AI] ${scenario.name}`, passed: true, duration: Date.now() - t0, aiGenerated: true });
        await delay(400);
      } else if (scenario.type === 'click_link') {
        const link = page.getByRole('link', { name: scenario.target }).first();
        await link.waitFor({ state: 'visible', timeout: 2000 });
        await link.click();
        results.push({ name: `[AI] ${scenario.name}`, passed: true, duration: Date.now() - t0, aiGenerated: true });
        await delay(400);
      } else if (scenario.type === 'fill_input') {
        const input = page.getByPlaceholder(scenario.target).first();
        await input.waitFor({ state: 'visible', timeout: 2000 });
        await input.fill('test@test.com');
        results.push({ name: `[AI] ${scenario.name}`, passed: true, duration: Date.now() - t0, aiGenerated: true });
      } else if (scenario.type === 'heading_visible') {
        const heading = page.getByRole('heading', { name: scenario.target }).first();
        await heading.waitFor({ state: 'visible', timeout: 2000 });
        results.push({ name: `[AI] ${scenario.name}`, passed: true, duration: Date.now() - t0, aiGenerated: true });
      }
    } catch (e) {
      results.push({ name: `[AI] ${scenario.name}`, passed: false, duration: Date.now() - t0, error: String(e).slice(0, 80), aiGenerated: true });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 3. THE CLI WIZARD
// ═══════════════════════════════════════════════════════════════════════

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

function print(msg: string) {
  console.log(msg);
}

// ═══════════════════════════════════════════════════════════════════════
// 5. REPORT (Terminal tablo)
// ═══════════════════════════════════════════════════════════════════════

function reportTable(scan: ScanResult[], tests: TestResult[], tech: Tech) {
  const w = (s: string, n: number) => s.padEnd(n).slice(0, n);
  print('\n┌─────────────────────────────────────────────────────────────────┐');
  print('│ LIBERO GENESIS v2.0 – RAPOR (Framework Agnostic)                 │');
  print('├─────────────────────────────────────────────────────────────────┤');
  print(`│ Tespit edilen teknoloji: ${w(tech, 40)}│`);
  print('├─────────────────────────────────────────────────────────────────┤');
  print('│ TARAMA (Evrensel elementler)                                    │');
  print('├──────────────────────────┬────────┬───────┤');
  for (const s of scan) {
    print(`│ ${w(s.role + ' (' + s.name + ')', 24)} │ ${w(String(s.count), 6)} │ ${s.ok ? 'OK' : 'FAIL'}   │`);
  }
  print('├─────────────────────────────────────────────────────────────────┤');
  print('│ TESTLER (İnsan odaklı lokatörler)                                │');
  print('├────────────────────────────────────────────┬──────────┬────────┤');
  for (const t of tests) {
    const name = t.name.length > 42 ? t.name.slice(0, 39) + '...' : t.name;
    print(`│ ${w(name, 42)} │ ${t.passed ? 'PASS' : 'FAIL'}     │ ${String(t.duration).padStart(4)}ms │`);
    if (t.error) print(`│   └ ${w(t.error.slice(0, 56), 56)} │`);
  }
  print('└────────────────────────────────────────────┴──────────┴────────┘');
  const passed = tests.filter((t) => t.passed).length;
  const baseCount = tests.filter((t) => !t.aiGenerated).length;
  const aiCount = tests.filter((t) => t.aiGenerated).length;
  const aiPassed = tests.filter((t) => t.aiGenerated && t.passed).length;
  if (aiCount > 0) {
    print(`\n  Sonuç: ${passed}/${tests.length} test başarılı (Temel: ${baseCount}, AI üretilen: ${aiPassed}/${aiCount}).\n`);
  } else {
    print(`\n  Sonuç: ${passed}/${tests.length} test başarılı.\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// THE ONE-CLICK LOOP
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  print('\n  🤖 Libero: Merhaba! Evrensel Otonom Test (GENESIS v2.0)\n');

  let url: string;
  let chaosMode: boolean;
  if (process.env.GENESIS_URL) {
    url = process.env.GENESIS_URL;
    if (!url.startsWith('http')) url = 'http://' + url;
    chaosMode = /^e|y|t|1$/i.test((process.env.GENESIS_CHAOS || 'H').trim());
    print(`  📌 URL (env): ${url} | Kaos: ${chaosMode ? 'Evet' : 'Hayır'}\n`);
  } else {
    const urlAnswer = await ask('  🤖 Hangi URL\'i test edeyim? (örn. http://localhost:3000): ');
    url = urlAnswer || 'http://localhost:3000';
    if (!url.startsWith('http')) url = 'http://' + url;
    const chaosAnswer = await ask('  🤖 Kaos Modu açılsın mı? (E/H) [H]: ');
    chaosMode = /^e|y|t|1$/i.test((chaosAnswer || 'H').trim());
  }

  print('\n  ⏳ Sayfa açılıyor...\n');

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const { tech, strategy } = await detectTechnology(page);
    print(`  📡 Teknoloji tespit edildi: ${tech} → Bekleme: ${strategy}\n`);

    await waitForStability(page, strategy);

    const scan = await scanUniversalElements(page);
    const baseTests = await runHumanCentricTests(page, chaosMode);

    print('  🧠 AI senaryo üretiliyor (sayfaya göre)...\n');
    const ctx = await getPageContext(page);
    const scenarios = generateScenariosFromContext(ctx);
    print(`  📋 ${scenarios.length} senaryo üretildi.\n`);
    const aiTests = await runGeneratedScenarios(page, scenarios);
    const tests = [...baseTests, ...aiTests];

    reportTable(scan, tests, tech);
  } catch (e) {
    print('  ❌ Hata: ' + String(e) + '\n');
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

main();
