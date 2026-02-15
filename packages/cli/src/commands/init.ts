/**
 * libero init - Initialize Libero in project
 */

import { LiberoConfig, DEFAULT_CONFIG } from '@libero/core';
import { logger, writeJson, ensureDir, fileExists } from '@libero/core';
import * as fs from 'fs';
import * as path from 'path';

export async function initCommand(options: { force?: boolean }): Promise<void> {
  logger.info('Initializing Libero Quantum...');

  const configPath = path.join(process.cwd(), 'libero.config.json');
  
  if (fileExists(configPath) && !options.force) {
    logger.warn('libero.config.json already exists. Use --force to overwrite.');
    return;
  }

  // Detect framework
  const framework = detectFramework();
  logger.info(`Detected framework: ${framework || 'unknown'}`);

  // Detect base URL
  const baseUrl = await detectBaseUrl();
  
  // Create config
  const config: LiberoConfig = {
    ...DEFAULT_CONFIG,
    version: '6.0.0',
    appName: path.basename(process.cwd()),
    baseUrl: baseUrl || 'http://localhost:3000',
    framework,
  } as LiberoConfig;

  // Write config
  writeJson(configPath, config);
  logger.success('Created libero.config.json');

  // Create directories
  ensureDir('.libero');
  ensureDir('.libero/app-graph');
  ensureDir('.libero/test-plans');
  ensureDir('.libero/reports');
  ensureDir('.libero/artifacts');
  ensureDir('.libero/screenshots');
  logger.success('Created .libero/ directories');

  // Create .gitignore
  const gitignorePath = path.join(process.cwd(), '.libero', '.gitignore');
  fs.writeFileSync(gitignorePath, `# Libero artifacts
*.png
*.mp4
*.webm
*.zip
knowledge-base.db
reports/
artifacts/
`);

  logger.success('✨ Libero initialized! Run: npx libero map');
}

function detectFramework(): string | undefined {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!fileExists(packageJsonPath)) return undefined;
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  if (deps['next']) return 'nextjs';
  if (deps['nuxt']) return 'nuxt';
  if (deps['react']) return 'react';
  if (deps['vue']) return 'vue';
  if (deps['@angular/core']) return 'angular';
  if (deps['svelte']) return 'svelte';
  
  return 'vanilla';
}

async function detectBaseUrl(): Promise<string> {
  // Simple heuristic: check vite.config, next.config, package.json scripts
  const cwd = process.cwd();
  
  // Check vite.config
  const viteConfig = path.join(cwd, 'vite.config.ts');
  if (fileExists(viteConfig)) {
    const content = fs.readFileSync(viteConfig, 'utf-8');
    const portMatch = content.match(/port:\s*(\d+)/);
    if (portMatch) return `http://localhost:${portMatch[1]}`;
  }

  // Default
  return 'http://localhost:3000';
}
