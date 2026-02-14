# 🚀 LIBERO NEURO-CORE - FEATURE ROADMAP v2.0 - v10.0

## Daha Neler Eklenebilir? (Comprehensive Feature List)

---

## 🎯 v2.0 - MULTI-FRAMEWORK SUPPORT (2-3 ay)

### 1. **Vue.js SDK** 🟢
```typescript
// @libero/neuro-core-vue
import { useNeuroTracking, useNeuroAction } from '@libero/neuro-core-vue';

export default {
  setup() {
    const userId = ref('user123');
    useNeuroTracking(userId, 'dashboard');
    
    const track = useNeuroAction(userId, 'dashboard');
    
    const handleClick = () => {
      track('button_clicked', { buttonId: 'submit' });
    };
    
    return { handleClick };
  }
};
```

**Neden önemli:**
- Vue.js market share: %15 (React: %40, Angular: %20)
- 2M+ developers kullanıyor

---

### 2. **Angular SDK** 🔴
```typescript
// @libero/neuro-core-angular
import { NeuroService } from '@libero/neuro-core-angular';

@Component({
  selector: 'app-dashboard',
  template: '<button (click)="handleClick()">Click</button>'
})
export class DashboardComponent {
  constructor(private neuro: NeuroService) {
    this.neuro.trackScreen('dashboard');
  }
  
  handleClick() {
    this.neuro.trackAction('button_clicked', { buttonId: 'submit' });
  }
}
```

**Neden önemli:**
- Enterprise companies kullanıyor (Google, Microsoft)
- Long-term contracts (High LTV)

---

### 3. **Svelte SDK** 🧡
```typescript
// @libero/neuro-core-svelte
import { neuroTracking, neuroAction } from '@libero/neuro-core-svelte';

let userId = 'user123';
neuroTracking(userId, 'dashboard');

const track = neuroAction(userId, 'dashboard');

function handleClick() {
  track('button_clicked', { buttonId: 'submit' });
}
```

**Neden önemli:**
- Fastest growing framework (2026)
- Developer satisfaction: %95 (En yüksek!)

---

### 4. **Vanilla JS SDK** (Framework-agnostic)
```typescript
// @libero/neuro-core-js
import NeuroCore from '@libero/neuro-core-js';

NeuroCore.init({ appName: 'myapp' });
NeuroCore.trackScreen(userId, 'dashboard');
NeuroCore.trackAction(userId, 'button_clicked', { buttonId: 'submit' });
```

**Neden önemli:**
- Legacy apps (jQuery, Vanilla JS)
- Micro-frontends (Framework mixing)

---

## 📱 v3.0 - MOBILE SDK'LAR (3-4 ay)

### 1. **React Native SDK** 📱
```typescript
// @libero/neuro-core-react-native
import { useNeuroTracking, useNeuroAction } from '@libero/neuro-core-react-native';

function HomeScreen({ userId }) {
  useNeuroTracking(userId, 'home');
  
  const track = useNeuroAction(userId, 'home');
  
  const handlePurchase = () => {
    track('payment_success', { amount: 99.99, platform: 'ios' });
  };
  
  return (
    <TouchableOpacity onPress={handlePurchase}>
      <Text>Buy Now</Text>
    </TouchableOpacity>
  );
}
```

**Yeni Özellikler:**
- Device info tracking (iOS/Android version, screen size)
- App lifecycle events (foreground/background)
- Crash reporting (native crashes)
- Network quality tracking (3G/4G/5G/WiFi)

---

### 2. **Flutter SDK** 🐦
```dart
// @libero/neuro_core_flutter
import 'package:neuro_core_flutter/neuro_core_flutter.dart';

class HomeScreen extends StatelessWidget {
  final String userId = 'user123';
  
  @override
  Widget build(BuildContext context) {
    NeuroCore.trackScreen(userId, 'home');
    
    return ElevatedButton(
      onPressed: () {
        NeuroCore.trackAction(userId, 'payment_success', {
          'amount': 99.99,
          'platform': 'android'
        });
      },
      child: Text('Buy Now'),
    );
  }
}
```

**Neden önemli:**
- Cross-platform (iOS + Android bir codebase)
- Google backing (Güçlü ecosystem)

---

