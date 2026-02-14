/**
 * @libero/neuro-core
 * 
 * Universal Analytics & Self-Evolution Engine for ANY React/Vue/Angular App
 * 
 * NOT Sahada-specific! Works with:
 * - E-commerce (Shopify-like)
 * - SaaS dashboards (Notion-like)
 * - Social media (Twitter-like)
 * - Fintech (Banking apps)
 * - Healthcare (Patient portals)
 * - Education (LMS platforms)
 * 
 * Version: 1.0.0 (Generic/Universal)
 */

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

// ═══════════════════════════════════════════════════════════════════════
// TYPES - GENERIC FOR ALL APPS
// ═══════════════════════════════════════════════════════════════════════

interface Synapse {
  userId: string;
  sessionId: string;
  action: string;           // Generic: 'screen_view' | 'button_click' | 'form_submit' | custom
  screen: string;           // Generic: 'dashboard' | 'settings' | any screen name
  component?: string;       // Optional: 'LoginForm' | 'CheckoutButton' | etc.
  duration: number;         // Seconds spent
  timestamp: Date;
  metadata: Record<string, any>;  // Any custom data
  dopamineScore: number;    // 0.0 - 1.0 (Happiness)
  appName: string;          // Multi-tenant: 'sahada' | 'myshop' | 'myblog'
  appVersion?: string;      // Optional: Track which version
}

interface ABTest {
  feature: string;          // Generic: 'checkout_button_color' | 'pricing_layout'
  variantA: ABVariant;
  variantB: ABVariant;
  status: 'active' | 'paused' | 'completed';
  winner?: 'A' | 'B' | 'TIE';
  confidenceLevel?: number; // Statistical significance (%)
}

interface ABVariant {
  config: Record<string, any>;  // Flexible: { color: 'blue' } | { layout: 'grid' }
  users: number;
  conversions: number;          // Success events
  revenue?: number;             // Optional: Track revenue impact
}

