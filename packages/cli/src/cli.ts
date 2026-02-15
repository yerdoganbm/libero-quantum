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
  .action((opts) => mapCommand({ depth: parseInt(opts.depth), pages: parseInt(opts.pages) }));

program
  .command('generate')
  .description('Generate test plans from AppGraph')
  .option('-s, --seed <number>', 'Random seed for deterministic tests')
  .option('-t, --type <types>', 'Test types: smoke,form,journey (default: smoke,form)')
  .action((opts) => generateCommand({ 
    seed: opts.seed ? parseInt(opts.seed) : undefined,
    type: opts.type,
  }));

program
  .command('run')
  .description('Execute test plans')
  .option('-p, --plan <path>', 'Path to test plan')
  .option('--headed', 'Run in headed mode')
  .action((opts) => runCommand({ plan: opts.plan, headless: !opts.headed }));

program
  .command('test')
  .description('Run full pipeline: map + generate + run')
  .option('--mode <mode>', 'Test mode: full | quick', 'full')
  .option('--headed', 'Run in headed mode')
  .action(async (opts) => {
    await mapCommand({ depth: opts.mode === 'quick' ? 2 : 3, pages: opts.mode === 'quick' ? 20 : 50 });
    await generateCommand({});
    await runCommand({ headless: !opts.headed });
  });

program.parse();
