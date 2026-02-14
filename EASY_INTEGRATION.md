# 🚀 KOLAY ENTEGRASYON – Piyasadan Farklı Ne Yapılabilir?

Libero Neuro Core’u Mixpanel, Amplitude, PostHog gibi araçlardan **daha kolay** entegre edilebilir yapmak için somut öneriler.

---

## 📊 Piyasadaki Örnekler (Kısa)

| Araç | Entegrasyon | Zorluk |
|------|-------------|--------|
| **Mixpanel** | SDK kur → init → env key → her yerde track() | 4+ adım, env yönetimi |
| **Amplitude** | Script veya SDK → API key → autocapture aç | 3 adım, dashboard’da ayar |
| **PostHog** | Script tag veya SDK → API key → optional feature flags | 3 adım |
| **OpenPanel** | Tek script tag (head) | 1 adım ama sadece sayfa görüntüleme |

**Ortak sıkıntılar:** API key, env, backend/proxy, çok dosyada kod değişikliği.

---

## ✅ Libero İçin “Kolay Entegrasyon” Fikirleri

### 1. **Tek script tag – framework’ten bağımsız**

**Fark:** Proje React/Vue/Vanilla olsa da aynı tek satır. Script kendisi sayfa tipini/ortamı algılasın.

```html
<!-- Herhangi bir projede: index.html / _app.tsx / layout.vue -->
<script src="https://cdn.libero.dev/neuro.js" data-app="myapp"></script>
```

**Ne yapsın:**
- Sayfa görüntüleme otomatik
- Tıklama/otomatik event’ler (autocapture)
- `window.Neuro` ile istenirse manuel: `Neuro.track('event', { ... })`
- **API key zorunlu olmasın:** key yoksa “anon” mod (localStorage’da biriksin, key eklenince gönderilsin)

**Yapılacak:** `neuro.js` (UMD build) + CDN + `data-app` ile app adı.

---

### 2. **API key olmadan çalışma (dev mod)**

**Fark:** Rakipler çoğunlukla key zorunlu. Libero’da:

- Key **yoksa:** event’ler localStorage’da kuyruğa alınsın, konsola “Neuro (dev): 12 event bekliyor” gibi mesaj.
- Key **varsa:** aynı kuyruk backend’e gönderilsin.
- Böylece “önce kodu ekle, sonra hesap aç” akışı mümkün.

**Yapılacak:** SDK’da `apiKey` optional; yoksa `storageKey: 'neuro_queue'` ile push, sonra `setApiKey(key)` ile flush.

---

### 3. **Tek komutla kurulum: npx libero-init**

**Fark:** Çoğu araç “dokümana git, kopyala yapıştır” diyor. Libero:

```bash
npx libero-init
# veya
npx create-libero-app myapp
```

**Ne yapsın:**
- Proje kökünde framework’ü tespit et (React/Vue/Svelte/Vanilla).
- `.env.example` içine `NEURO_API_URL` ve opsiyonel `NEURO_API_KEY` eklesin.
- İlgili entry dosyasına (main.tsx, main.js, index.html) **tek satır** eklesin veya tek dosya (örn. `neuro.ts`) oluşturup import ettirsin.
- `README` veya konsola “Şu adımları tamamla: …” diye 2–3 adım yazsın.

**Yapılacak:** `create-libero-app` veya `libero-init` CLI (Node script).

---

### 4. **Framework’e göre “2 satır” snippet sayfası**

**Fark:** Her framework için aynı dokümantasyon yerine: “Sen React kullanıyorsun, sadece bunu yap.”

Dokümantasyonda veya `https://libero.dev/install` tarzı sayfada:

**React:**
```tsx
// 1) npm i @libero/neuro-core-react
// 2) App.tsx veya root'ta:
import { initNeuro } from '@libero/neuro-core-react';
initNeuro({ app: 'myapp' }); // key opsiyonel
```

**Vue:**
```ts
// 1) npm i @libero/neuro-core-vue
// 2) main.ts
import { initNeuro } from '@libero/neuro-core-vue';
app.use(initNeuro({ app: 'myapp' }));
```

**Vanilla / herhangi bir site:**
```html
<script src="https://cdn.libero.dev/neuro.js" data-app="myapp"></script>
```

**Yapılacak:** Install sayfası veya README’de framework seçince sadece bu bloklar çıksın (ve gerçekten 2 satırla çalışsın).

---

### 5. **Backend’i “opsiyonel” yapmak**

**Fark:** Şu an kullanıcı kendi backend’ini (neuro-core-server/full) çalıştırıyor. Ek seçenek:

- **Libero Cloud:** `apiUrl: 'https://api.libero.dev'` (veya benzeri). Kullanıcı hiç sunucu kurmadan sadece frontend’e script/SDK eklesin.
- Self-hosted kullanmak isteyen mevcut `apiUrl` ile kullanmaya devam etsin.

**Yapılacak:** Hosted API (ücretsiz kotası olabilir) + dokümanda “Kendi sunucunu kurmadan dene” bölümü.

