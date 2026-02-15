#!/usr/bin/env node
/**
 * Libero CLI entry point
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { mapCommand } from './commands/map';
import { generateCommand } from './commands/generate';
import { runCommand } from './commands/run';

const program = new Command();

program
  .name('libero')
  .description('🌌 Libero Quantum - Autonomous Testing Platform')
  .version('6.0.0');

program
  .command('init')
  .description('Initialize Libero in your project')
  .option('-f, --force', 'Overwrite existing config')
  .action(initCommand);

program
  .command('map')
  .description('Map application structure (crawl + analyze)')
  .option('-d, --depth <number>', 'Max crawl depth', '3')
  .option('-p, --pages <number>', 'Max pages to crawl', '50')
  .option('-a, --auth <strategy>', 'Auth strategy: cookie | localStorage | loginForm | custom')
  .option('--deep-forms', 'Enable deep form extraction (constraints + validation hints)')
  .action((opts) => mapCommand({ depth: parseInt(opts.depth), pages: parseInt(opts.pages), auth: opts.auth, deepForms: Boolean(opts.deepForms) }));


program
  .command('generate')
  .description('Generate test plans from AppGraph')
  .option('-s, --seed <number>', 'Random seed for deterministic tests')
  .option('-t, --type <types>', 'Test types: smoke,form,journey,crud,a11y (default: smoke,form)')
  .option('-c, --coverage <0-100>', 'Coverage target percentage; generate until met (uses orchestrator)')
  .option('--ai-mode <mode>', 'AI mode: off | assist | autopilot')
  .action((opts) =>
    generateCommand({
      seed: opts.seed ? parseInt(opts.seed, 10) : undefined,
      type: opts.type,
      coverage: opts.coverage != null ? parseFloat(opts.coverage) : undefined,
      aiMode: opts.aiMode,
    })
  );

program
  .command('run')
  .description('Execute test plans')
  .option('-p, --plan <path>', 'Path to test plan')
  .option('--headed', 'Run in headed mode')
  .option('-r, --runner <runner>', 'Test runner: playwright | selenium (default: playwright)')
  .option('-w, --workers <number>', 'Number of parallel workers (default: 1)')
  .option('-b, --browser <name>', 'Browser for selenium: chrome|firefox|edge')
  .option('--grid-url <url>', 'Selenium Grid remote URL')

  .action((opts) => runCommand({ 
    plan: opts.plan, 
    headless: !opts.headed, 
    runner: opts.runner,
    workers: opts.workers ? parseInt(opts.workers) : undefined,
    browser: opts.browser,
    gridUrl: opts.gridUrl,
  }));

program
  .command('test')
  .description('Run full pipeline: map + generate + run')
  .option('--mode <mode>', 'Test mode: full | quick', 'full')
  .option('--headed', 'Run in headed mode')
  .option('--quick', 'Shortcut for quick mode (depth 2, pages 20, smoke+form)')
  .option('--full', 'Shortcut for full mode (depth 3, pages 50, all tests + coverage)')
  .option('--ai-mode <mode>', 'AI mode: off | assist | autopilot')
  .action(async (opts) => {
    const mode = opts.quick ? 'quick' : opts.full ? 'full' : opts.mode;

    if (mode === 'quick') {
      await mapCommand({ depth: 2, pages: 20, aiMode: opts.aiMode });
      await generateCommand({ type: 'smoke,form', aiMode: opts.aiMode });
    } else {
      await mapCommand({ depth: 3, pages: 50, aiMode: opts.aiMode });
      await generateCommand({ type: 'smoke,form,journey,crud,a11y', coverage: 80, aiMode: opts.aiMode });
    }

    await runCommand({ headless: !opts.headed });
  });

program.parse();
