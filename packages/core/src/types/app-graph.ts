/**
 * AppGraph: Application structure representation
 */

export interface AppGraph {
  version: string;
  appName: string;
  baseUrl: string;
  timestamp: string;
  framework?: string;
  nodes: AppNode[];
  edges: AppEdge[];
  signatures: Record<string, Signature>;
  metadata: GraphMetadata;
}

export interface AppNode {
  id: string;
  type: 'route' | 'component' | 'modal' | 'flow';
  url?: string;
  route?: string;
  name: string;
  elements: ElementDescriptor[];
  forms: FormDescriptor[];
  metadata: NodeMetadata;
}

export interface AppEdge {
  from: string;
  to: string;
  type: 'navigate' | 'submit' | 'modal' | 'tab';
  trigger: ElementDescriptor;
  metadata?: Record<string, any>;
}

export interface ElementDescriptor {
  id: string;
  role: string;
  name?: string;
  selector: SelectorStrategy;
  type: 'button' | 'link' | 'input' | 'heading' | 'select' | 'checkbox' | 'radio' | 'other';
  attributes: Record<string, string>;
  text?: string;
  placeholder?: string;
  confidence: number;
  position?: { x: number; y: number };
}

export interface SelectorStrategy {
  primary: string;
  fallbacks: string[];
  stability: number;
  type: 'data-testid' | 'role' | 'label' | 'css' | 'xpath';
}

export interface FormDescriptor {
  id: string;
  selector: SelectorStrategy;
  fields: FormField[];
  submitButton?: ElementDescriptor;
  validationRules?: ValidationRule[];
  method?: string;
  action?: string;
}

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'select' | 'checkbox' | 'radio';
  selector: SelectorStrategy;
  required: boolean;
  placeholder?: string;
  label?: string;
  constraints?: FieldConstraints;
  validationHints?: string[];
}

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  step?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'min' | 'max' | 'pattern';
  message?: string;
}

export interface Signature {
  domHash: string;
  screenshot?: string;
  a11yTree?: string;
  timestamp: string;
}

export interface NodeMetadata {
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
  responseTime?: number;
  networkCalls?: string[];
}

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  totalElements: number;
  totalForms: number;
  crawlDuration: number;
  crawlMethod: 'static' | 'dynamic' | 'hybrid';
}