---

### 6. **Autocapture varsayılan açık**

**Fark:** Birçok araç autocapture’ı ayrı açıyor veya sınırlı. Libero’da:

- SDK/script yüklendiği anda:
  - Sayfa görüntüleme
  - Tıklama (selector’lar hash’lenerek gizlilik dostu)
  - Form submit (hassas alanlar maskeli)
- İstenirse `autocapture: false` ile kapatılsın; sadece manuel event’ler gitsin.

**Yapılacak:** Tüm SDK’larda (React, Vue, Vanilla, script) `autocapture: true` default; dokümanda tek satırla kapatma.

---

### 7. **Entegrasyon doğrulama (tek tık)**

**Fark:** “Çalışıyor mu?” için genelde log/dashboard kontrolü gerekiyor. Libero’da:

- Tarayıcıda `localStorage` veya küçük bir “Neuro panel” (dev modda):
  - “Son 1 dk’da X event gönderildi”
  - “Bağlantı: OK / Key: ayarlı / Key: yok (dev mod)”
- Veya script yüklendikten sonra `window.Neuro.ready()` / `Neuro.check()` ile konsolda veya UI’da “Neuro bağlandı” mesajı.

**Yapılacak:** SDK’da `check()` veya `diagnostics()` + isteğe bağlı mini UI (badge veya console.table).

---

### 8. **Slack / Discord “kodu yok” uyarıları**

**Fark:** Anomali/churn uyarıları için çoğu araç webhook’u sizin kodlamanızı ister. Libero’da:

- Dashboard’da “Slack’e bağlan” / “Discord’a bağlan” butonu.
- OAuth veya webhook URL’i tek sefer girilir; sonrasında uyarılar otomatik gider.
- Geliştirici kendi backend’ine webhook yazmak zorunda kalmasın.

**Yapılacak:** Libero Cloud veya self-hosted panel’de entegrasyon ayarları + hazır Slack/Discord template’leri.

---

## ✅ UYGULANAN ÖZELLİKLER (Hepsi yapıldı)

1. **API key opsiyonel** – React SDK ve `dist/neuro.js`: apiUrl yoksa localStorage kuyruğu; `setApiUrl()` / `flushNeuroQueue()` ile sonradan gönderim.
2. **2 satır snippet** – README’de React, Vue, Vanilla için Quick Start bölümü.
3. **Tek script tag** – `dist/neuro.js` (UMD), `data-app`, `data-api`, autocapture varsayılan açık.
4. **Autocapture varsayılan açık** – `neuro.js`, vanilla, React (`useNeuroAutocapture`, `autocapture: true` default).
5. **npx libero-init** – `scripts/libero-init.js` + package.json `bin`; framework tespit, `.env.example`, neuro-init-react.jsx oluşturur.
6. **Entegrasyon check** – `Neuro.check()`, `Neuro.ready()`, React’ta `checkDiagnostics()`.
7. **Libero Cloud URL** – Dokümantasyonda `https://api.libero.dev/api` (placeholder); INTEGRATIONS.md.
8. **Slack/Discord** – INTEGRATIONS.md: webhook ile tek tık kurulum açıklaması.

---

## 📋 Öncelik Sırası (Kolay entegrasyon için)

| # | Özellik | Etki | Zorluk |
|---|---------|------|--------|
| 1 | **API key opsiyonel (dev mod)** | Hemen deneyebilir | Düşük |
| 2 | **Framework’e göre 2 satır snippet** | Dokümantasyon net | Düşük |
| 3 | **Tek script tag (CDN)** | Herkes tek satırla dener | Orta |
| 4 | **Autocapture varsayılan açık** | Sıfır kodla veri | Düşük |
| 5 | **npx libero-init** | Tek komut kurulum | Orta |
| 6 | **Entegrasyon check() / mini panel** | “Çalışıyor mu?” güveni | Düşük |
| 7 | **Libero Cloud (hosted API)** | Backend’siz deneme | Yüksek |
| 8 | **Slack/Discord tek tık** | Uyarılar kod’suz | Orta |

---

## 🛠 Hemen Uygulanabilecekler (Kod)

1. **useNeuroCore / initNeuro:** `apiKey` ve `apiUrl` opsiyonel yap; yoksa `localStorage` kuyruğu + konsol bilgisi.
2. **README / Install sayfası:** “React: 2 satır”, “Vue: 2 satır”, “Vanilla: 1 script” blokları.
3. **Vanilla script:** `neuro.js` UMD build, `data-app` ile init, `window.Neuro.track()` ve `window.Neuro.check()`.
4. **Tüm SDK’larda:** `autocapture: true` default; dokümanda nasıl kapatılacağı.

Bu doküman, piyasadaki örneklerden farklı olarak **kolay entegrasyon** için ne yapılabileceğini toplu halde tanımlıyor; istersen bir sonraki adımda doğrudan “2 satır snippet” ve “API key opsiyonel” kısmını koda dökebiliriz.