### 3. **iOS Native SDK** (Swift)
```swift
// @libero/neuro-core-ios
import NeuroCore

class ViewController: UIViewController {
    let userId = "user123"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        NeuroCore.trackScreen(userId: userId, screen: "home")
    }
    
    @IBAction func handlePurchase() {
        NeuroCore.trackAction(
            userId: userId,
            action: "payment_success",
            metadata: ["amount": 99.99, "platform": "ios"]
        )
    }
}
```

---

### 4. **Android Native SDK** (Kotlin)
```kotlin
// @libero/neuro-core-android
import com.libero.neurocore.NeuroCore

class MainActivity : AppCompatActivity() {
    private val userId = "user123"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NeuroCore.trackScreen(userId, "home")
    }
    
    fun handlePurchase() {
        NeuroCore.trackAction(
            userId,
            "payment_success",
            mapOf("amount" to 99.99, "platform" to "android")
        )
    }
}
```

---

## 🖥️ v4.0 - BACKEND SDK'LAR (4-5 ay)

### 1. **Python SDK** 🐍
```python
# @libero/neuro-core-python
from neuro_core import NeuroCore

neuro = NeuroCore(app_name='myapi', api_url='http://localhost:3001')

@app.route('/api/purchase', methods=['POST'])
def purchase():
    user_id = request.json['user_id']
    amount = request.json['amount']
    
    # Track server-side event
    neuro.track_event(
        user_id=user_id,
        action='payment_success',
        screen='api',
        metadata={'amount': amount, 'source': 'server'}
    )
    
    return jsonify({'status': 'success'})
```

**Use Cases:**
- Server-side tracking (API endpoints)
- Background jobs (Celery, cron)
- ML pipelines (Data science workflows)

---

### 2. **Node.js SDK** (Already exists, but improve)
```typescript
// @libero/neuro-core-node
import { NeuroCore } from '@libero/neuro-core-node';

const neuro = new NeuroCore({ appName: 'myapi' });

app.post('/api/purchase', async (req, res) => {
  const { userId, amount } = req.body;
  
  await neuro.trackEvent(userId, 'payment_success', 'api', { amount });
  
  res.json({ status: 'success' });
});
```

---

### 3. **Java SDK** ☕
```java
// @libero/neuro-core-java
import com.libero.neurocore.NeuroCore;

NeuroCore neuro = new NeuroCore("myapi", "http://localhost:3001");

@PostMapping("/api/purchase")
public ResponseEntity<String> purchase(@RequestBody PurchaseRequest request) {
    neuro.trackEvent(
        request.getUserId(),
        "payment_success",
        "api",
        Map.of("amount", request.getAmount())
    );
    
    return ResponseEntity.ok("success");
}
```

**Neden önemli:**
- Enterprise backend (Banks, insurance, government)
- High LTV customers

---

### 4. **Go SDK** 🐹
```go
// @libero/neuro-core-go
package main

import "github.com/libero/neuro-core-go"

neuro := neurocore.New("myapi", "http://localhost:3001")

func purchaseHandler(w http.ResponseWriter, r *http.Request) {
    var req PurchaseRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    neuro.TrackEvent(req.UserID, "payment_success", "api", map[string]interface{}{
        "amount": req.Amount,
    })
    
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
```

**Neden önemli:**
- Microservices (Docker, Kubernetes)
- High performance (Fintech, streaming)

---

### 5. **Ruby SDK** 💎
```ruby
# @libero/neuro-core-ruby
require 'neuro_core'

neuro = NeuroCore.new(app_name: 'myapi', api_url: 'http://localhost:3001')

post '/api/purchase' do
  user_id = params[:user_id]
  amount = params[:amount]
  
  neuro.track_event(
    user_id: user_id,
    action: 'payment_success',
    screen: 'api',
    metadata: { amount: amount }
  )
  
  { status: 'success' }.to_json
end
```

**Neden önemli:**
- Rails apps (Shopify, GitHub, Airbnb built on Rails)

---

## 🧠 v5.0 - ADVANCED AI FEATURES (5-6 ay)

### 1. **Predictive Churn Detection** 🔮
```typescript
// API endpoint
GET /api/predictions/churn?userId=123

// Response
{
  "userId": "123",
  "churnProbability": 0.78,  // 78% chance of churning
  "reason": "Low engagement: Last login 14 days ago",
  "recommendation": "Send re-engagement email with 20% discount"
}
```

