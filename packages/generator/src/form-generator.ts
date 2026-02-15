/**
 * Form Test Generator
 * Generates deterministic positive, negative, and boundary validation tests.
 */

import { AppGraph, TestCase, TestStep, Assertion, FormDescriptor, AppNode, FormField } from '@libero/core';
import { logger, hashString } from '@libero/core';

export interface FormGeneratorOptions {
  seed?: number;
  includeInvalidCases?: boolean;
  includeBoundaryCases?: boolean;
}

export class FormGenerator {
  private seed = 42;
  private sequence = 0;

  generate(graph: AppGraph, options: FormGeneratorOptions = {}): TestCase[] {
    logger.info('Generating form tests...');
    this.seed = options.seed ?? 42;
    this.sequence = 0;

    const tests: TestCase[] = [];

    for (const node of graph.nodes.filter((n) => n.forms && n.forms.length > 0)) {
      for (const form of node.forms) {
        tests.push(this.generatePositiveTest(node, form, graph.baseUrl));
        tests.push(this.generateEmptySubmissionTest(node, form, graph.baseUrl));

        if (options.includeInvalidCases !== false) {
          tests.push(...this.generateInvalidTests(node, form, graph.baseUrl));
        }

        if (options.includeBoundaryCases !== false) {
          tests.push(...this.generateBoundaryTests(node, form, graph.baseUrl));
        }
      }
    }

    logger.success(`Generated ${tests.length} form tests`);
    return tests;
  }

  private generatePositiveTest(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase {
    const steps = this.baseSteps(node, baseUrl);

    for (const field of form.fields) {
      const value = this.generateValidValue(field);
      steps.push({
        id: this.makeId('step', `${form.id}-${field.name}-valid`),
        action: field.type === 'select' ? 'select' : 'fill',
        target: field.selector.primary,
        value,
        description: `Fill ${field.name} with valid ${field.type}`,
      });
    }

    if (form.submitButton) {
      steps.push({
        id: this.makeId('step', `${form.id}-submit`),
        action: 'click',
        target: form.submitButton.selector.primary,
        description: 'Submit form with valid payload',
      });
    }

    return {
      id: this.makeId('test', `${node.id}-${form.id}-positive`),
      name: `[Form] ${node.name} - Valid submission`,
      description: 'Fills every field with valid deterministic values.',
      flow: steps,
      assertions: this.defaultAssertions(form),
      tags: ['form', 'positive', node.route || 'root'],
      priority: 'high',
      estimatedDuration: 5000,
    };
  }

  private generateEmptySubmissionTest(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase {
    const steps = this.baseSteps(node, baseUrl);
    steps.push({
      id: this.makeId('step', `${form.id}-empty-submit`),
      action: 'click',
      target: form.submitButton?.selector.primary || 'button[type="submit"]',
      description: 'Submit form without filling required fields',
    });

    return {
      id: this.makeId('test', `${node.id}-${form.id}-empty`),
      name: `[Form] ${node.name} - Empty submission validation`,
      description: 'Ensures required validation blocks empty submission.',
      flow: steps,
      assertions: this.defaultAssertions(form),
      tags: ['form', 'negative', 'validation', node.route || 'root'],
      priority: 'medium',
      estimatedDuration: 4000,
    };
  }

  private generateInvalidTests(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase[] {
    const tests: TestCase[] = [];
    const emailField = form.fields.find((f) => f.type === 'email');

    if (emailField) {
      const steps = this.baseSteps(node, baseUrl);
      steps.push({
        id: this.makeId('step', `${form.id}-${emailField.name}-invalid`),
        action: 'fill',
        target: emailField.selector.primary,
        value: 'invalid-email-format',
        description: 'Fill email field with invalid format',
      });
      steps.push({
        id: this.makeId('step', `${form.id}-invalid-submit`),
        action: 'click',
        target: form.submitButton?.selector.primary || 'button[type="submit"]',
      });

      tests.push({
        id: this.makeId('test', `${node.id}-${form.id}-invalid-email`),
        name: `[Form] ${node.name} - Invalid email`,
        description: 'Checks email validation flow.',
        flow: steps,
        assertions: this.defaultAssertions(form),
        tags: ['form', 'negative', 'email', node.route || 'root'],
        priority: 'medium',
        estimatedDuration: 4000,
      });
    }

    return tests;
  }

  private generateBoundaryTests(node: AppNode, form: FormDescriptor, baseUrl: string): TestCase[] {
    const tests: TestCase[] = [];

    for (const field of form.fields) {
      const maxLength = field.constraints?.maxLength;
      if (!maxLength || maxLength < 1) continue;

      const steps = this.baseSteps(node, baseUrl);
      steps.push({
        id: this.makeId('step', `${form.id}-${field.name}-boundary-overflow`),
        action: field.type === 'select' ? 'select' : 'fill',
        target: field.selector.primary,
        value: 'x'.repeat(maxLength + 1),
        description: `Overflow maxLength (${maxLength})`,
      });

      tests.push({
        id: this.makeId('test', `${node.id}-${form.id}-${field.name}-boundary`),
        name: `[Form] ${node.name} - ${field.name} max length boundary`,
        description: 'Boundary case generated from extracted field constraints.',
        flow: steps,
        assertions: this.defaultAssertions(form),
        tags: ['form', 'boundary', node.route || 'root'],
        priority: 'low',
        estimatedDuration: 3000,
      });
    }

    return tests;
  }

  private baseSteps(node: AppNode, baseUrl: string): TestStep[] {
    return [
      {
        id: this.makeId('step', `${node.id}-navigate`),
        action: 'navigate',
        target: node.url || baseUrl + (node.route || '/'),
        description: `Navigate to ${node.name}`,
      },
    ];
  }

  private defaultAssertions(form: FormDescriptor): Assertion[] {
    return [
      {
        type: 'visible',
        target: form.selector.primary,
        description: 'Form container remains visible',
      },
    ];
  }

  private generateValidValue(field: FormField): string {
    const data: Record<string, string> = {
      text: `user-${this.nextDeterministicNumber(1000, 9999)}`,
      email: `user${this.nextDeterministicNumber(10, 99)}@example.com`,
      password: `Secure-${this.nextDeterministicNumber(1000, 9999)}!`,
      tel: `+90555${this.nextDeterministicNumber(1000000, 9999999)}`,
      number: String(this.nextDeterministicNumber(1, 99)),
      url: 'https://example.com/path',
      date: '2026-02-15',
      select: field.label || field.name || 'option-1',
      checkbox: 'true',
      radio: field.label || field.name || 'option-a',
    };

    return data[field.type] || 'deterministic-value';
  }

  private nextDeterministicNumber(min: number, max: number): number {
    this.sequence += 1;
    const span = max - min + 1;
    const raw = (this.seed * 9301 + this.sequence * 49297) % 233280;
    return min + (raw % span);
  }

  private makeId(prefix: string, key: string): string {
    return `${prefix}-${hashString(`${this.seed}-${key}`)}`;
  }
}
