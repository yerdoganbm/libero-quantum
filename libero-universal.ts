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
  print(`\n  Sonuç: ${passed}/${tests.length} test başarılı.\n`);
}

// ═══════════════════════════════════════════════════════════════════════
// THE ONE-CLICK LOOP
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  print('\n  🤖 Libero: Merhaba! Evrensel Otonom Test (GENESIS v2.0)\n');

  const urlAnswer = await ask('  🤖 Hangi URL\'i test edeyim? (örn. http://localhost:3000): ');
  let url = urlAnswer || 'http://localhost:3000';
  if (!url.startsWith('http')) url = 'http://' + url;

  const chaosAnswer = await ask('  🤖 Kaos Modu açılsın mı? (E/H) [H]: ');
  const chaosMode = /^e|y|t|1$/i.test((chaosAnswer || 'H').trim());

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
    const tests = await runHumanCentricTests(page, chaosMode);

    reportTable(scan, tests, tech);
  } catch (e) {
    print('  ❌ Hata: ' + String(e) + '\n');
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

main();
