# ✅ LIBERO NEURO-CORE - HEPSİ YAPILDI + OTOMATİK KENDİNİ GELİŞTİRME

## Özet

**İstenen:** Tüm roadmap özellikleri + her UI uygulamasında otomatik kendini geliştirme.  
**Yapılan:** Full stack server (evolution, heatmap, replay, funnel, churn, anomaly, GDPR, webhooks), self-evolution engine, React/Vue/Svelte/Vanilla SDK'lar, Python SDK, ve her uygulamada **otomatik patch uygulama**.

---

## 🧠 1. OTOMATİK KENDİNİ GELİŞTİRME (Self-Evolution)

### Nasıl Çalışıyor?

1. **Veri toplanır** – Kullanıcı event’leri (synapse) ve süre/ekran bilgisi.
2. **Motor analiz eder** – Düşük dopamine, rage click, kısa süre, form hataları.
3. **İyileştirme önerileri üretilir** – CSS (büyük buton), copy (açıklama), layout.
4. **Patch’ler uygulanır** – Frontend `/api/evolution/patches` ile alır; React hook **CSS’i otomatik enjekte eder**.

### Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `server/self-evolution-engine.ts` | Analiz + improvement üretimi (low dopamine, rage click, short duration, form errors). |
| `server/neuro-core-full.ts` | `/evolution/analyze`, `/evolution/patches`, `/evolution/apply`, `/evolution/approve`, `/evolution/reject` endpoint’leri. |
| `hooks/useNeuroAutoEvolution.ts` | React: patch’leri çeker, **CSS’i otomatik uygular**, önerileri listeler, approve/reject/apply. |

### Her UI Uygulamasında Kullanım (React)

```tsx
// 1. Başlangıçta (App.tsx)
import { initNeuroCore } from './hooks/useNeuroCore-universal';
import { initNeuroAutoEvolution, useNeuroAutoEvolution } from './hooks/useNeuroAutoEvolution';

initNeuroCore({ appName: 'myapp', apiUrl: 'http://localhost:3001/api' });
initNeuroAutoEvolution({ appName: 'myapp', apiUrl: 'http://localhost:3001/api', autoApplyCss: true });

// 2. Uygulama içinde (otomatik patch’ler uygulanır)
function App() {
  useNeuroAutoEvolution({ autoApplyCss: true });  // CSS patch’leri otomatik enjekte edilir
  // ...
}

// 3. İsteğe bağlı: Analiz tetikle + önerileri göster
function AdminEvolutionPanel() {
  const { suggestions, runAnalyze, approveSuggestion, rejectSuggestion } = useNeuroAutoEvolution();
  return (
    <div>
      <button onClick={runAnalyze}>Analiz Et</button>
      {suggestions.map(s => (
        <div key={s.id}>
          <p>{s.reason}</p>
          <button onClick={() => approveSuggestion(s.id)}>Onayla</button>
          <button onClick={() => rejectSuggestion(s.id)}>Reddet</button>
        </div>
      ))}
    </div>
  );
}
```

### Vue / Svelte / Vanilla

- **Vue:** `lib/neuro-core-vue.ts` – `useNeuroAutoEvolution()` patch’leri döndürür; CSS’i siz ekleyebilir veya aynı mantıkla bir `<style>` ile uygulayabilirsiniz.
- **Svelte:** `lib/neuro-core-svelte.ts` – `neuroAutoEvolution()` stores: `patches`, `suggestions`, `runAnalyze`.
- **Vanilla:** `lib/neuro-core-vanilla.js` – `NeuroCore.getPatches()` + `NeuroCore.applyPatchesToDocument()` ile otomatik CSS enjeksiyonu.

---

## 🌐 2. FULL STACK SERVER (neuro-core-full)

**Komut:** `npm run neuro:full` (veya `neuro:full:dev`)

### Özellikler

| Özellik | Endpoint | Açıklama |
|---------|----------|----------|
| **Synapse** | `POST /api/synapse` | Event tracking. |
| **A/B** | `GET /api/variant/:feature`, `POST /api/ab-result` | A/B test. |
| **Heatmap** | `POST /api/heatmap/click`, `GET /api/heatmap/:screen` | Tıklama koordinatları + grid. |
| **Session Replay** | `POST /api/replay/event`, `GET /api/replay/:sessionId` | Replay event kaydı ve listeleme. |
| **Funnel** | `GET /api/funnel?steps=...` | Adım bazlı funnel. |
| **Self-Evolution** | `POST /api/evolution/analyze`, `GET /api/evolution/patches`, `POST /api/evolution/apply` | Analiz + patch’ler. |
| **Churn** | `GET /api/predictions/churn?userId=...` | Basit kural tabanlı churn skoru. |
| **Anomaly** | `GET /api/anomaly/detect` | Son 1 saat vs önceki saat karşılaştırması. |
| **Recommendations** | `GET /api/recommendations?userId=...` | Ekran bazlı öneriler. |
| **Webhooks** | `POST /api/webhooks` | Event’leri dış URL’e POST. |
| **GDPR** | `GET /api/gdpr/export`, `DELETE /api/gdpr/delete` | Veri dışa aktarma ve silme. |
| **Analytics** | `GET /api/analytics` | Genel analytics. |

