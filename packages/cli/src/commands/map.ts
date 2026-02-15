/**
 * libero map - Map application structure
 */

import { PlaywrightCrawler, AppGraphBuilder } from '@libero/agent';
import { AIMode, LiberoConfig, applyAIMode, logger, readJson, resolveAIMode, writeJson } from '@libero/core';
import * as path from 'path';

export async function mapCommand(options: {
  depth?: number;
  pages?: number;
  auth?: string;
  deepForms?: boolean;
  aiMode?: AIMode;
}): Promise<void> {
  logger.info('Starting application mapping...');

  const config = readJson<LiberoConfig>(path.join(process.cwd(), 'libero.config.json'));
  if (!config) {
    logger.error('libero.config.json not found. Run: npx libero init');
    process.exit(1);
  }

  const aiMode = resolveAIMode(options.aiMode, config);
  const effectiveConfig = applyAIMode(config, aiMode);
  if (aiMode !== 'off') logger.info(`AI mode active: ${aiMode}`);

  const mappingConfig = effectiveConfig.mapping;
  const crawler = new PlaywrightCrawler();
  const startTime = Date.now();

  let authStrategy: { name: string; config: any } | undefined;
  if (options.auth) {
    authStrategy = { name: options.auth, config: effectiveConfig.auth || {} };
  } else if (effectiveConfig.auth && effectiveConfig.auth.strategy !== 'none') {
    authStrategy = {
      name: effectiveConfig.auth.strategy,
      config: effectiveConfig.auth,
    };
  }

  const { nodes, edges } = await crawler.crawl({
    baseUrl: effectiveConfig.baseUrl,
    maxDepth: options.depth ?? mappingConfig.maxDepth,
    maxPages: options.pages ?? mappingConfig.maxPages,
    timeout: mappingConfig.timeout,
    headless: true,
    captureScreenshots: mappingConfig.captureScreenshots,
    authStrategy,
    deepFormExtraction: options.deepForms ?? mappingConfig.deepFormExtraction ?? false,
  });

  const duration = Date.now() - startTime;
  const graph = new AppGraphBuilder().build(
    effectiveConfig.appName,
    effectiveConfig.baseUrl,
    nodes,
    edges,
    effectiveConfig.framework,
    duration
  );

  const graphPath = path.join(process.cwd(), '.libero', 'app-graph', 'latest.json');
  writeJson(graphPath, graph);

  logger.success(`AppGraph saved: ${graphPath}`);
  logger.info(`  Routes: ${graph.metadata.totalNodes}`);
  logger.info(`  Elements: ${graph.metadata.totalElements}`);
  logger.info(`  Forms: ${graph.metadata.totalForms}`);
  logger.info(`  Duration: ${(duration / 1000).toFixed(1)}s`);
}