interface AnalyticsQuery {
  appName?: string;         // Filter by app
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  screen?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSAL DOPAMINE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate dopamine (happiness) score based on action type
 * 
 * This is GENERIC - works for any app type:
 * - E-commerce: 'purchase_completed' → 0.95
 * - SaaS: 'feature_used' → 0.8
 * - Social: 'post_liked' → 0.7
 * - etc.
 */
function calculateDopamine(synapse: Partial<Synapse>): number {
  const { action, duration = 0, metadata = {} } = synapse;

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH DOPAMINE (0.9 - 1.0) - SUCCESS EVENTS
  // ═══════════════════════════════════════════════════════════════════════
  
  // Revenue-generating events (highest!)
  if (action?.includes('purchase') || action?.includes('payment_success')) {
    return 0.95;
  }
  
  // Goal completion
  if (action?.includes('signup_completed') || action?.includes('onboarding_finished')) {
    return 0.92;
  }
  
  // Core feature usage
  if (action?.includes('created') || action?.includes('published')) {
    return 0.90;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MEDIUM-HIGH DOPAMINE (0.7 - 0.89) - POSITIVE ENGAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  // Social interactions
  if (action?.includes('shared') || action?.includes('invited') || action?.includes('liked')) {
    return 0.80;
  }
  
  // Feature discovery
  if (action?.includes('feature_explored') || action?.includes('tutorial_completed')) {
    return 0.75;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MEDIUM DOPAMINE (0.5 - 0.69) - NORMAL USAGE
  // ═══════════════════════════════════════════════════════════════════════
  
  // Screen views (depends on duration)
  if (action === 'screen_view') {
    if (duration > 120) return 0.70;  // 2+ minutes = engaged
    if (duration > 60) return 0.65;   // 1+ minute = interested
    if (duration > 30) return 0.60;   // 30+ seconds = normal
    if (duration > 10) return 0.50;   // 10+ seconds = browsing
    return 0.30;                       // <10 seconds = bouncing
  }
  
  // Button clicks, form interactions
  if (action === 'button_click' || action === 'form_interaction') {
    return 0.55;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOW DOPAMINE (0.2 - 0.49) - FRICTION SIGNALS
  // ═══════════════════════════════════════════════════════════════════════
  
  // Rage behaviors
  if (action?.includes('rage_') || metadata.rapidClicks > 5) {
    return 0.20;
  }
  
  // Errors & failures
  if (action?.includes('error') || action?.includes('failed')) {
    return 0.15;
  }
  
  // Abandonment
  if (action?.includes('abandoned') || action?.includes('cancelled')) {
    return 0.25;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CRITICAL DOPAMINE (0.0 - 0.19) - SEVERE ISSUES
  // ═══════════════════════════════════════════════════════════════════════
  
  // Crashes, white screens
  if (action?.includes('crash') || action?.includes('wsod')) {
    return 0.05;
  }
  
  // Default: Neutral
  return 0.50;
}

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSAL EVENT TYPES (Autocapture)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Standard event types that ANY app can use
 * No Sahada-specific events!
 */
const UNIVERSAL_EVENTS = {
  // Navigation
  SCREEN_VIEW: 'screen_view',
  PAGE_LOAD: 'page_load',
  NAVIGATION: 'navigation',
  
  // User interactions
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_INTERACTION: 'form_interaction',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  
  // Content
  CONTENT_VIEW: 'content_view',
  CONTENT_CREATED: 'content_created',
  CONTENT_EDITED: 'content_edited',
  CONTENT_DELETED: 'content_deleted',
  CONTENT_SHARED: 'content_shared',
  
  // E-commerce
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  
  // Social
  LIKE: 'like',
  COMMENT: 'comment',
  SHARE: 'share',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  
  // Auth
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  
  // Errors
  ERROR: 'error',
  CRASH: 'crash',
  NETWORK_ERROR: 'network_error',
  RAGE_CLICK: 'rage_click',
  RAGE_QUIT: 'rage_quit',
  
  // Custom (user-defined)
  CUSTOM: 'custom'
} as const;

// ═══════════════════════════════════════════════════════════════════════
// EXPRESS SERVER - UNIVERSAL API
// ═══════════════════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (Production: MongoDB)
const synapses: Synapse[] = [];
const abTests: Map<string, ABTest> = new Map();
const activeSessions: Map<string, { startTime: Date; userId: string; appName: string }> = new Map();

// ═══════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/synapse - Record user action (UNIVERSAL)
 */
app.post('/api/synapse', (req, res) => {
  const synapse: Synapse = {
    userId: req.body.userId,
    sessionId: req.body.sessionId || req.body.userId,
    action: req.body.action,
    screen: req.body.screen,
    component: req.body.component,
    duration: req.body.duration || 0,
    timestamp: new Date(),
    metadata: req.body.metadata || {},
    dopamineScore: 0,
    appName: req.body.appName || 'unknown',
    appVersion: req.body.appVersion
  };

  // Calculate dopamine
  synapse.dopamineScore = calculateDopamine(synapse);

  // Store
  synapses.push(synapse);

  // Log
  const emoji = synapse.dopamineScore > 0.8 ? '🔥' : synapse.dopamineScore > 0.5 ? '✅' : synapse.dopamineScore > 0.3 ? '⚠️' : '❌';
  console.log(`${emoji} [${synapse.appName}] ${synapse.userId} → ${synapse.action} (dopamine: ${synapse.dopamineScore.toFixed(2)})`);

  res.json({
    status: 'captured',
    dopamine: synapse.dopamineScore,
    totalSynapses: synapses.filter(s => s.appName === synapse.appName).length
  });
});

/**
 * GET /api/variant/:feature - Get A/B test variant (UNIVERSAL)
 */
app.get('/api/variant/:feature', (req, res) => {
  const feature = req.params.feature;
  const userId = req.query.userId as string;
  const appName = req.query.appName as string || 'unknown';

  const testKey = `${appName}:${feature}`;
  let test = abTests.get(testKey);

  // Auto-create test if not exists
  if (!test) {
    test = {
      feature,
      variantA: { config: {}, users: 0, conversions: 0 },
      variantB: { config: {}, users: 0, conversions: 0 },
      status: 'active'
    };
    abTests.set(testKey, test);
  }

  // Deterministic variant assignment (same user = same variant)
  const variant = parseInt(userId, 36) % 2 === 0 ? 'A' : 'B';

  // Track assignment
  if (variant === 'A') test.variantA.users++;
  else test.variantB.users++;

  res.json({
    variant,
    config: variant === 'A' ? test.variantA.config : test.variantB.config,
    feature,
    appName
  });
});

/**
 * POST /api/ab-result - Track A/B test conversion (UNIVERSAL)
 */
app.post('/api/ab-result', (req, res) => {
  const { feature, variant, success, appName = 'unknown', revenue } = req.body;

  const testKey = `${appName}:${feature}`;
  const test = abTests.get(testKey);

  if (!test) {
    return res.status(404).json({ error: 'test_not_found' });
  }

  if (success) {
    if (variant === 'A') {
      test.variantA.conversions++;
      if (revenue) test.variantA.revenue = (test.variantA.revenue || 0) + revenue;
    } else {
      test.variantB.conversions++;
      if (revenue) test.variantB.revenue = (test.variantB.revenue || 0) + revenue;
    }
  }

  // Calculate winner (if enough data)
  const aConvRate = test.variantA.users > 0 ? test.variantA.conversions / test.variantA.users : 0;
  const bConvRate = test.variantB.users > 0 ? test.variantB.conversions / test.variantB.users : 0;

  if (test.variantA.users >= 30 && test.variantB.users >= 30) {
    const diff = Math.abs(aConvRate - bConvRate);
    test.confidenceLevel = Math.min(95, diff * 100);  // Simple approximation

    if (diff > 0.1) {  // 10% difference
      test.winner = aConvRate > bConvRate ? 'A' : 'B';
    } else {
      test.winner = 'TIE';
    }
  }

  res.json({ status: 'recorded', winner: test.winner, confidence: test.confidenceLevel });
});

/**
 * GET /api/analytics - Get analytics (UNIVERSAL, multi-tenant)
 */
app.get('/api/analytics', (req, res) => {
  const appName = req.query.appName as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  // Filter synapses
  let filtered = synapses;
  if (appName) filtered = filtered.filter(s => s.appName === appName);
  if (startDate) filtered = filtered.filter(s => s.timestamp >= startDate);
  if (endDate) filtered = filtered.filter(s => s.timestamp <= endDate);

  // Top screens by dopamine
  const screenStats = filtered.reduce((acc: any, s) => {
    if (!acc[s.screen]) acc[s.screen] = { visits: 0, totalDopamine: 0, totalDuration: 0 };
    acc[s.screen].visits++;
    acc[s.screen].totalDopamine += s.dopamineScore;
    acc[s.screen].totalDuration += s.duration;
    return acc;
  }, {});

  const topScreens = Object.entries(screenStats)
    .map(([screen, stats]: [string, any]) => ({
      screen,
      visits: stats.visits,
      avgHappiness: (stats.totalDopamine / stats.visits).toFixed(2),
      avgDuration: Math.round(stats.totalDuration / stats.visits)
    }))
    .sort((a: any, b: any) => parseFloat(b.avgHappiness) - parseFloat(a.avgHappiness));

  // A/B test results
  const abResults: any[] = [];
  abTests.forEach((test, key) => {
    if (appName && !key.startsWith(appName + ':')) return;

    const aRate = test.variantA.users > 0 ? (test.variantA.conversions / test.variantA.users) : 0;
    const bRate = test.variantB.users > 0 ? (test.variantB.conversions / test.variantB.users) : 0;

    abResults.push({
      feature: test.feature,
      variantA: {
        ...test.variantA,
        conversionRate: (aRate * 100).toFixed(1) + '%'
      },
      variantB: {
        ...test.variantB,
        conversionRate: (bRate * 100).toFixed(1) + '%'
      },
      winner: test.winner || (aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'TIE'),
      confidence: test.confidenceLevel?.toFixed(1) + '%' || 'N/A'
    });
  });

  // Overall metrics
  const overallHappiness = filtered.length > 0
    ? (filtered.reduce((sum, s) => sum + s.dopamineScore, 0) / filtered.length).toFixed(2)
    : '0.00';

  const uniqueUsers = new Set(filtered.map(s => s.userId)).size;
  const uniqueSessions = new Set(filtered.map(s => s.sessionId)).size;

  res.json({
    appName: appName || 'all',
    totalSynapses: filtered.length,
    uniqueUsers,
    uniqueSessions,
    topScreens: topScreens.slice(0, 10),
    abTests: abResults,
    overallHappiness,
    dateRange: {
      start: startDate || filtered[0]?.timestamp,
      end: endDate || filtered[filtered.length - 1]?.timestamp
    }
  });
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'alive',
    engine: '@libero/neuro-core',
    version: '1.0.0',
    synapses: synapses.length,
    apps: [...new Set(synapses.map(s => s.appName))],
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

/**
 * POST /api/ab-test/create - Create A/B test (Admin)
 */
app.post('/api/ab-test/create', (req, res) => {
  const { appName, feature, variantA, variantB } = req.body;

  const testKey = `${appName}:${feature}`;

  if (abTests.has(testKey)) {
    return res.status(409).json({ error: 'test_already_exists' });
  }

  abTests.set(testKey, {
    feature,
    variantA: { config: variantA, users: 0, conversions: 0 },
    variantB: { config: variantB, users: 0, conversions: 0 },
    status: 'active'
  });

  console.log(`🧬 A/B Test created: [${appName}] ${feature}`);

  res.json({ status: 'created', testKey });
});

// ═══════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🧠 LIBERO NEURO-CORE - UNIVERSAL ENGINE`);
  console.log(`   Version: 1.0.0 (Generic for ANY app)`);
  console.log(`   Listening: http://localhost:${PORT}`);
  console.log(`   Status: ALIVE & TRACKING`);
  console.log(`   Multi-tenant: YES`);
  console.log(`   Autocapture: YES`);
  console.log(`\n   Supported Apps: E-commerce, SaaS, Social, Fintech, Healthcare, Education, etc.\n`);
});

export default app;
export { UNIVERSAL_EVENTS, calculateDopamine };
