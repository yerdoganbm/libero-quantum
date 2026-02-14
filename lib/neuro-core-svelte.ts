/**
 * @libero/neuro-core-svelte
 * Universal Neuro-Core for Svelte 4/5
 * Her UI uygulamasında kendini otomatik geliştirir.
 */

import { onMount, onDestroy } from 'svelte';
import { writable, get } from 'svelte/store';

let apiUrl = 'http://localhost:3001/api';
let appName = 'unknown';
let sessionId = '';

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr';
  let s = sessionStorage.getItem('neuro_session_id');
  if (!s) {
    s = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('neuro_session_id', s);
  }
  return s;
}

async function sendSynapse(data: any) {
  try {
    await fetch(apiUrl + '/synapse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, appName, sessionId })
    });
  } catch (_) {}
}

export function initNeuroCore(config: { apiUrl?: string; appName: string }) {
  apiUrl = config.apiUrl || apiUrl;
  appName = config.appName;
  sessionId = getSessionId();
}

export function neuroTracking(userId: string | undefined, screen: string, metadata?: Record<string, any>) {
  const startTime = Date.now();
  onMount(() => {
    if (!userId) return;
    sendSynapse({ userId, action: 'screen_view', screen, duration: 0, metadata });
  });
  onDestroy(() => {
    if (!userId) return;
    const duration = (Date.now() - startTime) / 1000;
    sendSynapse({ userId, action: 'screen_view', screen, duration, metadata });
  });
}

export function createNeuroAction(userId: string | undefined, currentScreen: string) {
  return (action: string, metadata?: Record<string, any>) => {
    if (!userId) return;
    sendSynapse({ userId, action, screen: currentScreen, duration: 0, metadata });
  };
}

export function neuroABTest(feature: string, userId: string | undefined) {
  const variant = writable<'A' | 'B'>('A');
  const config = writable<any>(null);
  const loading = writable(true);

  onMount(async () => {
    if (!userId) { loading.set(false); return; }
    try {
      const res = await fetch(`${apiUrl}/variant/${feature}?userId=${userId}&appName=${appName}`);
      const data = await res.json();
      variant.set(data.variant);
      config.set(data.config);
    } catch (_) {}
    loading.set(false);
  });

  const trackConversion = (success: boolean, revenue?: number) => {
    fetch(apiUrl + '/ab-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, variant: get(variant), success, revenue, appName })
    }).catch(() => {});
  };

  return { variant, config, loading, trackConversion };
}

export function neuroAnalytics(refreshIntervalMs = 10000) {
  const analytics = writable<any>(null);
  const loading = writable(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiUrl}/analytics?appName=${appName}`);
      analytics.set(await res.json());
    } catch (_) {}
    loading.set(false);
  };

  onMount(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshIntervalMs);
    onDestroy(() => clearInterval(interval));
  });

  return { analytics, loading, refetch: fetchAnalytics };
}

export function neuroAutoEvolution() {
  const patches = writable<any[]>([]);
  const suggestions = writable<any[]>([]);

  const fetchPatches = async () => {
    try {
      const res = await fetch(`${apiUrl}/evolution/patches?appName=${appName}`);
      const data = await res.json();
      patches.set(data.patches || []);
    } catch (_) {}
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${apiUrl}/evolution/improvements?appName=${appName}`);
      const data = await res.json();
      suggestions.set((data.improvements || []).filter((i: any) => i.status === 'suggested' || i.status === 'approved'));
    } catch (_) {}
  };

  const runAnalyze = async () => {
    await fetch(apiUrl + '/evolution/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appName }) });
    await fetchPatches();
    await fetchSuggestions();
  };

  onMount(() => { fetchPatches(); fetchSuggestions(); });

  return { patches, suggestions, runAnalyze, refetch: () => { fetchPatches(); fetchSuggestions(); } };
}

export function neuroHeatmap(screen: string) {
  return (e: MouseEvent) => {
    fetch(apiUrl + '/heatmap/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: e.clientX, y: e.clientY, screen, sessionId, appName })
    }).catch(() => {});
  };
}

export default {
  initNeuroCore,
  neuroTracking,
  createNeuroAction,
  neuroABTest,
  neuroAnalytics,
  neuroAutoEvolution,
  neuroHeatmap
};