**ML Model:**
- Features: Login frequency, session duration, feature usage, dopamine trends
- Algorithm: XGBoost / Random Forest
- Update: Real-time (every synapse)

---

### 2. **Anomaly Detection** ⚠️
```typescript
// Real-time alerts
{
  "alert": "ANOMALY_DETECTED",
  "screen": "checkout",
  "metric": "conversion_rate",
  "normal": 0.25,      // 25% normal
  "current": 0.08,     // 8% current
  "drop": -68%,
  "timestamp": "2026-02-14T10:30:00Z",
  "possibleCauses": [
    "Payment gateway down",
    "Bug in checkout flow",
    "Network issues"
  ]
}
```

**Alerting:**
- Slack/Discord/Email integration
- Auto-create GitHub issue
- PagerDuty integration (Enterprise)

---

### 3. **Smart Recommendations** 💡
```typescript
// API endpoint
GET /api/recommendations?userId=123

// Response
{
  "userId": "123",
  "recommendations": [
    {
      "type": "feature",
      "feature": "dark_mode",
      "reason": "Similar users love it",
      "confidence": 0.89
    },
    {
      "type": "content",
      "content": "tutorial_video",
      "reason": "You seem stuck on this feature",
      "confidence": 0.76
    },
    {
      "type": "upsell",
      "plan": "pro",
      "reason": "You hit free tier limits 3 times",
      "confidence": 0.92
    }
  ]
}
```

**ML Model:**
- Collaborative filtering (User-based)
- Content-based filtering (Feature similarity)
- Hybrid approach

---

### 4. **Natural Language Queries** 🗣️
```typescript
// Chat interface
User: "Why did conversion rate drop yesterday?"

Neuro AI: "I analyzed 15,247 sessions. Conversion dropped 32% due to:
1. Payment gateway timeout (45% of failures)
2. Mobile checkout bug (Chrome Android)
3. Slow page load (avg 8.5s, usually 2.1s)

Fix priority: Payment gateway (highest impact)"
```

**Tech Stack:**
- GPT-4 integration (or local LLM)
- Natural language → SQL/Analytics query
- Conversational analytics

---

### 5. **Auto-Generated A/B Tests** 🧬
```typescript
// AI suggests A/B tests automatically
{
  "suggestion": "A/B Test Recommended",
  "feature": "checkout_button_size",
  "reason": "Button too small (mobile users struggle to tap)",
  "evidence": {
    "rageClicks": 234,
    "avgTapsToSuccess": 3.2,
    "mobileUsers": "78% affected"
  },
  "proposedTest": {
    "variantA": { "size": "medium" },  // current
    "variantB": { "size": "large" }    // proposed
  },
  "estimatedLift": "+15% conversion",
  "autoApprove": false  // or true for Enterprise tier
}
```

---

## 📊 v6.0 - VISUAL ANALYTICS TOOLS (6-7 ay)

### 1. **Heatmaps** 🔥
```typescript
// Endpoint
GET /api/heatmap?screen=checkout&dateRange=7d

// Response: Heatmap data
{
  "screen": "checkout",
  "clicks": [
    { "x": 150, "y": 300, "count": 1234 },
    { "x": 152, "y": 302, "count": 987 },
    // ...
  ],
  "scrollDepth": {
    "0-25%": 10000,
    "25-50%": 8500,
    "50-75%": 4200,
    "75-100%": 1800  // Only 18% scroll to bottom!
  }
}
```

**Visual Component:**
```tsx
import { NeuroHeatmap } from '@libero/neuro-core-react';

<NeuroHeatmap screen="checkout" dateRange="7d" />
```

---

### 2. **Session Replay** 🎥
```typescript
// Record DOM mutations
{
  "sessionId": "session_123",
  "events": [
    { "type": "click", "selector": "#submit-btn", "timestamp": 1000 },
    { "type": "input", "selector": "#email", "value": "***@***.com", "timestamp": 2000 },
    { "type": "scroll", "y": 500, "timestamp": 3000 },
    { "type": "error", "message": "Network timeout", "timestamp": 4000 }
  ],
  "duration": 120000,  // 2 minutes
  "dopamine": 0.25,    // Low = frustrated session
  "rageClicks": 8
}
```

