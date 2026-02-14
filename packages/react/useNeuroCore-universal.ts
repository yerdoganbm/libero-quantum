/**
 * @libero/neuro-core-react
 * 
 * Universal React Hooks for ANY React Application
 * 
 * Works with:
 * - E-commerce apps (Shopify-like)
 * - SaaS dashboards (Notion, Linear, Airtable-like)
 * - Social media (Twitter, Instagram-like)
 * - Fintech apps (Banking, Trading platforms)
 * - Healthcare (Patient portals, EMR systems)
 * - Education (LMS, Online courses)
 * - ANY React app!
 * 
 * NOT Sahada-specific!
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

interface NeuroConfig {
  apiUrl?: string;
  appName: string;
  appVersion?: string;
  enabled?: boolean;
  debug?: boolean;
}

let globalConfig: NeuroConfig = {
  apiUrl: 'http://localhost:3001/api',
  appName: 'unknown',
  enabled: true,
  debug: false
};

/**
 * Initialize Neuro-Core (Call once in your app root)
 * 
 * Example:
 * ```tsx
 * // For e-commerce:
 * initNeuroCore({ appName: 'myshop', appVersion: '1.2.0' });
 * 
 * // For SaaS:
 * initNeuroCore({ appName: 'myapp', apiUrl: 'https://analytics.myapp.com/api' });
 * ```
 */
