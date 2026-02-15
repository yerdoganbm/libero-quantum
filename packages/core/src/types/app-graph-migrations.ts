import { AppGraph, FieldConstraints, FormDescriptor, FormField, ValidationRule } from './app-graph';

const CURRENT_GRAPH_VERSION = '6.1.0';

type LegacyGraph = AppGraph & { version?: string };

function normalizeField(field: any): FormField {
  const constraints: FieldConstraints = {
    minLength: typeof field.minLength === 'number' ? field.minLength : undefined,
    maxLength: typeof field.maxLength === 'number' ? field.maxLength : undefined,
    min: typeof field.min === 'number' ? field.min : undefined,
    max: typeof field.max === 'number' ? field.max : undefined,
    pattern: typeof field.pattern === 'string' ? field.pattern : undefined,
    step: typeof field.step === 'string' ? field.step : undefined,
  };

  return {
    ...field,
    constraints: field.constraints ?? constraints,
    validationHints: field.validationHints ?? [],
  };
}

function normalizeRule(rule: any): ValidationRule {
  if (typeof rule === 'string') {
    return { field: 'unknown', rule: 'pattern', message: rule };
  }
  return rule;
}

function normalizeForm(form: any): FormDescriptor {
  return {
    ...form,
    method: form.method ?? 'POST',
    action: form.action ?? '',
    fields: (form.fields ?? []).map((field: any) => normalizeField(field)),
    validationRules: (form.validationRules ?? []).map((rule: any) => normalizeRule(rule)),
  };
}

export function migrateAppGraph(graph: LegacyGraph): AppGraph {
  const migrated: AppGraph = {
    ...graph,
    version: CURRENT_GRAPH_VERSION,
    nodes: graph.nodes.map((node) => ({
      ...node,
      forms: (node.forms ?? []).map((form) => normalizeForm(form)),
    })),
  };

  return migrated;
}

export function getCurrentGraphVersion(): string {
  return CURRENT_GRAPH_VERSION;
}
