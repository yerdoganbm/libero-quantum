/**
 * Smoke Test Generator
 * Generates basic smoke tests: navigate → visible → click primary CTA
 */

import { AppGraph, TestPlan, TestSuite, TestCase, TestStep, Assertion, AppNode } from '@libero/core';
import { logger, generateId } from '@libero/core';

export class SmokeGenerator {
  generate(graph: AppGraph, config: { seed?: number }): TestPlan {
    logger.info(`Generating smoke tests for ${graph.nodes.length} pages`);

    const tests: TestCase[] = [];

    // For each route: navigate + heading visible
    for (const node of graph.nodes.filter(n => n.type === 'route')) {
      tests.push(this.generateRouteVisibilityTest(node, graph.baseUrl));
    }

    // For each route with buttons: navigate + click primary button
    for (const node of graph.nodes.filter(n => n.type === 'route' && n.elements.some(e => e.type === 'button'))) {
      tests.push(this.generatePrimaryButtonTest(node, graph.baseUrl));
    }

    // For each route with forms: navigate + form visible
    for (const node of graph.nodes.filter(n => n.type === 'route' && n.forms.length > 0)) {
      tests.push(this.generateFormVisibilityTest(node, graph.baseUrl));
    }

    const suite: TestSuite = {
      id: generateId('suite'),
      name: 'Smoke Tests',
      category: 'smoke',
      tests,
      tags: ['smoke', 'critical'],
    };

    logger.success(`Generated ${tests.length} smoke tests`);

    return {
      version: '6.0.0',
      appName: graph.appName,
      timestamp: new Date().toISOString(),
      suites: [suite],
      config: {
        seed: config.seed || Date.now(),
        coverageTarget: {
          routes: graph.nodes.length,
          interactiveElements: graph.nodes.reduce((sum, n) => sum + n.elements.filter(e => e.type === 'button' || e.type === 'link').length, 0),
          assertions: tests.length * 2,
        },
        flakyRetries: 2,
        screenshotOnFail: true,
        videoOnFail: false,
        traceOnFail: true,
      },
    };
  }

  private generateRouteVisibilityTest(node: AppNode, baseUrl: string): TestCase {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
      {
        id: generateId('step'),
        action: 'wait',
        options: { timeout: 2000, waitFor: 'networkidle' },
        description: 'Wait for page stability',
      },
    ];

    const assertions: Assertion[] = [];
    
    // Heading visible
    const heading = node.elements.find(e => e.role === 'heading');
    if (heading) {
      assertions.push({
        type: 'visible',
        target: heading,
        description: `Heading "${heading.text}" should be visible`,
      });
    }

    // URL should match
    assertions.push({
      type: 'url',
      target: node.route || '/',
      expected: node.route || '/',
      operator: 'contains',
      description: 'URL should contain route',
    });

    return {
      id: generateId('test'),
      name: `[Smoke] ${node.name} - Page loads and heading visible`,
      description: `Navigate to ${node.name} and verify basic content`,
      flow: steps,
      assertions,
      tags: ['smoke', 'navigation', node.route || 'root'],
      priority: 'critical',
      estimatedDuration: 3000,
    };
  }

  private generatePrimaryButtonTest(node: AppNode, baseUrl: string): TestCase {
    const primaryButton = this.findPrimaryButton(node);
    
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
      {
        id: generateId('step'),
        action: 'click',
        target: primaryButton,
        description: `Click "${primaryButton?.name || 'primary button'}"`,
        options: { timeout: 3000 },
      },
    ];

    const assertions: Assertion[] = [
      {
        type: 'visible',
        target: primaryButton!,
        description: 'Button should be visible and clickable',
      },
    ];

    return {
      id: generateId('test'),
      name: `[Smoke] ${node.name} - Primary action clickable`,
      description: `Verify primary button on ${node.name} is interactive`,
      flow: steps,
      assertions,
      tags: ['smoke', 'interaction', node.route || 'root'],
      priority: 'high',
      estimatedDuration: 4000,
    };
  }

  private generateFormVisibilityTest(node: AppNode, baseUrl: string): TestCase {
    const form = node.forms[0];
    
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
      {
        id: generateId('step'),
        action: 'check',
        description: 'Form should be visible',
      },
    ];

    const assertions: Assertion[] = [
      {
        type: 'visible',
        target: form?.selector.primary || 'form',
        description: 'Form should be present',
      },
    ];

    return {
      id: generateId('test'),
      name: `[Smoke] ${node.name} - Form visible`,
      description: `Verify form exists on ${node.name}`,
      flow: steps,
      assertions,
      tags: ['smoke', 'form', node.route || 'root'],
      priority: 'high',
      estimatedDuration: 3000,
    };
  }

  private findPrimaryButton(node: AppNode): any {
    // Heuristic: find "Submit", "Save", "Continue", "Login", "Sign up", first button
    const buttons = node.elements.filter(e => e.type === 'button');
    const keywords = ['submit', 'save', 'continue', 'login', 'sign', 'next', 'confirm'];
    
    for (const keyword of keywords) {
      const match = buttons.find(b => b.text?.toLowerCase().includes(keyword) || b.name?.toLowerCase().includes(keyword));
      if (match) return match;
    }
    
    return buttons[0] || null;
  }
}