export function initNeuroCore(config: NeuroConfig) {
  globalConfig = { ...globalConfig, ...config };
  
  if (globalConfig.debug) {
    console.log('🧠 Neuro-Core initialized:', globalConfig);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK 1: AUTO-TRACK SCREEN VIEWS (Universal)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Automatically track screen views and time spent
 * 
 * Example (E-commerce):
 * ```tsx
 * function ProductPage() {
 *   useNeuroTracking(userId, 'product_detail');
 *   // ...
 * }
 * ```
 * 
 * Example (SaaS):
 * ```tsx
 * function DashboardScreen() {
 *   useNeuroTracking(userId, 'dashboard');
 *   // ...
 * }
 * ```
 */
export const useNeuroTracking = (
  userId: string | undefined,
  screen: string,
  metadata?: Record<string, any>
) => {
  useEffect(() => {
    if (!userId || !globalConfig.enabled) return;

    const startTime = Date.now();
    const sessionId = getSessionId();

    if (globalConfig.debug) {
      console.log(`⚡ Screen entered: ${screen}`);
    }

    return () => {
      const duration = (Date.now() - startTime) / 1000;

      sendSynapse({
        userId,
        sessionId,
        action: 'screen_view',
        screen,
        duration,
        metadata: metadata || {}
      });

      if (globalConfig.debug) {
        console.log(`⚡ Screen exited: ${screen} (${duration.toFixed(1)}s)`);
      }
    };
  }, [userId, screen]);
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 2: MANUAL EVENT TRACKING (Universal)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Track custom events manually
 * 
 * Example (E-commerce):
 * ```tsx
 * const track = useNeuroAction(userId, 'checkout');
 * 
 * const handlePurchase = () => {
 *   // ... process payment
 *   track('payment_success', { amount: 99.99, currency: 'USD' });
 * };
 * ```
 * 
 * Example (SaaS):
 * ```tsx
 * const track = useNeuroAction(userId, 'editor');
 * 
 * const handleSave = () => {
 *   track('content_created', { type: 'document', wordCount: 1500 });
 * };
 * ```
 */
export const useNeuroAction = (
  userId: string | undefined,
  currentScreen: string
) => {
  const trackAction = useCallback((
    action: string,
    metadata?: Record<string, any>,
    component?: string
  ) => {
    if (!userId || !globalConfig.enabled) return;

    sendSynapse({
      userId,
      sessionId: getSessionId(),
      action,
      screen: currentScreen,
      component,
      duration: 0,
      metadata: metadata || {}
    });

    if (globalConfig.debug) {
      console.log(`⚡ Action: ${action}`, metadata);
    }
  }, [userId, currentScreen]);

  return trackAction;
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 3: A/B TESTING (Universal)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get A/B test variant for any feature
 * 
 * Example (E-commerce - Button Color):
 * ```tsx
 * const { variant, config, trackConversion } = useNeuroABTest(
 *   'checkout_button_color',
 *   userId
 * );
 * 
 * <button
 *   style={{ backgroundColor: config.color }}
 *   onClick={() => {
 *     handleCheckout();
 *     trackConversion(true);
 *   }}
 * >
 *   Buy Now
 * </button>
 * ```
 * 
 * Example (SaaS - Pricing Layout):
 * ```tsx
 * const { variant, config } = useNeuroABTest('pricing_layout', userId);
 * 
 * return variant === 'A' ? <GridLayout /> : <ListLayout />;
 * ```
 */
export const useNeuroABTest = (
  feature: string,
  userId: string | undefined
) => {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !globalConfig.enabled) {
      setLoading(false);
      return;
    }

    fetch(`${globalConfig.apiUrl}/variant/${feature}?userId=${userId}&appName=${globalConfig.appName}`)
      .then(res => res.json())
      .then(data => {
        setVariant(data.variant);
        setConfig(data.config);
        setLoading(false);

        if (globalConfig.debug) {
          console.log(`🧬 A/B Test: ${feature} → Variant ${data.variant}`);
        }
      })
      .catch(err => {
        console.error('Neuro-Core: A/B test fetch failed', err);
        setLoading(false);
      });
  }, [feature, userId]);

  const trackConversion = useCallback((success: boolean, revenue?: number) => {
    if (!globalConfig.enabled) return;

    fetch(`${globalConfig.apiUrl}/ab-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature,
        variant,
        success,
        revenue,
        appName: globalConfig.appName
      })
    }).catch(err => console.error('Neuro-Core: Conversion tracking failed', err));
  }, [feature, variant]);

  return { variant, config, loading, trackConversion };
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 4: REAL-TIME ANALYTICS (Universal Admin Dashboard)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get real-time analytics (for admin dashboards)
 * 
 * Example (Admin Dashboard):
 * ```tsx
 * function AnalyticsDashboard() {
 *   const { analytics, loading } = useNeuroAnalytics(10000);
 * 
 *   return (
 *     <div>
 *       <h2>Overall Happiness: {analytics.overallHappiness}</h2>
 *       <h3>Top Screens:</h3>
 *       {analytics.topScreens?.map(screen => (
 *         <div key={screen.screen}>
 *           {screen.screen}: {screen.avgHappiness} happiness
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNeuroAnalytics = (
  refreshInterval: number = 10000,
  filters?: { startDate?: Date; endDate?: Date }
) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!globalConfig.enabled) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = () => {
      const params = new URLSearchParams({
        appName: globalConfig.appName
      });

      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      fetch(`${globalConfig.apiUrl}/analytics?${params}`)
        .then(res => res.json())
        .then(data => {
          setAnalytics(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Neuro-Core: Analytics fetch failed', err);
          setLoading(false);
        });
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, filters]);

  return { analytics, loading };
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 5: RAGE DETECTION (Universal)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Detect rage behaviors (rapid clicks, rage quits)
 * 
 * Example (Any App):
 * ```tsx
 * function FrustatingForm() {
 *   const { trackClick, rageDetected } = useRageDetection(userId, 'signup_form');
 * 
 *   return (
 *     <div onClick={trackClick}>
 *       {rageDetected && <Alert>Having trouble? Let us help!</Alert>}
 *       // ... form content
 *     </div>
 *   );
 * }
 * ```
 */
export const useRageDetection = (
  userId: string | undefined,
  screen: string,
  threshold: number = 5
) => {
  const [clickCount, setClickCount] = useState(0);
  const [rageDetected, setRageDetected] = useState(false);
  const lastClickTime = useRef<number>(0);

  const trackClick = useCallback(() => {
    if (!userId || !globalConfig.enabled) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Rapid click: < 500ms between clicks
    if (timeSinceLastClick < 500) {
      const newCount = clickCount + 1;
      setClickCount(newCount);

      if (newCount >= threshold && !rageDetected) {
        setRageDetected(true);

        sendSynapse({
          userId,
          sessionId: getSessionId(),
          action: 'rage_click',
          screen,
          duration: 0,
          metadata: { clickCount: newCount }
        });

        if (globalConfig.debug) {
          console.log(`😤 Rage detected: ${newCount} rapid clicks`);
        }
      }
    } else {
      setClickCount(0);
    }

    lastClickTime.current = now;
  }, [userId, screen, clickCount, threshold, rageDetected]);

  return { trackClick, rageDetected, clickCount };
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 6: FORM ANALYTICS (Universal)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Track form interactions and abandonment
 * 
 * Example (Signup Form):
 * ```tsx
 * function SignupForm() {
 *   const { trackFieldFocus, trackFieldBlur, trackSubmit, trackError } = useFormAnalytics(
 *     userId,
 *     'signup_form'
 *   );
 * 
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); trackSubmit(true); }}>
 *       <input
 *         name="email"
 *         onFocus={() => trackFieldFocus('email')}
 *         onBlur={() => trackFieldBlur('email')}
 *       />
 *     </form>
 *   );
 * }
 * ```
 */
export const useFormAnalytics = (
  userId: string | undefined,
  formName: string
) => {
  const fieldStartTimes = useRef<Record<string, number>>({});

  const trackFieldFocus = useCallback((fieldName: string) => {
    fieldStartTimes.current[fieldName] = Date.now();
  }, []);

  const trackFieldBlur = useCallback((fieldName: string) => {
    if (!userId || !globalConfig.enabled) return;

    const startTime = fieldStartTimes.current[fieldName];
    if (!startTime) return;

    const duration = (Date.now() - startTime) / 1000;

    sendSynapse({
      userId,
      sessionId: getSessionId(),
      action: 'form_interaction',
      screen: formName,
      component: fieldName,
      duration,
      metadata: { fieldName }
    });
  }, [userId, formName]);

  const trackSubmit = useCallback((success: boolean) => {
    if (!userId || !globalConfig.enabled) return;

    sendSynapse({
      userId,
      sessionId: getSessionId(),
      action: success ? 'form_submit' : 'form_error',
      screen: formName,
      duration: 0,
      metadata: { success }
    });
  }, [userId, formName]);

  const trackError = useCallback((fieldName: string, errorMessage: string) => {
    if (!userId || !globalConfig.enabled) return;

    sendSynapse({
      userId,
      sessionId: getSessionId(),
      action: 'form_error',
      screen: formName,
      component: fieldName,
      duration: 0,
      metadata: { fieldName, errorMessage }
    });
  }, [userId, formName]);

  return { trackFieldFocus, trackFieldBlur, trackSubmit, trackError };
};

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get or create session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('neuro_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('neuro_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Send synapse to server
 */
async function sendSynapse(data: any) {
  if (!globalConfig.enabled) return;

  try {
    await fetch(`${globalConfig.apiUrl}/synapse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        appName: globalConfig.appName,
        appVersion: globalConfig.appVersion
      })
    });
  } catch (err) {
    if (globalConfig.debug) {
      console.error('Neuro-Core: Failed to send synapse', err);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS (Direct API calls)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Track any event (without hooks)
 * 
 * Example:
 * ```tsx
 * trackEvent(userId, 'purchase_completed', 'checkout', { amount: 99.99 });
 * ```
 */
export function trackEvent(
  userId: string,
  action: string,
  screen: string,
  metadata?: Record<string, any>
) {
  sendSynapse({
    userId,
    sessionId: getSessionId(),
    action,
    screen,
    duration: 0,
    metadata: metadata || {}
  });
}

/**
 * Track error
 */
export function trackError(
  userId: string,
  screen: string,
  errorMessage: string,
  errorStack?: string
) {
  sendSynapse({
    userId,
    sessionId: getSessionId(),
    action: 'error',
    screen,
    duration: 0,
    metadata: { errorMessage, errorStack }
  });
}

/**
 * Track page load performance
 */
export function trackPerformance(
  userId: string,
  screen: string
) {
  if (typeof window === 'undefined') return;

  const perfData = window.performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;

  sendSynapse({
    userId,
    sessionId: getSessionId(),
    action: 'page_load',
    screen,
    duration: loadTime / 1000,
    metadata: {
      loadTime,
      domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      firstPaint: perfData.responseStart - perfData.navigationStart
    }
  });
}

/**
 * Create A/B test (Admin function)
 */
export async function createABTest(
  feature: string,
  variantA: Record<string, any>,
  variantB: Record<string, any>
): Promise<void> {
  await fetch(`${globalConfig.apiUrl}/ab-test/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: globalConfig.appName,
      feature,
      variantA,
      variantB
    })
  });
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK 7: HEATMAP CLICK TRACKING (Full server)
// ═══════════════════════════════════════════════════════════════════════

export function useNeuroHeatmap(screen: string) {
  return useCallback((e: { clientX: number; clientY: number }) => {
    if (!globalConfig.enabled) return;
    const base = globalConfig.apiUrl?.replace(/\/api\/?$/, '') || 'http://localhost:3001';
    fetch(`${base}/api/heatmap/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x: e.clientX,
        y: e.clientY,
        screen,
        sessionId: getSessionId(),
        appName: globalConfig.appName
      })
    }).catch(() => {});
  }, [screen]);
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK 8: SESSION REPLAY (Full server)
// ═══════════════════════════════════════════════════════════════════════

export function useNeuroReplay() {
  const sessionId = getSessionId();
  return useCallback((type: string, data: any) => {
    if (!globalConfig.enabled) return;
    const base = globalConfig.apiUrl?.replace(/\/api\/?$/, '') || 'http://localhost:3001';
    fetch(`${base}/api/replay/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type, data, appName: globalConfig.appName })
    }).catch(() => {});
  }, []);
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export default {
  initNeuroCore,
  useNeuroTracking,
  useNeuroAction,
  useNeuroABTest,
  useNeuroAnalytics,
  useRageDetection,
  useFormAnalytics,
  useNeuroHeatmap,
  useNeuroReplay,
  trackEvent,
  trackError,
  trackPerformance,
  createABTest
};
