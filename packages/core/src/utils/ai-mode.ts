import { LiberoConfig, AIMode } from '../types/config';

export function resolveAIMode(mode: AIMode | undefined, config: LiberoConfig | null): AIMode {
  if (mode) return mode;
  return config?.ai?.mode ?? 'off';
}

export function applyAIMode(config: LiberoConfig, mode: AIMode): LiberoConfig {
  if (mode === 'off') {
    return config;
  }

  const merged: LiberoConfig = {
    ...config,
    ai: { mode },
    mapping: {
      ...config.mapping,
      deepFormExtraction: true,
    },
    generation: {
      ...config.generation,
      formVariants: {
        enabled: true,
        includeInvalidCases: true,
        includeBoundaryCases: mode === 'autopilot',
      },
    },
    learning: {
      ...config.learning,
      autoHeal: true,
      adaptiveExploration: true,
      autoHealConfidenceThreshold:
        mode === 'autopilot'
          ? Math.min(config.learning.autoHealConfidenceThreshold, 0.75)
          : Math.min(config.learning.autoHealConfidenceThreshold, 0.85),
    },
  };

  if (mode === 'autopilot') {
    merged.generation = {
      ...merged.generation,
      coverageTargets: {
        routes: Math.max(merged.generation.coverageTargets.routes, 85),
        elements: Math.max(merged.generation.coverageTargets.elements, 75),
        forms: Math.max(merged.generation.coverageTargets.forms, 85),
        assertions: Math.max(merged.generation.coverageTargets.assertions, 3),
        flows: Math.max(merged.generation.coverageTargets.flows, 5),
      },
    };

    merged.execution = {
      ...merged.execution,
      parallel: true,
      workers: Math.max(merged.execution.workers, 2),
    };
  }

  return merged;
}
