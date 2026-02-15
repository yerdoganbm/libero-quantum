import assert from 'node:assert/strict';
import { AppGraphBuilder } from '../packages/agent/src/graph/app-graph-builder';
import { migrateAppGraph } from '../packages/core/src/types/app-graph-migrations';
import { createStateSignature } from '../packages/agent/src/crawler/state-signature';
import { rankAlternativeSelectors } from '../packages/learning/src/selector-healing';
import { FormGenerator } from '../packages/generator/src/form-generator';

function testGraphMigration(): void {
  const legacy = {
    version: '6.0.0',
    appName: 'demo',
    baseUrl: 'http://localhost:3000',
    timestamp: new Date().toISOString(),
    nodes: [
      {
        id: 'n1',
        type: 'route',
        route: '/',
        name: 'Home',
        elements: [],
        forms: [{
          id: 'f1',
          selector: { primary: 'form', fallbacks: [], stability: 0.7, type: 'css' },
          fields: [{
            name: 'email',
            type: 'email',
            selector: { primary: '#email', fallbacks: [], stability: 0.8, type: 'css' },
            required: true,
          }],
        }],
        metadata: { firstSeen: '', lastSeen: '', visitCount: 1 },
      },
    ],
    edges: [],
    signatures: {},
    metadata: { totalNodes: 1, totalEdges: 0, totalElements: 0, totalForms: 1, crawlDuration: 10, crawlMethod: 'dynamic' },
  } as any;

  const migrated = migrateAppGraph(legacy);
  assert.equal(migrated.version, '6.1.0');
  assert.deepEqual(migrated.nodes[0].forms[0].fields[0].validationHints, []);
}

function testStateSignatureDeterminism(): void {
  const first = createStateSignature({ route: '/settings', domSignature: 'hash-a', state: { drawerOpen: true, tab: 'profile' } });
  const second = createStateSignature({ route: '/settings', domSignature: 'hash-a', state: { tab: 'profile', drawerOpen: true } });
  assert.equal(first, second);
}

function testSelectorRanking(): void {
  const ranked = rankAlternativeSelectors(['button:has-text("Save")', '[data-testid="save"]', '#save-btn']);
  assert.equal(ranked[0], '[data-testid="save"]');
}

function testFormGeneratorSeed(): void {
  const graph = new AppGraphBuilder().build('app', 'http://localhost:3000', [{
    id: 'route-login',
    type: 'route',
    route: '/login',
    url: 'http://localhost:3000/login',
    name: 'Login',
    elements: [],
    forms: [{
      id: 'form-login',
      selector: { primary: 'form', fallbacks: [], stability: 0.8, type: 'css' },
      fields: [{
        name: 'email',
        type: 'email',
        selector: { primary: '#email', fallbacks: [], stability: 0.9, type: 'css' },
        required: true,
      }],
      validationRules: [],
    }],
    metadata: { firstSeen: '', lastSeen: '', visitCount: 1 },
  }], []);

  const generator = new FormGenerator();
  const runA = generator.generate(graph, { seed: 7 });
  const runB = generator.generate(graph, { seed: 7 });

  assert.deepEqual(runA.map((t) => t.id), runB.map((t) => t.id));
  assert.deepEqual(runA[0].flow[1]?.value, runB[0].flow[1]?.value);
}

testGraphMigration();
testStateSignatureDeterminism();
testSelectorRanking();
testFormGeneratorSeed();

console.log('step1.spec.ts passed');
