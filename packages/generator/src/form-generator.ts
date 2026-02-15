/**
 * Form Test Generator
 * Generates positive, negative, and edge-case validation tests
 */

import { AppGraph, TestCase, TestStep, Assertion, FormDescriptor, AppNode } from '@libero/core';
import { logger, generateId } from '@libero/core';

export class FormGenerator {
  generate(graph: AppGraph): TestCase[] {
    logger.info(`Generating form tests...`);
    const tests: TestCase[] = [];

    for (const node of graph.nodes.filter(n => n.forms && n.forms.length > 0)) {
      for (const form of node.forms) {
        tests.push(...this.generatePositiveTests(node, form, graph.baseUrl));
        tests.push(...this.generateNegativeTests(node, form, graph.baseUrl));
        tests.push(...this.generateEdgeCaseTests(node, form, graph.baseUrl));
      }
    }

    logger.success(`Generated ${tests.length} form tests`);
    return tests;
  }

  private generatePositiveTests(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase[] {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
    ];

    // Fill each field with valid data
    for (const field of form.fields) {
      const value = this.generateValidValue(field.type);
      steps.push({
        id: generateId('step'),
        action: field.type === 'select' ? 'select' : 'fill',
        target: field.selector.primary,
        value,
        description: `Fill "${field.name || field.label}" with valid ${field.type}`,
        options: { timeout: 3000 },
      });
    }

    // Submit
    if (form.submitButton) {
      steps.push({
        id: generateId('step'),
        action: 'click',
        target: form.submitButton.selector.primary,
        description: 'Submit form',
        options: { timeout: 3000 },
      });
    }

    const assertions: Assertion[] = [
      {
        type: 'visible',
        target: form.selector.primary,
        description: 'Form should be visible',
      },
    ];

    return [{
      id: generateId('test'),
      name: `[Form] ${node.name} - Valid submission`,
      description: `Fill form with valid data and submit`,
      flow: steps,
      assertions,
      tags: ['form', 'positive', node.route || 'root'],
      priority: 'high',
      estimatedDuration: 5000,
    }];
  }

  private generateNegativeTests(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase[] {
    const tests: TestCase[] = [];
    const requiredFields = form.fields.filter(f => f.required);

    if (requiredFields.length === 0) return [];

    // Test: submit empty form (should show validation)
    const emptySteps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
      {
        id: generateId('step'),
        action: 'click',
        target: form.submitButton?.selector.primary || 'button[type="submit"]',
        description: 'Submit empty form',
        options: { timeout: 3000 },
      },
    ];

    tests.push({
      id: generateId('test'),
      name: `[Form] ${node.name} - Empty submission validation`,
      description: `Submit form without filling required fields`,
      flow: emptySteps,
      assertions: [
        {
          type: 'visible',
          target: form.selector.primary,
          description: 'Form should remain visible (validation failed)',
        },
      ],
      tags: ['form', 'negative', 'validation', node.route || 'root'],
      priority: 'medium',
      estimatedDuration: 4000,
    });

    // Test: invalid email
    const emailField = form.fields.find(f => f.type === 'email');
    if (emailField) {
      const invalidEmailSteps: TestStep[] = [
        {
          id: generateId('step'),
          action: 'navigate',
          target: node.url || baseUrl + (node.route || '/'),
          description: `Navigate to ${node.name}`,
        },
        {
          id: generateId('step'),
          action: 'fill',
          target: emailField.selector.primary,
          value: 'not-an-email',
          description: 'Fill email with invalid format',
        },
        {
          id: generateId('step'),
          action: 'click',
          target: form.submitButton?.selector.primary || 'button[type="submit"]',
          description: 'Submit form',
        },
      ];

      tests.push({
        id: generateId('test'),
        name: `[Form] ${node.name} - Invalid email validation`,
        description: `Test email field validation`,
        flow: invalidEmailSteps,
        assertions: [],
        tags: ['form', 'negative', 'email', node.route || 'root'],
        priority: 'medium',
        estimatedDuration: 4000,
      });
    }

    return tests;
  }

  private generateEdgeCaseTests(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase[] {
    const tests: TestCase[] = [];
    const textFields = form.fields.filter(f => f.type === 'text' || f.type === 'email');

    if (textFields.length === 0) return [];

    // Test: very long input
    const longInputSteps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
      },
      {
        id: generateId('step'),
        action: 'fill',
        target: textFields[0].selector.primary,
        value: 'x'.repeat(10000),
        description: 'Fill with 10k characters',
      },
    ];

    tests.push({
      id: generateId('test'),
      name: `[Form] ${node.name} - Long input edge case`,
      description: `Test form with extremely long input`,
      flow: longInputSteps,
      assertions: [],
      tags: ['form', 'edge', node.route || 'root'],
      priority: 'low',
      estimatedDuration: 3000,
    });

    return tests;
  }

  private generateValidValue(type: string): string {
    const data: Record<string, string> = {
      'text': 'Test User',
      'email': 'test@example.com',
      'password': 'SecurePass123!',
      'tel': '+1234567890',
      'number': '42',
      'url': 'https://example.com',
      'date': '2026-02-15',
    };
    return data[type] || 'test value';
  }
}
