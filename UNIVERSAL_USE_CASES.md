# 🎯 LIBERO NEURO-CORE - UNIVERSAL USE CASES

## Her UI Uygulaması İçin Genel Senaryolar

---

## 📊 1. E-COMMERCE (Shopify-like)

### Analiz Edilen Ekranlar:
- ✅ **Product List** (Ürün listesi) - En çok hangi kategoriler geziliyor?
- ✅ **Product Detail** (Ürün detayı) - Hangi ürünler ilgi çekiyor?
- ✅ **Cart** (Sepet) - Sepet abandoned oranı nedir?
- ✅ **Checkout** (Ödeme) - Hangi adımda kullanıcılar çıkıyor?
- ✅ **Payment** (Ödeme) - Success vs Failed oranı?

### Otomatik Tracking Olayları:
```typescript
// Example: E-commerce App
import { initNeuroCore, useNeuroTracking, useNeuroAction, useNeuroABTest } from '@libero/neuro-core-react';

// App.tsx - Initialize once
initNeuroCore({
  appName: 'myshop',
  appVersion: '2.1.0'
});

// ProductPage.tsx
function ProductPage({ productId, userId }) {
  // ✅ Otomatik screen tracking
  useNeuroTracking(userId, 'product_detail', { productId });
  
  const track = useNeuroAction(userId, 'product_detail');
  
  const handleAddToCart = () => {
    // ✅ Manuel action tracking
    track('add_to_cart', { productId, price: 29.99 });
  };
  
  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  );
}

// CheckoutPage.tsx - A/B Test
function CheckoutButton({ userId }) {
  const { variant, config, trackConversion } = useNeuroABTest('checkout_button_color', userId);
  
  const handleCheckout = async () => {
    const success = await processPayment();
    // ✅ Track conversion
    trackConversion(success, success ? 99.99 : undefined);
  };
  
  return (
    <button
      style={{ backgroundColor: config.color || 'blue' }}
      onClick={handleCheckout}
    >
      Complete Purchase
    </button>
  );
}
```

### Analytics Dashboard:
```typescript
function EcommerceAnalytics() {
  const { analytics } = useNeuroAnalytics(10000);
  
  return (
    <div>
      <h2>🛒 E-commerce Analytics</h2>
      
      {/* Hangi ekranlar başarılı? */}
      <h3>Top Screens by Happiness:</h3>
      {analytics?.topScreens?.map(screen => (
        <div key={screen.screen}>
          <strong>{screen.screen}</strong>: {screen.avgHappiness} happiness
          <br />
          Conversion: {screen.visits} visits → Check if "payment_success"
        </div>
      ))}
      
      {/* A/B Test: Hangi buton rengi daha çok satış yapıyor? */}
      <h3>A/B Test: Checkout Button Color</h3>
      {analytics?.abTests?.map(test => (
        <div key={test.feature}>
          Variant A (Blue): {test.variantA.conversionRate}<br />
          Variant B (Green): {test.variantB.conversionRate}<br />
          Winner: <strong>{test.winner}</strong>
        </div>
      ))}
    </div>
  );
}
```

### Dopamine Events (E-commerce Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `payment_success` | 0.95 | 🔥 Revenue! |
| `add_to_cart` | 0.75 | Good intent |
| `product_view` | 0.60 | Browsing |
| `cart_abandoned` | 0.25 | ⚠️ Lost sale |
| `payment_failed` | 0.10 | ❌ Fix immediately! |

---

## 💼 2. SAAS DASHBOARD (Notion, Linear, Airtable-like)

### Analiz Edilen Ekranlar:
- ✅ **Dashboard** - Kullanıcılar buradan başlıyor mu?
- ✅ **Editor/Workspace** - En çok hangi feature kullanılıyor?
- ✅ **Settings** - Hangi ayarlar değiştiriliyor?
- ✅ **Templates** - Hangi template'ler popüler?
- ✅ **Collaboration** - Share/Invite oranı nedir?

### Otomatik Tracking Olayları:
```typescript
// Example: SaaS App (Notion-like)
initNeuroCore({
  appName: 'myapp',
  appVersion: '3.0.1'
});

// Editor.tsx
function Editor({ userId, documentId }) {
  useNeuroTracking(userId, 'editor', { documentId });
  
  const track = useNeuroAction(userId, 'editor');
  
  const handleSave = () => {
    track('content_created', { type: 'document', wordCount: 1500 });
  };
  
  const handleShare = () => {
    track('content_shared', { documentId, visibility: 'public' });
  };
  
  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleShare}>Share</button>
    </div>
  );
}

// Dashboard.tsx - A/B Test: Grid vs List Layout
function Dashboard({ userId }) {
  const { variant } = useNeuroABTest('dashboard_layout', userId);
  
  return variant === 'A' ? <GridLayout /> : <ListLayout />;
}
```

