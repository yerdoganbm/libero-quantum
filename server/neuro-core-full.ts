/**
 * LIBERO NEURO-CORE - FULL STACK (All Features)
 *
 * Includes: Analytics, A/B, Self-Evolution, Heatmaps, Session Replay,
 * Funnel, Churn Prediction, Anomaly Detection, Integrations, GDPR.
 *
 * Her UI uygulamasında kendini otomatik geliştirir.
 */

import express from 'express';
import cors from 'cors';
import { SelfEvolutionEngine } from './self-evolution-engine';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface Synapse {
  userId: string;
  sessionId: string;
  action: string;
  screen: string;
  component?: string;
  duration: number;
  timestamp: Date;
  metadata: Record<string, any>;
  dopamineScore: number;
  appName: string;
  appVersion?: string;
}

interface ClickEvent {
  x: number;
  y: number;
  screen: string;
  sessionId: string;
  timestamp: Date;
  appName: string;
}

interface SessionEvent {
  sessionId: string;
  type: string;
  data: any;
  timestamp: Date;
  appName: string;
}

interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════

const synapses: Synapse[] = [];
const clickEvents: ClickEvent[] = [];
const sessionReplay: SessionEvent[] = [];
const abTests: Map<string, any> = new Map();
const webhooks: WebhookConfig[] = [];

const evolutionEngine = new SelfEvolutionEngine({
  minSamplesForSuggestion: 30,
  dopamineThresholdLow: 0.45,
  rageClickThreshold: 4,
  autoApplySafePatches: true
});

// Dopamine calculator (same as universal)
function calcDopamine(s: Partial<Synapse>): number {
  const action = s.action || '';
  const duration = s.duration || 0;
  if (action.includes('purchase') || action.includes('payment_success')) return 0.95;
  if (action.includes('created') || action.includes('published')) return 0.9;
  if (action.includes('shared') || action.includes('invited')) return 0.8;
  if (action === 'screen_view') {
    if (duration > 120) return 0.7;
    if (duration > 30) return 0.6;
    if (duration > 10) return 0.5;
    return 0.3;
  }
  if (action.includes('error') || action.includes('failed')) return 0.15;
  if (action.includes('rage_')) return 0.2;
  return 0.5;
}

