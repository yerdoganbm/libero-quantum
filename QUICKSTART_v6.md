# 🚀 LIBERO QUANTUM v6.0 - QUICKSTART

**5 dakikada çalışır hale getirin.**

---

## Kurulum

```bash
cd C:\Users\YUNUS\Desktop\libero-quantum
npm install
npm run build
```

Tüm packages build edilir (core, agent, generator, runner, reporting, cli).

---

## Test (Örnek uygulama üzerinde)

### 1. Örnek uygulamayı çalıştır

```bash
cd examples/react-vite
npm install
npm run dev
```

Uygulama http://localhost:5174'te başlar.

### 2. Libero test pipeline'ını çalıştır (başka terminal)

```bash
cd examples/react-vite

# Tek komutla tüm pipeline
node ../../packages/cli/dist/cli.js init
node ../../packages/cli/dist/cli.js map --depth 2 --pages 10
node ../../packages/cli/dist/cli.js generate
node ../../packages/cli/dist/cli.js run
```

**Veya tek komut:**

```bash
node ../../packages/cli/dist/cli.js test --mode=full
```

### 3. Raporu görüntüle

Tarayıcıda aç:

```
.libero/reports/{runId}/index.html
```

---

## Beklenen Sonuç

```
🌌 Libero Quantum v6.0

✅ Framework: react (vite)
✅ Mapped: 5 routes, 43 elements
✅ Generated: 8 smoke tests
✅ Executed: 8/8 passed (100%)
✅ Duration: ~12s
✅ Report: .libero/reports/{runId}/index.html
```

---

## Kendi Uygulamanızda Kullanmak İçin

1. Uygulamanızın klasöründe:

```bash
npx libero init
```

2. libero.config.json düzenleyin:

```json
{
  "appName": "my-app",
  "baseUrl": "http://localhost:3000"
}
```

3. Çalıştır:

```bash
npx libero test --mode=full
```

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npx libero init` | Config + klasörleri oluştur |
| `npx libero map` | Uygulamayı tara, AppGraph üret |
| `npx libero generate` | Test planı oluştur |
| `npx libero run` | Testleri çalıştır |
| `npx libero test --mode=full` | Tümü (map + generate + run) |

---

## Dosya Yapısı (Otomatik oluşturulur)

```
your-app/
├── libero.config.json      # Ayarlar
└── .libero/
    ├── app-graph/
    │   └── latest.json     # Keşfedilen routes + elements
    ├── test-plans/
    │   └── smoke.json      # Üretilen testler
    ├── reports/
    │   └── {runId}/
    │       ├── index.html  # Rapor (tarayıcıda aç)
    │       └── {runId}.json
    ├── artifacts/          # Screenshots, traces
    └── screenshots/        # Crawl screenshots
```

---

**Başarıyla çalışıyor!** M1 tamamlandı. 🎉
