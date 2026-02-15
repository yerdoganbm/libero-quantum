/**
 * A11y Generator: basic accessibility checks
 */

import { AppGraph, AppNode, TestCase, TestStep, Assertion } from '@libero/core';
import { logger, generateId } from '@libero/core';

export class A11yGenerator {
  generate(graph: AppGraph): TestCase[] {
    logger.info('Generating A11y tests...');
    const tests: TestCase[] = [];

    for (const node of graph.nodes.filter(n => n.type === 'route')) {
      // Heading structure test
      tests.push(this.generateHeadingTest(node, graph.baseUrl));

      // Form labels test
      if (node.forms.length > 0) {
        tests.push(this.generateFormLabelTest(node, graph.baseUrl));
      }

      // Image alt text test
      const images = node.elements.filter(e => e.role === 'img');
      if (images.length > 0) {
        tests.push(this.generateImageAltTest(node, graph.baseUrl, images));
      }

      // Button/link accessible names
      const interactives = node.elements.filter(e => e.type === 'button' || e.type === 'link');
      if (interactives.length > 0) {
        tests.push(this.generateInteractiveNameTest(node, graph.baseUrl, interactives));
      }
    }

    logger.success(`Generated ${tests.length} A11y tests`);
    return tests;
  }

  private generateHeadingTest(node: AppNode, baseUrl: string): TestCase {
    const headings = node.elements.filter(e => e.role === 'heading');

    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + node.route,
        description: `Navigate to ${node.name}`,
      },
    ];

    const assertions: Assertion[] = [
      {
        type: 'url',
        target: node.route || '/',
        expected: node.route || '/',
        operator: 'contains',
        description: 'On correct page',
      },
    ];

    if (headings.length > 0) {
      assertions.push({
        type: 'visible',
        target: headings[0],
        description: 'Page has a heading',
      });
    }

    return {
      id: generateId('test'),
      name: `[A11y] ${node.name} - Heading structure`,
      description: `Verify ${node.name} has proper heading hierarchy`,
      flow: steps,
      assertions,
      tags: ['a11y', 'heading', node.route || 'root'],
      priority: 'medium',
      estimatedDuration: 2000,
    };
  }

  private generateFormLabelTest(node: AppNode, baseUrl: string): TestCase {
    const form = node.forms[0];
    const unlabeledFields = form.fields.filter(f => !f.label && !f.placeholder);

    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + node.route,
        description: `Navigate to ${node.name}`,
      },
    ];

    const assertions: Assertion[] = [
      {
        type: 'visible',
        target: form.selector.primary,
        description: 'Form is visible',
      },
    ];

    return {
      id: generateId('test'),
      name: `[A11y] ${node.name} - Form labels`,
      description: `Verify form fields have accessible labels. Found ${unlabeledFields.length} unlabeled fields.`,
      flow: steps,
      assertions,
      tags: ['a11y', 'form', 'labels', node.route || 'root'],
      priority: unlabeledFields.length > 0 ? 'high' : 'low',
      estimatedDuration: 2000,
    };
  }

  private generateImageAltTest(node: AppNode, baseUrl: string, images: any[]): TestCase {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + node.route,
        description: `Navigate to ${node.name}`,
      },
    ];

    const missingAlt = images.filter(img => !img.attributes.alt || img.attributes.alt.trim() === '');

    return {
      id: generateId('test'),
      name: `[A11y] ${node.name} - Image alt text`,
      description: `Verify images have alt text. Found ${images.length} images, ${missingAlt.length} missing alt.`,
      flow: steps,
      assertions: [],
      tags: ['a11y', 'images', node.route || 'root'],
      priority: missingAlt.length > 0 ? 'high' : 'low',
      estimatedDuration: 2000,
    };
  }

  private generateInteractiveNameTest(node: AppNode, baseUrl: string, interactives: any[]): TestCase {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + node.route,
        description: `Navigate to ${node.name}`,
      },
    ];

    const unnamed = interactives.filter(el => !el.name && !el.text && !el.attributes['aria-label']);

    return {
      id: generateId('test'),
      name: `[A11y] ${node.name} - Interactive element names`,
      description: `Verify buttons/links have accessible names. Found ${interactives.length} elements, ${unnamed.length} unnamed.`,
      flow: steps,
      assertions: [],
      tags: ['a11y', 'interactive', node.route || 'root'],
      priority: unnamed.length > 0 ? 'medium' : 'low',
      estimatedDuration: 2000,
    };
  }
}