### Analytics Dashboard:
```typescript
function SaaSAnalytics() {
  const { analytics } = useNeuroAnalytics(10000);
  
  return (
    <div>
      <h2>📊 SaaS Analytics</h2>
      
      {/* Hangi feature en çok kullanılıyor? */}
      <h3>Feature Usage (by screen):</h3>
      {analytics?.topScreens?.map(screen => (
        <div key={screen.screen}>
          <strong>{screen.screen}</strong>:
          {screen.avgHappiness > 0.8 ? ' 🔥 Users love it!' : ' ⚠️ Needs improvement'}
          <br />
          Avg time: {screen.avgDuration}s
        </div>
      ))}
      
      {/* Kullanıcı engagement */}
      <h3>Engagement Metrics:</h3>
      <p>Overall happiness: {analytics?.overallHappiness}</p>
      <p>Unique users: {analytics?.uniqueUsers}</p>
      <p>Active sessions: {analytics?.uniqueSessions}</p>
    </div>
  );
}
```

### Dopamine Events (SaaS Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `signup_completed` | 0.92 | 🔥 New user! |
| `content_created` | 0.90 | Core feature used |
| `content_shared` | 0.80 | Viral growth |
| `feature_explored` | 0.75 | Good engagement |
| `tutorial_skipped` | 0.30 | ⚠️ Onboarding issue |
| `feature_abandoned` | 0.20 | ❌ Confusing UX |

---

## 📱 3. SOCIAL MEDIA (Twitter, Instagram-like)

### Analiz Edilen Ekranlar:
- ✅ **Feed** (Ana akış) - Kullanıcılar ne kadar scroll ediyor?
- ✅ **Profile** (Profil) - Kendi profili mi, başkasının mı?
- ✅ **Post Detail** (Gönderi detayı) - Hangi içerikler ilgi çekiyor?
- ✅ **Create Post** (Gönderi oluştur) - Kaç kişi post oluşturuyor?
- ✅ **Explore** (Keşfet) - Discovery rate nedir?

### Otomatik Tracking Olayları:
```typescript
// Example: Social Media App
initNeuroCore({
  appName: 'mysocial',
  appVersion: '4.2.0'
});

// Feed.tsx
function Feed({ userId }) {
  useNeuroTracking(userId, 'feed');
  
  const track = useNeuroAction(userId, 'feed');
  
  const handleLike = (postId: string) => {
    track('like', { postId });
  };
  
  const handleComment = (postId: string) => {
    track('comment', { postId });
  };
  
  const handleShare = (postId: string) => {
    track('share', { postId });
  };
  
  return (
    <div>
      {posts.map(post => (
        <Post
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
          onComment={() => handleComment(post.id)}
          onShare={() => handleShare(post.id)}
        />
      ))}
    </div>
  );
}

// CreatePost.tsx - A/B Test: Video vs Photo
function CreatePost({ userId }) {
  const { variant, trackConversion } = useNeuroABTest('post_type_default', userId);
  
  const handlePost = async () => {
    const success = await uploadPost();
    trackConversion(success);
  };
  
  return (
    <button onClick={handlePost}>
      {variant === 'A' ? '📷 Photo' : '🎥 Video'}
    </button>
  );
}
```

### Analytics Dashboard:
```typescript
function SocialAnalytics() {
  const { analytics } = useNeuroAnalytics(10000);
  
  return (
    <div>
      <h2>📱 Social Media Analytics</h2>
      
      {/* Hangi ekranlar en engaging? */}
      <h3>Most Engaging Screens:</h3>
      {analytics?.topScreens?.map(screen => (
        <div key={screen.screen}>
          <strong>{screen.screen}</strong>: {screen.avgDuration}s avg time
          <br />
          Happiness: {screen.avgHappiness} (High = addictive!)
        </div>
      ))}
      
      {/* Viral coefficient */}
      <h3>Viral Growth:</h3>
      <p>Shares: Count 'share' events</p>
      <p>Invites: Count 'invite_sent' events</p>
    </div>
  );
}
```

### Dopamine Events (Social Media Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `post_liked` | 0.85 | Engagement |
| `comment_received` | 0.88 | Social validation |
| `share` | 0.90 | 🔥 Viral growth! |
| `follow` | 0.75 | Network expansion |
| `post_ignored` | 0.40 | ⚠️ Content quality issue |
| `unfollow` | 0.20 | ❌ Churn signal |

---

