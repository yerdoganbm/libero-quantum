/**
 * Selector Healing: try alternative selectors when primary fails
 */

import { ElementDescriptor, SelectorStrategy } from '@libero/core';
import { KnowledgeBase } from './knowledge-base';

export interface HealingResult {
  success: boolean;
  selector?: string;
  strategy?: SelectorStrategy['type'];
  attempts: number;
}

export function generateAlternativeSelectors(element: ElementDescriptor): string[] {
  const alternatives: string[] = [];
  const { attributes, text, role, type, name } = element;

  // aria-label
  if (attributes['aria-label']) {
    alternatives.push(`[aria-label="${attributes['aria-label']}"]`);
  }

  // role + name
  if (role && name) {
    alternatives.push(`[role="${role}"][name="${name}"]`);
  }

  // text content (for buttons/links)
  if (text && (type === 'button' || type === 'link')) {
    alternatives.push(`${type}:has-text("${text.trim().slice(0, 30)}")`);
  }

  // data-testid (common convention)
  if (attributes['data-testid']) {
    alternatives.push(`[data-testid="${attributes['data-testid']}"]`);
  }
  if (attributes['data-test']) {
    alternatives.push(`[data-test="${attributes['data-test']}"]`);
  }

  // id
  if (attributes.id) {
    alternatives.push(`#${attributes.id}`);
  }

  // placeholder (inputs)
  if (element.placeholder) {
    alternatives.push(`[placeholder="${element.placeholder}"]`);
  }

  // type + name
  if (type && attributes.name) {
    alternatives.push(`${type}[name="${attributes.name}"]`);
  }

  // Remove duplicates
  return Array.from(new Set(alternatives));
}

export async function attemptSelectorHealing(
  element: ElementDescriptor,
  kb: KnowledgeBase,
  trySelector: (sel: string) => Promise<boolean>,
  context?: string
): Promise<HealingResult> {
  const signatureId = element.id;
  const sig = await kb.getSignature(signatureId);

  const alternatives = sig
    ? JSON.parse(sig.alternativeSelectors)
    : generateAlternativeSelectors(element);

  let attempts = 0;
  for (const sel of alternatives) {
    attempts++;
    const success = await trySelector(sel);
    await kb.recordAttempt({ signatureId, selector: sel, success, timestamp: new Date().toISOString(), context });

    if (success) {
      await kb.incrementSuccess(signatureId);
      return { success: true, selector: sel, attempts };
    }
  }

  await kb.incrementFail(signatureId);
  return { success: false, attempts };
}
