/**
 * LIBERO NEURO-CORE - MINIMAL API SERVER
 *
 * Hafif API: Synapse, A/B variant, analytics, health.
 * Herhangi bir uygulama (Sahada dahil) bu API'yi kullanabilir.
 * Full özellikler için: neuro-core-full.ts
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const synapses: any[] = [];
const abTests: Map<string, any> = new Map();

function calcDopamine(synapse: any): number {
  if (synapse.action === 'payment_success' || synapse.action?.includes('purchase')) return 0.95;
  if (synapse.action === 'match_created' || synapse.action?.includes('created')) return 0.9;
  if (synapse.action === 'invite_sent' || synapse.action?.includes('shared')) return 0.8;
  if (synapse.action === 'error' || synapse.action?.includes('failed')) return 0.1;
  if (synapse.action === 'rage_quit' || (synapse.duration !== undefined && synapse.duration < 5)) return 0.2;
  if (synapse.duration > 30) return 0.65;
  return 0.5;
}

app.post('/api/synapse', (req, res) => {
  const synapse = {
    userId: req.body.userId,
    sessionId: req.body.sessionId || req.body.userId,
    action: req.body.action,
    screen: req.body.screen,
    duration: req.body.duration || 0,
    timestamp: new Date(),
    metadata: req.body.metadata || {},
    appName: req.body.appName || 'unknown'
  };
  (synapse as any).dopamineScore = calcDopamine(synapse);
  synapses.push(synapse);
  res.json({ status: 'captured', dopamine: (synapse as any).dopamineScore, totalSynapses: synapses.length });
});

app.get('/api/variant/:feature', (req, res) => {
  const feature = req.params.feature;
  const userId = (req.query.userId as string) || '';
  let test = abTests.get(feature);
  if (!test) {
    test = { variantA: { config: {}, users: 0, clicks: 0 }, variantB: { config: {}, users: 0, clicks: 0 } };
    abTests.set(feature, test);
  }
  const variant = parseInt(userId, 36) % 2 === 0 ? 'A' : 'B';
  if (variant === 'A') test.variantA.users++; else test.variantB.users++;
  res.json({ variant, config: variant === 'A' ? test.variantA.config : test.variantB.config });
});

app.post('/api/ab-result', (req, res) => {
  const { feature, variant, success } = req.body;
  const test = abTests.get(feature);
  if (!test) return res.json({ error: 'test_not_found' });
  if (variant === 'A') test.variantA.clicks += success ? 1 : 0;
  else test.variantB.clicks += success ? 1 : 0;
  res.json({ status: 'recorded' });
});

app.get('/api/analytics', (req, res) => {
  const appName = req.query.appName as string;
  let data = synapses;
  if (appName) data = data.filter((s: any) => s.appName === appName);
  const screenStats: Record<string, { visits: number; totalDopamine: number }> = {};
  data.forEach((s: any) => {
    if (!screenStats[s.screen]) screenStats[s.screen] = { visits: 0, totalDopamine: 0 };
    screenStats[s.screen].visits++;
    screenStats[s.screen].totalDopamine += s.dopamineScore;
  });
  const topScreens = Object.entries(screenStats)
    .map(([screen, st]) => ({ screen, visits: st.visits, avgHappiness: (st.totalDopamine / st.visits).toFixed(2) }))
    .sort((a, b) => parseFloat(b.avgHappiness) - parseFloat(a.avgHappiness));
  const abResults: any[] = [];
  abTests.forEach((test, feature) => {
    const aRate = test.variantA.users > 0 ? test.variantA.clicks / test.variantA.users : 0;
    const bRate = test.variantB.users > 0 ? test.variantB.clicks / test.variantB.users : 0;
    abResults.push({
      feature,
      variantA: { ...test.variantA, conversionRate: (aRate * 100).toFixed(1) + '%' },
      variantB: { ...test.variantB, conversionRate: (bRate * 100).toFixed(1) + '%' },
      winner: aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'TIE'
    });
  });
  const overall = data.length ? (data.reduce((a: number, s: any) => a + s.dopamineScore, 0) / data.length).toFixed(2) : '0.00';
  res.json({ totalSynapses: data.length, topScreens: topScreens.slice(0, 10), abTests: abResults, overallHappiness: overall });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', organism: 'neuro-core-server', synapses: synapses.length, timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🧠 NEURO-CORE (Minimal API) READY\n   http://localhost:' + PORT + '\n');
});

export default app;
