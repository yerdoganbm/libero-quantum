/**
 * libero map - Map application structure
 */

import { LiberoConfig } from '@libero/core';
import { logger, readJson, writeJson } from '@libero/core';
import { PlaywrightCrawler, AppGraphBuilder } from '@libero/agent';
import * as path from 'path';

export async function mapCommand(options: { depth?: number; pages?: number; auth?: string }): Promise<void> {
  logger.info('Starting application mapping...');

  // Load config
  const config = readJson<LiberoConfig>(path.join(process.cwd(), 'libero.config.json'));
  if (!config) {
    logger.error('libero.config.json not found. Run: npx libero init');
    process.exit(1);
  }

  const mappingConfig = config.mapping;
  const crawler = new PlaywrightCrawler();
  
  const startTime = Date.now();

  // Determine auth strategy
  let authStrategy: { name: string; config: any } | undefined;
  if (options.auth) {
    // CLI override: e.g. --auth=cookie or --auth=loginForm
    const strategyName = options.auth;
    authStrategy = { name: strategyName, config: config.auth || {} };
  } else if (config.auth && config.auth.strategy !== 'none') {
    // Use config auth
    authStrategy = {
      name: config.auth.strategy,
      config: config.auth,
    };
  }

  // Crawl
  const { nodes, edges } = await crawler.crawl({
    baseUrl: config.baseUrl,
    maxDepth: options.depth || mappingConfig.maxDepth,
    maxPages: options.pages || mappingConfig.maxPages,
    timeout: mappingConfig.timeout,
    headless: true,
    captureScreenshots: mappingConfig.captureScreenshots,
    authStrategy,
  });

  const duration = Date.now() - startTime;

  // Build AppGraph
  const builder = new AppGraphBuilder();
  const graph = builder.build(
    config.appName,
    config.baseUrl,
    nodes,
    edges,
    config.framework,
    duration
  );

  // Save
  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  writeJson(graphPath, graph);

  logger.success(`AppGraph saved: ${graphPath}`);
  logger.info(`  Routes: ${graph.metadata.totalNodes}`);
  logger.info(`  Elements: ${graph.metadata.totalElements}`);
  logger.info(`  Forms: ${graph.metadata.totalForms}`);
  logger.info(`  Duration: ${(duration / 1000).toFixed(1)}s`);
}