## 💰 4. FINTECH (Banking, Trading Apps)

### Analiz Edilen Ekranlar:
- ✅ **Account Dashboard** (Hesap özeti)
- ✅ **Transfer** (Para transferi)
- ✅ **Invest** (Yatırım)
- ✅ **History** (İşlem geçmişi)
- ✅ **Security** (Güvenlik ayarları)

### Otomatik Tracking Olayları:
```typescript
// Example: Fintech App
initNeuroCore({
  appName: 'mybank',
  appVersion: '5.0.0'
});

// TransferPage.tsx
function TransferPage({ userId }) {
  useNeuroTracking(userId, 'transfer');
  
  const track = useNeuroAction(userId, 'transfer');
  const { rageDetected } = useRageDetection(userId, 'transfer');
  
  const handleTransfer = async (amount: number) => {
    try {
      await processTransfer(amount);
      track('transfer_success', { amount });
    } catch (error) {
      track('transfer_failed', { amount, error: error.message });
    }
  };
  
  return (
    <div>
      {rageDetected && <Alert>Having trouble? Call support: 1-800-HELP</Alert>}
      <button onClick={() => handleTransfer(100)}>Send $100</button>
    </div>
  );
}

// InvestPage.tsx - A/B Test: Simple vs Advanced UI
function InvestPage({ userId }) {
  const { variant } = useNeuroABTest('invest_ui_complexity', userId);
  
  return variant === 'A' ? <SimpleInvestUI /> : <AdvancedInvestUI />;
}
```

### Analytics Dashboard:
```typescript
function FintechAnalytics() {
  const { analytics } = useNeuroAnalytics(10000);
  
  return (
    <div>
      <h2>💰 Fintech Analytics</h2>
      
      {/* Security: Rage quit detection */}
      <h3>⚠️ Friction Points:</h3>
      {analytics?.topScreens?.filter(s => s.avgHappiness < 0.5).map(screen => (
        <div key={screen.screen} style={{ color: 'red' }}>
          <strong>{screen.screen}</strong>: {screen.avgHappiness} happiness
          <br />
          ⚠️ High friction - Users frustrated!
        </div>
      ))}
      
      {/* Transaction success rate */}
      <h3>Transaction Success Rate:</h3>
      <p>Success: Count 'transfer_success' events</p>
      <p>Failed: Count 'transfer_failed' events</p>
    </div>
  );
}
```

### Dopamine Events (Fintech Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `transfer_success` | 0.95 | Core function works |
| `investment_profit` | 0.98 | 🔥 User making money! |
| `account_verified` | 0.85 | Onboarding complete |
| `transfer_failed` | 0.10 | ❌ Critical bug! |
| `fraud_alert` | 0.05 | ❌ Security issue! |

---

## 🏥 5. HEALTHCARE (Patient Portals, EMR)

### Analiz Edilen Ekranlar:
- ✅ **Appointments** (Randevular)
- ✅ **Medical Records** (Tıbbi kayıtlar)
- ✅ **Prescriptions** (Reçeteler)
- ✅ **Messages** (Doktor mesajları)
- ✅ **Lab Results** (Tahlil sonuçları)

### Otomatik Tracking Olayları:
```typescript
// Example: Healthcare App
initNeuroCore({
  appName: 'myhealthcare',
  appVersion: '1.5.0'
});

// AppointmentPage.tsx
function AppointmentPage({ userId }) {
  useNeuroTracking(userId, 'appointments');
  
  const track = useNeuroAction(userId, 'appointments');
  
  const handleBookAppointment = () => {
    track('appointment_booked', { doctor: 'Dr. Smith', date: '2026-03-01' });
  };
  
  return (
    <button onClick={handleBookAppointment}>Book Appointment</button>
  );
}

// LabResults.tsx - A/B Test: Graph vs Table View
function LabResults({ userId }) {
  const { variant } = useNeuroABTest('lab_results_view', userId);
  
  return variant === 'A' ? <GraphView /> : <TableView />;
}
```

### Dopamine Events (Healthcare Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `appointment_booked` | 0.90 | Core function |
| `prescription_filled` | 0.85 | Service delivered |
| `message_from_doctor` | 0.80 | Engagement |
| `appointment_missed` | 0.20 | ⚠️ Reminder needed |
| `login_failed` | 0.10 | ❌ Access issue |

---

## 🎓 6. EDUCATION (LMS, Online Courses)

### Analiz Edilen Ekranlar:
- ✅ **Course List** (Kurslar)
- ✅ **Video Player** (Ders videoları)
- ✅ **Quiz** (Sınavlar)
- ✅ **Progress** (İlerleme)
- ✅ **Certificates** (Sertifikalar)