**Visual Player:**
```tsx
import { SessionReplay } from '@libero/neuro-core-react';

<SessionReplay sessionId="session_123" />
```

---

### 3. **Funnel Visualization** 📊
```typescript
// Define funnel
const funnel = [
  { step: 'product_view', name: 'Product Page' },
  { step: 'add_to_cart', name: 'Added to Cart' },
  { step: 'checkout_start', name: 'Started Checkout' },
  { step: 'payment_success', name: 'Completed Purchase' }
];

// API analyzes conversion
{
  "funnel": [
    { "step": "product_view", "users": 10000, "conversion": 100% },
    { "step": "add_to_cart", "users": 3000, "conversion": 30% },  // 70% drop!
    { "step": "checkout_start", "users": 2000, "conversion": 66% },
    { "step": "payment_success", "users": 1800, "conversion": 90% }
  ],
  "overallConversion": 18%,
  "biggestDropOff": {
    "from": "product_view",
    "to": "add_to_cart",
    "dropRate": 70%,
    "reason": "Unclear pricing"  // AI analysis
  }
}
```

---

### 4. **Custom Dashboards (No-Code)** 📈
```tsx
// Drag-and-drop dashboard builder
<NeuroDashboardBuilder>
  <Widget type="metric" metric="overallHappiness" />
  <Widget type="chart" chart="dopamineOverTime" />
  <Widget type="table" data="topScreens" />
  <Widget type="heatmap" screen="checkout" />
  <Widget type="funnel" funnel={myFunnel} />
</NeuroDashboardBuilder>
```

**Export:**
- PDF reports
- Email scheduling (Daily/Weekly)
- Slack integration

---

## 🔗 v7.0 - INTEGRATIONS MARKETPLACE (7-8 ay)

### 1. **Slack Integration** 💬
```bash
# Real-time alerts to Slack
Neuro Bot: ⚠️ Anomaly detected!
Checkout conversion dropped 45% in last hour.
Possible cause: Payment gateway timeout.
[View Details] [Create Incident]
```

---

### 2. **Zapier Integration** ⚡
```yaml
# Trigger: Dopamine drops below 0.5
# Action: Create Jira ticket
When: User happiness < 0.5 on "checkout" screen
Then: Create Jira issue with priority "High"
```

---

### 3. **Webhooks** 🪝
```typescript
// Custom webhook endpoint
POST https://myapp.com/webhooks/neuro

{
  "event": "churn_risk_detected",
  "userId": "123",
  "churnProbability": 0.85,
  "timestamp": "2026-02-14T10:30:00Z"
}
```

---

### 4. **DataDog / New Relic Integration** 📊
```typescript
// Send Neuro metrics to DataDog
neuro.on('synapse', (synapse) => {
  dataDog.gauge('neuro.dopamine', synapse.dopamineScore, {
    tags: [`screen:${synapse.screen}`, `app:${synapse.appName}`]
  });
});
```

---

### 5. **Stripe Integration** 💳
```typescript
// Auto-track revenue
stripe.on('payment_intent.succeeded', (event) => {
  neuro.trackEvent(
    event.customer,
    'payment_success',
    'stripe_webhook',
    { amount: event.amount / 100, currency: event.currency }
  );
});
```

---

## 🛡️ v8.0 - SECURITY & COMPLIANCE (8-9 ay)

### 1. **GDPR Compliance** 🇪🇺
```typescript
// User data export
GET /api/gdpr/export?userId=123

// Response: All user data
{
  "userId": "123",
  "synapses": [...],
  "sessions": [...],
  "abTests": [...]
}

// User data deletion
DELETE /api/gdpr/delete?userId=123

// Response
{
  "status": "deleted",
  "synapsesDeleted": 1234,
  "sessionsDeleted": 56
}
```

---

### 2. **HIPAA Compliance** 🏥
```typescript
// Encrypted at rest (AES-256)
// Encrypted in transit (TLS 1.3)
// Audit logs (Who accessed what, when)
// PHI scrubbing (Auto-remove sensitive data)

{
  "userId": "***",  // Hashed
  "email": "***@***.com",  // Masked
  "action": "prescription_viewed",
  "screen": "medical_records",
  "metadata": {
    "doctorId": "***",  // Hashed
    "diagnosis": "[REDACTED]"  // PHI removed
  }
}
```

