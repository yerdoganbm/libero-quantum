/**
 * CRUD Generator: detect and test create/read/update/delete operations
 */

import { AppGraph, AppNode, TestCase, TestStep } from '@libero/core';
import { logger, generateId } from '@libero/core';

export class CRUDGenerator {
  generate(graph: AppGraph): TestCase[] {
    logger.info('Generating CRUD tests...');
    const tests: TestCase[] = [];

    // Detect CRUD patterns
    const crudScreens = this.detectCRUDScreens(graph);

    for (const screen of crudScreens) {
      if (screen.hasCreate) {
        tests.push(this.generateCreateTest(screen, graph.baseUrl));
      }
      if (screen.hasList) {
        tests.push(this.generateReadTest(screen, graph.baseUrl));
      }
      if (screen.hasEdit) {
        tests.push(this.generateUpdateTest(screen, graph.baseUrl));
      }
      if (screen.hasDelete) {
        tests.push(this.generateDeleteTest(screen, graph.baseUrl));
      }
    }

    logger.success(`Generated ${tests.length} CRUD tests`);
    return tests;
  }

  private detectCRUDScreens(graph: AppGraph): Array<{
    node: AppNode;
    hasCreate: boolean;
    hasEdit: boolean;
    hasDelete: boolean;
    hasList: boolean;
    entity: string;
  }> {
    const screens: ReturnType<CRUDGenerator['detectCRUDScreens']> = [];

    for (const node of graph.nodes.filter(n => n.type === 'route')) {
      const route = node.route || '';
      const hasCreate = node.elements.some(e => 
        (e.type === 'button' && (e.text?.toLowerCase().includes('create') || e.text?.toLowerCase().includes('add') || e.text?.toLowerCase().includes('new'))) ||
        node.forms.length > 0
      );
      const hasEdit = node.elements.some(e => 
        e.type === 'button' && (e.text?.toLowerCase().includes('edit') || e.text?.toLowerCase().includes('update'))
      );
      const hasDelete = node.elements.some(e => 
        e.type === 'button' && (e.text?.toLowerCase().includes('delete') || e.text?.toLowerCase().includes('remove'))
      );
      const hasList = node.elements.some(e => e.role === 'list' || e.role === 'table') ||
        route.includes('list') || route.endsWith('s');

      if (hasCreate || hasEdit || hasDelete || hasList) {
        const entity = this.extractEntityName(route, node.name);
        screens.push({ node, hasCreate, hasEdit, hasDelete, hasList, entity });
      }
    }

    return screens;
  }

  private extractEntityName(route: string, nodeName: string): string {
    const match = route.match(/\/([\w-]+)/);
    if (match) return match[1].replace(/-/g, ' ');
    return nodeName.split(' ')[0] || 'Item';
  }

  private generateCreateTest(screen: ReturnType<CRUDGenerator['detectCRUDScreens']>[0], baseUrl: string): TestCase {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: screen.node.url || baseUrl + screen.node.route,
        description: `Navigate to ${screen.node.name}`,
      },
    ];

    const createButton = screen.node.elements.find(e => 
      e.type === 'button' && (e.text?.toLowerCase().includes('create') || e.text?.toLowerCase().includes('add') || e.text?.toLowerCase().includes('new'))
    );

    if (createButton) {
      steps.push({
        id: generateId('step'),
        action: 'click',
        target: createButton,
        description: `Click "${createButton.text}" button`,
        options: { timeout: 3000 },
      });
    }

    // Fill form if exists
    if (screen.node.forms.length > 0) {
      const form = screen.node.forms[0];
      for (const field of form.fields) {
        steps.push({
          id: generateId('step'),
          action: field.type === 'select' ? 'select' : 'fill',
          target: field.selector.primary,
          value: this.generateTestValue(field.type),
          description: `Fill "${field.name}"`,
        });
      }
      if (form.submitButton) {
        steps.push({
          id: generateId('step'),
          action: 'click',
          target: form.submitButton,
          description: 'Submit form',
        });
      }
    }

    return {
      id: generateId('test'),
      name: `[CRUD] Create ${screen.entity}`,
      description: `Test create operation for ${screen.entity}`,
      flow: steps,
      assertions: [],
      tags: ['crud', 'create', screen.node.route || 'root'],
      priority: 'high',
      estimatedDuration: 5000,
    };
  }

  private generateReadTest(screen: ReturnType<CRUDGenerator['detectCRUDScreens']>[0], baseUrl: string): TestCase {
    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: screen.node.url || baseUrl + screen.node.route,
        description: `Navigate to ${screen.node.name}`,
      },
      {
        id: generateId('step'),
        action: 'wait',
        options: { timeout: 2000, waitFor: 'networkidle' },
        description: 'Wait for list to load',
      },
    ];

    return {
      id: generateId('test'),
      name: `[CRUD] Read/List ${screen.entity}`,
      description: `Test list/read operation for ${screen.entity}`,
      flow: steps,
      assertions: [
        {
          type: 'url',
          target: screen.node.route || '/',
          expected: screen.node.route || '/',
          operator: 'contains',
          description: 'Verify on list page',
        },
      ],
      tags: ['crud', 'read', screen.node.route || 'root'],
      priority: 'medium',
      estimatedDuration: 3000,
    };
  }

  private generateUpdateTest(screen: ReturnType<CRUDGenerator['detectCRUDScreens']>[0], baseUrl: string): TestCase {
    const editButton = screen.node.elements.find(e => 
      e.type === 'button' && (e.text?.toLowerCase().includes('edit') || e.text?.toLowerCase().includes('update'))
    );

    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: screen.node.url || baseUrl + screen.node.route,
        description: `Navigate to ${screen.node.name}`,
      },
    ];

    if (editButton) {
      steps.push({
        id: generateId('step'),
        action: 'click',
        target: editButton,
        description: `Click "${editButton.text}" button`,
      });
    }

    return {
      id: generateId('test'),
      name: `[CRUD] Update ${screen.entity}`,
      description: `Test update operation for ${screen.entity}`,
      flow: steps,
      assertions: [],
      tags: ['crud', 'update', screen.node.route || 'root'],
      priority: 'medium',
      estimatedDuration: 4000,
    };
  }

  private generateDeleteTest(screen: ReturnType<CRUDGenerator['detectCRUDScreens']>[0], baseUrl: string): TestCase {
    const deleteButton = screen.node.elements.find(e => 
      e.type === 'button' && (e.text?.toLowerCase().includes('delete') || e.text?.toLowerCase().includes('remove'))
    );

    const steps: TestStep[] = [
      {
        id: generateId('step'),
        action: 'navigate',
        target: screen.node.url || baseUrl + screen.node.route,
        description: `Navigate to ${screen.node.name}`,
      },
    ];

    if (deleteButton) {
      steps.push({
        id: generateId('step'),
        action: 'click',
        target: deleteButton,
        description: `Click "${deleteButton.text}" button`,
      });
    }

    return {
      id: generateId('test'),
      name: `[CRUD] Delete ${screen.entity}`,
      description: `Test delete operation for ${screen.entity}`,
      flow: steps,
      assertions: [],
      tags: ['crud', 'delete', screen.node.route || 'root'],
      priority: 'low',
      estimatedDuration: 3000,
    };
  }

  private generateTestValue(fieldType: string): string {
    const values: Record<string, string> = {
      text: 'Test Item',
      email: 'test@example.com',
      number: '42',
      date: '2026-02-15',
      tel: '+1234567890',
      url: 'https://example.com',
    };
    return values[fieldType] || 'Test Value';
  }
}