### Otomatik Tracking Olayları:
```typescript
// Example: Education App
initNeuroCore({
  appName: 'myedu',
  appVersion: '2.3.0'
});

// VideoPlayer.tsx
function VideoPlayer({ userId, courseId }) {
  useNeuroTracking(userId, 'video_player', { courseId });
  
  const track = useNeuroAction(userId, 'video_player');
  
  const handleVideoComplete = () => {
    track('video_completed', { courseId, duration: 1800 });
  };
  
  return (
    <video onEnded={handleVideoComplete}>...</video>
  );
}

// Quiz.tsx
function Quiz({ userId, quizId }) {
  const track = useNeuroAction(userId, 'quiz');
  
  const handleQuizSubmit = (score: number) => {
    track('quiz_completed', { quizId, score, passed: score >= 70 });
  };
  
  return (
    <button onClick={() => handleQuizSubmit(85)}>Submit Quiz</button>
  );
}
```

### Dopamine Events (Education Specific):
| Event | Dopamine | Business Impact |
|-------|----------|-----------------|
| `quiz_passed` | 0.95 | 🔥 Success! |
| `certificate_earned` | 0.98 | Achievement |
| `video_completed` | 0.85 | Engagement |
| `quiz_failed` | 0.30 | ⚠️ Content too hard? |
| `course_abandoned` | 0.15 | ❌ Churn |

---

## 🎯 UNIVERSAL PATTERNS (Her Uygulama İçin Genel)

### 1. **Screen Success Ranking**
```typescript
// Hangi ekranlar başarılı?
// Rule: avgHappiness > 0.8 = Successful screen
// Rule: avgHappiness < 0.5 = Needs improvement

const successfulScreens = analytics.topScreens.filter(s => s.avgHappiness > 0.8);
const problematicScreens = analytics.topScreens.filter(s => s.avgHappiness < 0.5);

console.log('✅ Successful:', successfulScreens);
console.log('❌ Problematic:', problematicScreens);
```

### 2. **Conversion Funnel Analysis**
```typescript
// E-commerce: Product → Cart → Checkout → Payment
// SaaS: Signup → Onboarding → Feature Used → Subscription
// Social: Signup → Profile → Post Created → Shared

const funnel = [
  { step: 'product_view', count: 1000 },
  { step: 'add_to_cart', count: 300 },    // 30% conversion
  { step: 'checkout_start', count: 200 }, // 66% conversion
  { step: 'payment_success', count: 180 } // 90% conversion
];

// Where do users drop off? → Fix that screen!
```

### 3. **A/B Test Template** (Universal)
```typescript
// ANY feature can be A/B tested:
// - Button colors
// - Layout types (grid vs list)
// - Copy/text variations
// - Feature placement
// - Pricing tiers
// - Onboarding flows

// Example: Create A/B test
await createABTest(
  'feature_name',
  { variantA: 'config' },  // e.g., { color: 'blue' }
  { variantB: 'config' }   // e.g., { color: 'green' }
);
```

### 4. **Rage Detection** (Universal)
```typescript
// Works for ANY app:
// - E-commerce: Frustrating checkout
// - SaaS: Confusing editor
// - Social: Slow feed loading
// - Fintech: Complex transfer form

const { rageDetected } = useRageDetection(userId, 'any_screen');

if (rageDetected) {
  // Show help dialog
  // Call support
  // Simplify UI
}
```

### 5. **Form Analytics** (Universal)
```typescript
// Works for ANY form:
// - Signup forms
// - Checkout forms
// - Settings forms
// - Contact forms

const { trackFieldFocus, trackFieldBlur, trackSubmit } = useFormAnalytics(userId, 'any_form');

// Which field takes longest? → Simplify it
// Which field has most errors? → Add validation hint
// Which field causes abandonment? → Make optional
```

---

## ✅ SONUÇ: UNIVERSAL USE CASES

### Her UI Uygulaması İçin 5 Ana Soru:

1. **"Hangi ekranlar başarılı?"**
   → `analytics.topScreens` sorted by `avgHappiness`

2. **"Kullanıcılar nerede takılıyor?"**
   → Screens with `avgHappiness < 0.5` or high `rage_click` count

3. **"Hangi feature en çok kullanılıyor?"**
   → Count events by `action` type

4. **"A/B testlerimiz nasıl gidiyor?"**
   → `analytics.abTests` → Check `winner` and `confidence`

5. **"Kullanıcılar mutlu mu?"**
   → `analytics.overallHappiness` → Target: > 0.75

---

**RESULT:** Neuro-Core is **NOT** Sahada-specific. It works for **ANY** React app! 🚀
