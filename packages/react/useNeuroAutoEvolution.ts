/**
 * LIBERO NEURO-CORE - AUTO-EVOLUTION HOOK
 *
 * Her UI uygulamasında kendini otomatik geliştirir:
 * 1. Sunucudan patch'leri çeker
 * 2. CSS / layout / copy önerilerini otomatik uygular (veya onay için listeler)
 * 3. Periyodik analiz tetikler
 */

import { useEffect, useState, useCallback, useRef } from 'react';

const DEFAULT_API = 'http://localhost:3001/api';

export interface NeuroPatch {
  id: string;
  appName: string;
  type: string;
  target: string;
  reason: string;
  evidence: { metric: string; value: number; threshold: number }[];
  patch: Record<string, any>;
  status: string;
  impact?: number;
}

export interface NeuroConfig {
  apiUrl?: string;
  appName: string;
  autoApplyCss?: boolean;
  pollIntervalMs?: number;
  runAnalyzeOnMount?: boolean;
}

let globalApi = DEFAULT_API;
let globalAppName = 'unknown';

/**
 * Initialize auto-evolution (call once, e.g. next to initNeuroCore).
 */
export function initNeuroAutoEvolution(config: NeuroConfig) {
  globalApi = config.apiUrl || DEFAULT_API;
  globalAppName = config.appName;
}

/**
 * Hook: Fetch active patches and optionally apply CSS automatically.
 */
export function useNeuroAutoEvolution(options?: { autoApplyCss?: boolean }) {
  const [patches, setPatches] = useState<NeuroPatch[]>([]);
  const [suggestions, setSuggestions] = useState<NeuroPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const autoApply = options?.autoApplyCss ?? true;

  const fetchPatches = useCallback(async () => {
    try {
      const res = await fetch(`${globalApi}/evolution/patches?appName=${encodeURIComponent(globalAppName)}`);
      const data = await res.json();
      setPatches(data.patches || []);
    } catch (e) {
      setPatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchImprovements = useCallback(async () => {
    try {
      const res = await fetch(`${globalApi}/evolution/improvements?appName=${encodeURIComponent(globalAppName)}`);
      const data = await res.json();
      setSuggestions((data.improvements || []).filter((i: NeuroPatch) => i.status === 'suggested' || i.status === 'approved'));
    } catch (e) {
      setSuggestions([]);
    }
  }, []);

  const runAnalyze = useCallback(async () => {
    try {
      await fetch(`${globalApi}/evolution/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName: globalAppName })
      });
      await fetchImprovements();
      await fetchPatches();
    } catch (_) {}
  }, [fetchImprovements, fetchPatches]);

  const applyPatch = useCallback(async (improvementId: string) => {
    try {
      await fetch(`${globalApi}/evolution/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvementId })
      });
      await fetchPatches();
      await fetchImprovements();
    } catch (_) {}
  }, [fetchPatches, fetchImprovements]);

  const approveSuggestion = useCallback(async (improvementId: string) => {
    try {
      await fetch(`${globalApi}/evolution/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvementId })
      });
      await fetchPatches();
      await fetchImprovements();
    } catch (_) {}
  }, [fetchPatches, fetchImprovements]);

  const rejectSuggestion = useCallback(async (improvementId: string) => {
    try {
      await fetch(`${globalApi}/evolution/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvementId })
      });
      await fetchImprovements();
    } catch (_) {}
  }, [fetchImprovements]);

  useEffect(() => {
    fetchPatches();
    fetchImprovements();
    const interval = setInterval(fetchPatches, 60000);
    return () => clearInterval(interval);
  }, [fetchPatches, fetchImprovements]);

  // Auto-apply CSS patches by injecting a <style> tag
  useEffect(() => {
    if (!autoApply || !patches.length) return;

    const cssParts: string[] = [];
    for (const p of patches) {
      if (p.type !== 'css' || !p.patch || typeof p.patch !== 'object') continue;
      const selector = p.target.includes(' ') || p.target.startsWith('.') || p.target.startsWith('#')
        ? p.target
        : `[data-neuro-screen="${p.target}"], [data-neuro-component="${p.target}"]`;
      const rules = Object.entries(p.patch)
        .filter(([k]) => k !== 'suggest' && k !== 'copyHint')
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ');
      if (rules) cssParts.push(`${selector} { ${rules} }`);
    }

    if (cssParts.length === 0) return;

    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.setAttribute('data-neuro-evolution', 'true');
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = cssParts.join('\n');

    return () => {
      if (styleRef.current) styleRef.current.textContent = '';
    };
  }, [patches, autoApply]);

  return {
    patches,
    suggestions,
    loading,
    runAnalyze,
    applyPatch,
    approveSuggestion,
    rejectSuggestion,
    refetch: () => { fetchPatches(); fetchImprovements(); }
  };
}

export default useNeuroAutoEvolution;