---

### 3. **SOC 2 Compliance** 🔐
```typescript
// Required features:
- Audit logs (All API calls)
- Role-based access control (RBAC)
- Encryption (at rest + in transit)
- Backup & disaster recovery
- Incident response plan
- Penetration testing reports
```

---

### 4. **Data Anonymization** 🕵️
```typescript
// Option: Anonymize user data
neuro.init({
  appName: 'myapp',
  anonymize: true  // Hash all user IDs
});

// Result:
{
  "userId": "sha256:a3f2e9...",  // Hashed, can't reverse
  "action": "payment_success",
  "metadata": {
    "amount": 99.99,  // Keep analytics-relevant data
    "email": null     // Remove PII
  }
}
```

---

## ⚡ v9.0 - PERFORMANCE & SCALE (9-10 ay)

### 1. **Edge Computing** 🌍
```typescript
// Deploy Neuro-Core to Cloudflare Workers / AWS Lambda@Edge
// Process analytics at edge (closest to user)
// Reduce latency: 500ms → 50ms

// CDN-level tracking
neuro.deployToEdge({
  provider: 'cloudflare',
  regions: ['us-east', 'eu-west', 'ap-south']
});
```

---

### 2. **Time-Series Database** 📈
```typescript
// Replace MongoDB with InfluxDB / TimescaleDB
// 10x faster queries on time-series data
// Compression: 100GB → 10GB

// Query optimization
SELECT dopamine, screen
FROM synapses
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY screen
ORDER BY AVG(dopamine) DESC;

// Result: 10ms (was 2000ms with MongoDB)
```

---

### 3. **Data Warehousing** 🏭
```typescript
// Export to BigQuery / Snowflake / Redshift
// For advanced analytics (SQL, BI tools)

neuro.exportTo('bigquery', {
  project: 'my-project',
  dataset: 'neuro_analytics',
  schedule: 'hourly'
});

// Now use Looker/Tableau/PowerBI
```

---

### 4. **Distributed Processing** 🌐
```typescript
// Apache Kafka + Spark Streaming
// Process 1M events/second

// Architecture:
// Frontend → Kafka → Spark → TimescaleDB → API

neuro.init({
  appName: 'myapp',
  streaming: {
    provider: 'kafka',
    brokers: ['kafka1:9092', 'kafka2:9092']
  }
});
```

---

## 🤖 v10.0 - AI AUTOMATION (10-12 ay)

### 1. **Auto-Fix UX Issues** 🔧
```typescript
// AI detects issue → Auto-proposes fix → Auto-deploys (with approval)

{
  "issue": "High rage clicks on mobile checkout button",
  "detection": {
    "rageClicks": 1234,
    "screen": "checkout",
    "component": "#submit-btn"
  },
  "aiAnalysis": {
    "root_cause": "Button too small (32px on 375px screen)",
    "recommendation": "Increase to 48px (Apple HIG guidelines)"
  },
  "proposedFix": {
    "file": "src/components/CheckoutButton.tsx",
    "changes": [
      { "line": 15, "old": "height: 32px", "new": "height: 48px" },
      { "line": 16, "old": "fontSize: 14px", "new": "fontSize: 16px" }
    ]
  },
  "status": "awaiting_approval",  // or "auto_deployed" for Enterprise
  "estimatedImpact": "+12% conversion"
}
```

---

### 2. **Voice Analytics** 🎙️
```typescript
// User talks to analytics
User: "Hey Neuro, show me conversion rate for last 7 days"
Neuro: "Conversion rate: 18.5% (up 2.3% from previous week)"

User: "Why did it increase?"
Neuro: "A/B test winner (larger checkout button) went live 4 days ago"

User: "Apply that to all buttons"
Neuro: "Done. Pushed to production. Estimated impact: +5% overall conversion"
```

---

### 3. **Self-Optimizing Apps** 🧬
```typescript
// App continuously improves itself
neuro.enableAutoOptimization({
  mode: 'aggressive',  // or 'conservative'
  autoApprove: true,   // or false (manual approval)
  areas: ['ui', 'copy', 'layout', 'colors']
});

// Every night:
// 1. AI analyzes yesterday's data
// 2. Generates improvements
// 3. Creates A/B tests
// 4. Deploys winners
// 5. Reports results

// Result: +30% conversion in 3 months (hands-off!)
```