// Notify webhooks
async function notifyWebhooks(event: string, payload: any) {
  for (const wh of webhooks) {
    if (wh.events.includes(event) || wh.events.includes('*')) {
      try {
        await fetch(wh.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Neuro-Event': event },
          body: JSON.stringify(payload)
        });
      } catch (_) {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPRESS APP
// ═══════════════════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// ─── Synapse (event tracking) ─────────────────────────────────────────
app.post('/api/synapse', (req, res) => {
  const s: Synapse = {
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
  s.dopamineScore = calcDopamine(s);
  synapses.push(s);
  notifyWebhooks('synapse', s);
  res.json({ status: 'captured', dopamine: s.dopamineScore });
});

// ─── A/B variant ───────────────────────────────────────────────────────
app.get('/api/variant/:feature', (req, res) => {
  const feature = req.params.feature;
  const userId = req.query.userId as string;
  const appName = (req.query.appName as string) || 'unknown';
  const key = `${appName}:${feature}`;
  let test = abTests.get(key);
  if (!test) {
    test = { variantA: { config: {}, users: 0, conversions: 0 }, variantB: { config: {}, users: 0, conversions: 0 } };
    abTests.set(key, test);
  }
  const variant = parseInt(userId || '0', 36) % 2 === 0 ? 'A' : 'B';
  if (variant === 'A') test.variantA.users++; else test.variantB.users++;
  res.json({ variant, config: variant === 'A' ? test.variantA.config : test.variantB.config, appName });
});

app.post('/api/ab-result', (req, res) => {
  const { feature, variant, success, appName = 'unknown', revenue } = req.body;
  const key = `${appName}:${feature}`;
  const test = abTests.get(key);
  if (!test) return res.status(404).json({ error: 'test_not_found' });
  if (success) {
    if (variant === 'A') { test.variantA.conversions++; if (revenue) test.variantA.revenue = (test.variantA.revenue || 0) + revenue; }
    else { test.variantB.conversions++; if (revenue) test.variantB.revenue = (test.variantB.revenue || 0) + revenue; }
  }
  res.json({ status: 'recorded' });
});

// ─── Heatmap: record click ─────────────────────────────────────────────
app.post('/api/heatmap/click', (req, res) => {
  const { x, y, screen, sessionId, appName } = req.body;
  clickEvents.push({
    x: Number(x) || 0,
    y: Number(y) || 0,
    screen: screen || 'unknown',
    sessionId: sessionId || 'unknown',
    timestamp: new Date(),
    appName: appName || 'unknown'
  });
  res.json({ status: 'ok' });
});

app.get('/api/heatmap/:screen', (req, res) => {
  const screen = req.params.screen;
  const appName = req.query.appName as string;
  const days = parseInt(req.query.days as string) || 7;
  const since = new Date(); since.setDate(since.getDate() - days);
  let clicks = clickEvents.filter(c => c.screen === screen && c.timestamp >= since);
  if (appName) clicks = clicks.filter(c => c.appName === appName);
  // Bucket by 20px grid
  const grid: Record<string, number> = {};
  for (const c of clicks) {
    const key = `${Math.floor(c.x / 20)}_${Math.floor(c.y / 20)}`;
    grid[key] = (grid[key] || 0) + 1;
  }
  res.json({ screen, clicks: grid, totalClicks: clicks.length });
});

// ─── Session Replay: record event ──────────────────────────────────────
app.post('/api/replay/event', (req, res) => {
  const { sessionId, type, data, appName } = req.body;
  sessionReplay.push({
    sessionId: sessionId || 'unknown',
    type: type || 'custom',
    data: data || {},
    timestamp: new Date(),
    appName: appName || 'unknown'
  });
  res.json({ status: 'ok' });
});

app.get('/api/replay/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const events = sessionReplay.filter(e => e.sessionId === sessionId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  res.json({ sessionId, events });
});

// ─── Funnel ───────────────────────────────────────────────────────────
app.get('/api/funnel', (req, res) => {
  const steps = (req.query.steps as string)?.split(',') || ['screen_view', 'button_click', 'form_submit', 'payment_success'];
  const appName = req.query.appName as string;
  const days = parseInt(req.query.days as string) || 7;
  const since = new Date(); since.setDate(since.getDate() - days);
  let data = synapses.filter(s => s.timestamp >= since);
  if (appName) data = data.filter(s => s.appName === appName);
  const usersByStep: Record<string, Set<string>> = {};
  for (const step of steps) usersByStep[step] = new Set();
  for (const s of data) {
    if (steps.includes(s.action)) usersByStep[s.action].add(s.userId);
  }
  const funnel = steps.map((step, i) => {
    const count = usersByStep[step].size;
    const prev = i === 0 ? count : usersByStep[steps[i - 1]].size;
    const conversion = prev > 0 ? (count / prev * 100).toFixed(1) : '0';
    return { step, users: count, conversion: conversion + '%' };
  });
  res.json({ steps, funnel });
});

// ─── Self-Evolution: analyze & get patches ─────────────────────────────
app.post('/api/evolution/analyze', (req, res) => {
  const appName = req.body.appName || 'unknown';
  const suggestions = evolutionEngine.analyze(synapses as any, appName);
  notifyWebhooks('evolution_suggestions', { appName, suggestions });
  res.json({ appName, suggestions });
});

app.get('/api/evolution/patches', (req, res) => {
  const appName = req.query.appName as string;
  const patches = evolutionEngine.getActivePatches(appName || 'unknown');
  res.json({ appName: appName || 'unknown', patches });
});

app.get('/api/evolution/improvements', (req, res) => {
  const appName = req.query.appName as string;
  const list = evolutionEngine.getImprovements(appName || undefined);
  res.json({ improvements: list });
});

app.post('/api/evolution/apply', (req, res) => {
  const { improvementId } = req.body;
  evolutionEngine.markApplied(improvementId);
  res.json({ status: 'applied' });
});

app.post('/api/evolution/approve', (req, res) => {
  evolutionEngine.approve(req.body.improvementId);
  res.json({ status: 'approved' });
});

app.post('/api/evolution/reject', (req, res) => {
  evolutionEngine.reject(req.body.improvementId);
  res.json({ status: 'rejected' });
});

// ─── Churn prediction (simplified: rule-based) ─────────────────────────
app.get('/api/predictions/churn', (req, res) => {
  const userId = req.query.userId as string;
  const appName = req.query.appName as string;
  const userSynapses = synapses.filter(s => s.userId === userId && (appName ? s.appName === appName : true));
  const lastActivity = userSynapses.length ? new Date(Math.max(...userSynapses.map(s => s.timestamp.getTime()))) : null;
  const daysSinceActive = lastActivity ? (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24) : 999;
  const avgDopamine = userSynapses.length ? userSynapses.reduce((a, s) => a + s.dopamineScore, 0) / userSynapses.length : 0;
  let churnProbability = 0;
  if (daysSinceActive > 14) churnProbability = 0.9;
  else if (daysSinceActive > 7) churnProbability = 0.6;
  else if (avgDopamine < 0.4) churnProbability = 0.5;
  else if (userSynapses.length < 5) churnProbability = 0.3;
  res.json({
    userId,
    churnProbability: Math.round(churnProbability * 100) / 100,
    daysSinceActive: Math.round(daysSinceActive),
    avgDopamine: Math.round(avgDopamine * 100) / 100,
    recommendation: churnProbability > 0.5 ? 'Send re-engagement campaign' : 'Monitor'
  });
});

// ─── Anomaly detection (simple: compare to rolling avg) ─────────────────
app.get('/api/anomaly/detect', (req, res) => {
  const appName = req.query.appName as string;
  const metric = req.query.metric as string || 'dopamine';
  const hours = parseInt(req.query.hours as string) || 24;
  const since = new Date(); since.setHours(since.getHours() - hours);
  let data = synapses.filter(s => s.timestamp >= since);
  if (appName) data = data.filter(s => s.appName === appName);
  const recent = data.filter(s => s.timestamp >= new Date(Date.now() - 3600000));
  const older = data.filter(s => s.timestamp < new Date(Date.now() - 3600000));
  const recentAvg = recent.length ? recent.reduce((a, s) => a + s.dopamineScore, 0) / recent.length : 0.5;
  const olderAvg = older.length ? older.reduce((a, s) => a + s.dopamineScore, 0) / older.length : 0.5;
  const drop = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const isAnomaly = Math.abs(drop) > 25;
  res.json({
    metric,
    isAnomaly,
    current: recentAvg,
    baseline: olderAvg,
    changePercent: Math.round(drop * 10) / 10,
    message: isAnomaly ? (drop < 0 ? 'Significant drop detected' : 'Significant spike detected') : 'Normal'
  });
});

// ─── Recommendations (simple: popular screens + low friction) ───────────
app.get('/api/recommendations', (req, res) => {
  const userId = req.query.userId as string;
  const appName = req.query.appName as string;
  let data = synapses.filter(s => appName ? s.appName === appName : true);
  const screenHappiness: Record<string, number[]> = {};
  for (const s of data) {
    if (!screenHappiness[s.screen]) screenHappiness[s.screen] = [];
    screenHappiness[s.screen].push(s.dopamineScore);
  }
  const top = Object.entries(screenHappiness)
    .map(([screen, scores]) => ({ screen, avg: scores.reduce((a, b) => a + b, 0) / scores.length, visits: scores.length }))
    .filter(x => x.visits >= 10)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);
  res.json({ userId, appName: appName || 'unknown', recommendations: top.map(t => ({ type: 'feature', feature: t.screen, reason: `High happiness (${t.avg.toFixed(2)})`, confidence: t.avg })) });
});

// ─── Integrations: Webhooks ─────────────────────────────────────────────
app.post('/api/webhooks', (req, res) => {
  const { url, events, secret } = req.body;
  webhooks.push({ url, events: events || ['*'], secret });
  res.json({ status: 'registered' });
});

// ─── GDPR: Export & Delete ─────────────────────────────────────────────
app.get('/api/gdpr/export', (req, res) => {
  const userId = req.query.userId as string;
  const userSynapses = synapses.filter(s => s.userId === userId);
  const userClicks = clickEvents.filter(c => c.sessionId.includes(userId));
  const userReplay = sessionReplay.filter(e => e.sessionId.includes(userId));
  res.json({ userId, synapses: userSynapses, clicks: userClicks, replay: userReplay, exportedAt: new Date() });
});

app.delete('/api/gdpr/delete', (req, res) => {
  const userId = req.query.userId as string;
  let sCount = 0, cCount = 0, rCount = 0;
  for (let i = synapses.length - 1; i >= 0; i--) {
    if (synapses[i].userId === userId) { synapses.splice(i, 1); sCount++; }
  }
  for (let i = clickEvents.length - 1; i >= 0; i--) {
    if (clickEvents[i].sessionId.includes(userId)) { clickEvents.splice(i, 1); cCount++; }
  }
  for (let i = sessionReplay.length - 1; i >= 0; i--) {
    if (sessionReplay[i].sessionId.includes(userId)) { sessionReplay.splice(i, 1); rCount++; }
  }
  res.json({ status: 'deleted', synapsesDeleted: sCount, clicksDeleted: cCount, replayDeleted: rCount });
});

// ─── Analytics (existing) ──────────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
  const appName = req.query.appName as string;
  const days = parseInt(req.query.days as string) || 30;
  const since = new Date(); since.setDate(since.getDate() - days);
  let data = synapses.filter(s => s.timestamp >= since);
  if (appName) data = data.filter(s => s.appName === appName);
  const byScreen: Record<string, { visits: number; totalDopamine: number; totalDuration: number }> = {};
  for (const s of data) {
    if (!byScreen[s.screen]) byScreen[s.screen] = { visits: 0, totalDopamine: 0, totalDuration: 0 };
    byScreen[s.screen].visits++;
    byScreen[s.screen].totalDopamine += s.dopamineScore;
    byScreen[s.screen].totalDuration += s.duration;
  }
  const topScreens = Object.entries(byScreen)
    .map(([screen, agg]) => ({ screen, visits: agg.visits, avgHappiness: (agg.totalDopamine / agg.visits).toFixed(2), avgDuration: Math.round(agg.totalDuration / agg.visits) }))
    .sort((a, b) => parseFloat(b.avgHappiness) - parseFloat(a.avgHappiness));
  const abResults: any[] = [];
  abTests.forEach((test, key) => {
    if (appName && !key.startsWith(appName + ':')) return;
    const [_, feature] = key.split(':');
    const aRate = test.variantA.users > 0 ? test.variantA.conversions / test.variantA.users : 0;
    const bRate = test.variantB.users > 0 ? test.variantB.conversions / test.variantB.users : 0;
    abResults.push({ feature, variantA: { ...test.variantA, conversionRate: (aRate * 100).toFixed(1) + '%' }, variantB: { ...test.variantB, conversionRate: (bRate * 100).toFixed(1) + '%' }, winner: aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'TIE' });
  });
  const overallHappiness = data.length ? (data.reduce((a, s) => a + s.dopamineScore, 0) / data.length).toFixed(2) : '0.00';
  res.json({ appName: appName || 'all', totalSynapses: data.length, uniqueUsers: new Set(data.map(s => s.userId)).size, topScreens, abTests: abResults, overallHappiness });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', engine: 'neuro-core-full', version: '2.0.0', synapses: synapses.length, timestamp: new Date() });
});

// ═══════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🧠 LIBERO NEURO-CORE FULL - ALL FEATURES');
  console.log('   Self-Evolution: ON (her uygulamada otomatik iyileşme)');
  console.log('   Heatmaps, Replay, Funnel, Churn, Anomaly, GDPR, Webhooks');
  console.log('   http://localhost:' + PORT + '\n');
});

export default app;
