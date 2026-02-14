/**
 * @libero/neuro-core-vue
 * Universal Neuro-Core for Vue 3 (Composition API)
 * Her UI uygulamasında kendini otomatik geliştirir.
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';

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

export function useNeuroTracking(userId: string | undefined, screen: string, metadata?: Record<string, any>) {
  const startTime = Date.now();
  onMounted(() => {
    if (!userId) return;
    sendSynapse({ userId, action: 'screen_view', screen, duration: 0, metadata });
  });
  onUnmounted(() => {
    if (!userId) return;
    const duration = (Date.now() - startTime) / 1000;
    sendSynapse({ userId, action: 'screen_view', screen, duration, metadata });
  });
}

export function useNeuroAction(userId: string | undefined, currentScreen: string) {
  return (action: string, metadata?: Record<string, any>) => {
    if (!userId) return;
    sendSynapse({ userId, action, screen: currentScreen, duration: 0, metadata });
  };
}

export function useNeuroABTest(feature: string, userId: string | undefined) {
  const variant = ref<'A' | 'B'>('A');
  const config = ref<any>(null);
  const loading = ref(true);

  const fetchVariant = async () => {
    if (!userId) { loading.value = false; return; }
    try {
      const res = await fetch(`${apiUrl}/variant/${feature}?userId=${userId}&appName=${appName}`);
      const data = await res.json();
      variant.value = data.variant;
      config.value = data.config;
    } catch (_) {}
    loading.value = false;
  };

  onMounted(fetchVariant);

  const trackConversion = (success: boolean, revenue?: number) => {
    fetch(apiUrl + '/ab-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, variant: variant.value, success, revenue, appName })
    }).catch(() => {});
  };

  return { variant, config, loading, trackConversion };
}

export function useNeuroAnalytics(refreshIntervalMs = 10000) {
  const analytics = ref<any>(null);
  const loading = ref(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiUrl}/analytics?appName=${appName}`);
      analytics.value = await res.json();
    } catch (_) {}
    loading.value = false;
  };

  onMounted(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshIntervalMs);
    onUnmounted(() => clearInterval(interval));
  });

  return { analytics, loading, refetch: fetchAnalytics };
}

export function useNeuroAutoEvolution() {
  const patches = ref<any[]>([]);
  const suggestions = ref<any[]>([]);

  const fetchPatches = async () => {
    try {
      const res = await fetch(`${apiUrl}/evolution/patches?appName=${appName}`);
      const data = await res.json();
      patches.value = data.patches || [];
    } catch (_) {}
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${apiUrl}/evolution/improvements?appName=${appName}`);
      const data = await res.json();
      suggestions.value = (data.improvements || []).filter((i: any) => i.status === 'suggested' || i.status === 'approved');
    } catch (_) {}
  };

  const runAnalyze = async () => {
    await fetch(apiUrl + '/evolution/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appName }) });
    await fetchPatches();
    await fetchSuggestions();
  };

  onMounted(() => { fetchPatches(); fetchSuggestions(); });

  return { patches, suggestions, runAnalyze, refetch: () => { fetchPatches(); fetchSuggestions(); } };
}

export function useNeuroHeatmap(screen: string) {
  return (e: MouseEvent) => {
    fetch(apiUrl + '/heatmap/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: e.clientX, y: e.clientY, screen, sessionId, appName })
    }).catch(() => {});
  };
}

export function useNeuroReplay(sessionIdRef: string) {
  return (type: string, data: any) => {
    fetch(apiUrl + '/replay/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionIdRef, type, data, appName })
    }).catch(() => {});
  };
}

export default {
  initNeuroCore,
  useNeuroTracking,
  useNeuroAction,
  useNeuroABTest,
  useNeuroAnalytics,
  useNeuroAutoEvolution,
  useNeuroHeatmap,
  useNeuroReplay
};