---

## 📦 COMPLETE FEATURE LIST (v1.0 - v10.0)

| Version | Features | Timeline | Business Impact |
|---------|----------|----------|-----------------|
| **v1.0** | React SDK, Basic analytics | ✅ Done | Foundation |
| **v2.0** | Vue/Angular/Svelte SDK | 2-3 mo | +50% TAM |
| **v3.0** | Mobile SDKs (RN/Flutter/Native) | 3-4 mo | +200% TAM |
| **v4.0** | Backend SDKs (Python/Java/Go/Ruby) | 4-5 mo | Enterprise sales |
| **v5.0** | AI Features (Churn/Anomaly/NLQ) | 5-6 mo | +$500/mo ARPU |
| **v6.0** | Visual Tools (Heatmaps/Replay) | 6-7 mo | Compete w/ Hotjar |
| **v7.0** | Integrations (Slack/Zapier/Stripe) | 7-8 mo | Ecosystem lock-in |
| **v8.0** | Security (GDPR/HIPAA/SOC2) | 8-9 mo | Enterprise tier |
| **v9.0** | Performance (Edge/Streaming) | 9-10 mo | Handle 1M+ users |
| **v10.0** | AI Automation (Auto-fix/Voice) | 10-12 mo | 🚀 **HOLY GRAIL** |

---

## 💰 PRICING EVOLUTION

| Tier | v1.0 | v5.0 (AI) | v10.0 (Automation) |
|------|------|-----------|---------------------|
| Community | $0 | $0 | $0 |
| Pro | $49/mo | $99/mo | $199/mo |
| Enterprise | $499/mo | $999/mo | $2999/mo |
| Quantum | $1999/mo | $4999/mo | $9999/mo |

**Why price increases?**
- v5.0: AI costs (GPT-4, ML models)
- v10.0: Auto-optimization (saves $10K+/mo in dev time)

---

## 🎯 PRIORITY ROADMAP (What to build FIRST)

### Phase 1 (Next 3 months):
1. ✅ **Vue.js SDK** - Quick win (3 weeks)
2. ✅ **Heatmaps** - High demand (4 weeks)
3. ✅ **Session Replay** - Differentiation (6 weeks)

### Phase 2 (Months 4-6):
4. ✅ **React Native SDK** - Mobile market (8 weeks)
5. ✅ **Predictive Churn** - AI value (6 weeks)
6. ✅ **Slack Integration** - Enterprise feature (2 weeks)

### Phase 3 (Months 7-12):
7. ✅ **Python SDK** - Backend tracking (4 weeks)
8. ✅ **GDPR Compliance** - EU market (6 weeks)
9. ✅ **Edge Computing** - Scale (8 weeks)

---

## ✅ SONUÇ: COMPREHENSIVE ROADMAP

**Toplam 50+ yeni özellik!**

### Framework Support: 🌐
- Vue, Angular, Svelte, Vanilla JS
- React Native, Flutter, iOS Native, Android Native
- Python, Java, Go, Ruby, PHP

### AI Features: 🧠
- Churn prediction
- Anomaly detection
- Smart recommendations
- Natural language queries
- Auto-generated A/B tests
- Auto-fix UX issues
- Self-optimizing apps

### Visual Tools: 📊
- Heatmaps
- Session replay
- Funnel visualization
- Custom dashboards (no-code)

### Integrations: 🔗
- Slack, Zapier, Webhooks
- DataDog, New Relic
- Stripe, Shopify

### Security: 🛡️
- GDPR, HIPAA, SOC 2
- Data anonymization

### Performance: ⚡
- Edge computing
- Time-series DB
- Data warehousing
- Distributed processing

**Hangisini ÖNCE yapmalıyız?** 🚀

1. **Hızlı kazanç:** Vue SDK + Heatmaps (6 weeks)
2. **Enterprise satış:** GDPR + Python SDK (10 weeks)
3. **Differentiation:** AI features (Churn + Anomaly) (12 weeks)

**Senin önceliğin ne?** 🎯
