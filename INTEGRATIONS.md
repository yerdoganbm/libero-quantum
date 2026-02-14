# 🔗 Libero Neuro Core – Entegrasyonlar

## Libero Cloud (Backend’siz deneme)

Kendi sunucunuzu kurmadan Neuro Core’u denemek için **Libero Cloud** API’sini kullanabilirsiniz.

```js
initNeuroCore({
  appName: 'myapp',
  apiUrl: 'https://api.libero.dev/api'
});
```

veya script tag:

```html
<script src="https://cdn.jsdelivr.net/gh/yerdoganbm/libero-quantum@main/dist/neuro.js"
        data-app="myapp"
        data-api="https://api.libero.dev/api"></script>
```

**Not:** Libero Cloud şu an placeholder URL’dir. Kendi backend’inizi çalıştırmak için:

```bash
npm run neuro:server   # minimal API
# veya
npm run neuro:full     # tüm özellikler
```

---

## Slack – Tek tık uyarılar

Anomali, churn veya evolution önerileri için Slack’e webhook ile bildirim göndermek istiyorsanız:

1. **Slack Incoming Webhook** oluşturun:  
   Slack → Apps → Incoming Webhooks → Add to Slack → Webhook URL’i kopyalayın.

2. **Neuro Core Full** sunucusunda webhook kaydedin:

```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"https://hooks.slack.com/services/YOUR/WEBHOOK","events":["evolution_suggestions","*"]}'
```

3. Artık `POST /api/evolution/analyze` sonrası öneriler Slack kanalınıza düşer.

**Dashboard’da “Slack’e bağlan”:** Libero Cloud veya self-hosted panel’de ileride tek tıkla OAuth ile bağlanma planlanmaktadır.

---

## Discord – Tek tık uyarılar

1. Discord sunucunuzda bir kanal için **Webhook** oluşturun:  
   Kanal Ayarları → Entegrasyonlar → Webhook → Yeni Webhook → URL’i kopyalayın.

2. Neuro Core Full’da webhook kaydedin:

```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"https://discord.com/api/webhooks/ID/TOKEN","events":["evolution_suggestions","*"]}'
```

---

## Özet

| Entegrasyon   | Durum        | Nasıl |
|---------------|-------------|-------|
| Libero Cloud  | Placeholder  | `apiUrl: 'https://api.libero.dev/api'` |
| Slack         | Webhook      | `POST /api/webhooks` ile URL ekleyin |
| Discord       | Webhook      | Aynı endpoint, Discord webhook URL |
| Zapier        | İleride      | Webhook URL’inizi Zapier’da kullanın |

Tüm event’ler için `events: ["*"]` kullanabilirsiniz; veya sadece `evolution_suggestions`, `synapse` vb. belirli event’leri seçebilirsiniz.
