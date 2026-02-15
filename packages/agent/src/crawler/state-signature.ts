import { hashString } from '@libero/core';

export interface StateSignatureInput {
  route: string;
  domSignature: string;
  state: Record<string, string | number | boolean | null | undefined>;
}

export function createStateSignature(input: StateSignatureInput): string {
  const normalizedState = Object.entries(input.state)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value ?? '')}`)
    .join('|');

  return hashString(`${input.route}::${input.domSignature}::${normalizedState}`);
}
