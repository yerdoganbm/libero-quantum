import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, LiberoConfig } from '../packages/core/src/types/config';
import { applyAIMode, resolveAIMode } from '../packages/core/src/utils/ai-mode';

function baseConfig(): LiberoConfig {
  return {
    ...(DEFAULT_CONFIG as LiberoConfig),
    version: '6.0.0',
    appName: 'demo',
    baseUrl: 'http://localhost:3000',
  };
}

function testResolveMode(): void {
  const config = baseConfig();
  config.ai = { mode: 'assist' };
  assert.equal(resolveAIMode(undefined, config), 'assist');
  assert.equal(resolveAIMode('autopilot', config), 'autopilot');
}

function testAssistPreset(): void {
  const config = baseConfig();
  const applied = applyAIMode(config, 'assist');

  assert.equal(applied.mapping.deepFormExtraction, true);
  assert.equal(applied.generation.formVariants?.enabled, true);
  assert.equal(applied.generation.formVariants?.includeBoundaryCases, false);
  assert.equal(applied.learning.autoHeal, true);
}

function testAutopilotPreset(): void {
  const config = baseConfig();
  config.execution.workers = 1;
  config.generation.coverageTargets.routes = 60;

  const applied = applyAIMode(config, 'autopilot');

  assert.equal(applied.execution.parallel, true);
  assert.equal(applied.execution.workers, 2);
  assert.equal(applied.generation.coverageTargets.routes >= 85, true);
}

testResolveMode();
testAssistPreset();
testAutopilotPreset();

console.log('ai-mode.spec.ts passed');