---

## 📦 3. SDK’LAR (React, Vue, Svelte, Vanilla, Python)

### React (mevcut + yeni)

- **Dosya:** `hooks/useNeuroCore-universal.ts`  
  Tracking, A/B, analytics, rage, form, **heatmap**, **replay**.
- **Dosya:** `hooks/useNeuroAutoEvolution.ts`  
  Patch’leri çekme, **otomatik CSS uygulama**, öneri onay/red.

### Vue 3

- **Dosya:** `lib/neuro-core-vue.ts`  
  `initNeuroCore`, `useNeuroTracking`, `useNeuroAction`, `useNeuroABTest`, `useNeuroAnalytics`, `useNeuroAutoEvolution`, `useNeuroHeatmap`, `useNeuroReplay`.

### Svelte

- **Dosya:** `lib/neuro-core-svelte.ts`  
  `initNeuroCore`, `neuroTracking`, `createNeuroAction`, `neuroABTest`, `neuroAnalytics`, `neuroAutoEvolution`, `neuroHeatmap`.

### Vanilla JS

- **Dosya:** `lib/neuro-core-vanilla.js`  
  `NeuroCore.init()`, `trackScreen`, `trackAction`, `trackHeatmapClick`, `trackReplayEvent`, `getVariant`, `trackConversion`, `getPatches()`, `applyPatchesToDocument()`, `runAnalyze()`.

### Python

- **Dosya:** `sdks/python/neuro_core/__init__.py`  
  `NeuroCore(app_name, api_url)`: `track_event`, `track_conversion`, `get_variant`, `get_analytics`, `get_patches`, `run_evolution_analyze`, `churn_prediction`, `anomaly_detect`, `gdpr_export`, `gdpr_delete`.

```python
from neuro_core import NeuroCore
neuro = NeuroCore(app_name="myapi")
neuro.track_event("user123", "payment_success", "api", {"amount": 99.99})
neuro.run_evolution_analyze()
```

---

## 🚀 4. ÇALIŞTIRMA

### Backend (tüm özellikler)

```bash
npm run neuro:full
# veya
npm run neuro:full:dev
```

### Frontend (React) – Otomatik gelişme açık

```tsx
import { initNeuroCore } from './hooks/useNeuroCore-universal';
import { initNeuroAutoEvolution, useNeuroAutoEvolution } from './hooks/useNeuroAutoEvolution';

initNeuroCore({ appName: 'sahada', apiUrl: 'http://localhost:3001/api' });
initNeuroAutoEvolution({ appName: 'sahada', autoApplyCss: true });

function Root() {
  useNeuroAutoEvolution({ autoApplyCss: true });
  return ( ... );
}
```

### Heatmap (React)

```tsx
const onHeatmapClick = useNeuroHeatmap('checkout');
return <div onClick={onHeatmapClick}>...</div>;
```

### Session Replay (React)

```tsx
const recordReplay = useNeuroReplay();
useEffect(() => {
  recordReplay('click', { selector: 'button.submit' });
}, []);
```

---

## 📋 5. YAPILANLAR LİSTESİ

- **Self-Evolution Engine** – Analiz + improvement üretimi + patch API.
- **Full server** – Heatmap, Replay, Funnel, Churn, Anomaly, Recommendations, Webhooks, GDPR.
- **React** – `useNeuroAutoEvolution` (otomatik CSS), `useNeuroHeatmap`, `useNeuroReplay`.
- **Vue** – Tam SDK (tracking, A/B, analytics, evolution, heatmap, replay).
- **Svelte** – Tam SDK (aynı özellikler).
- **Vanilla JS** – Tam SDK + `applyPatchesToDocument()` ile otomatik CSS.
- **Python** – Backend event’leri, evolution analyze, churn, anomaly, GDPR.

**Sonuç:** Hem “hepsini yap” hem de “her UI uygulamasında kendini geliştirsin otomatik” isteği karşılandı. Full server ile `neuro:full` çalıştırıp, frontend’de `useNeuroAutoEvolution({ autoApplyCss: true })` (veya Vue/Svelte/Vanilla eşdeğeri) kullanarak her uygulamada otomatik iyileştirme açılabilir.
