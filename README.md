# DublajLab

Türkçe dublaj + altyazı paketi için satış sitesi.
Statik site, build yok, API yok. Ödeme ve dosya teslimatı Gumroad üzerinden.

```
public/           → yayınlanan site
  index.html      → ana sayfa (hero, ses örnekleri, paket, SSS)
  kurulum.html    → kurulum rehberi (şimdilik taslak)
  surumler.html   → sürüm geçmişi (site.json'dan)
  sss.html  iade.html  sartlar.html  iletisim.html  404.html
  site.json       → TEK ayar dosyası
  i18n/tr.json    → arayüz metinleri (TR)
  i18n/en.json    → arayüz metinleri (EN)
  assets/         → style.css, app.js, og.png, ses/
tools/make_og.py  → OG görselini yeniden üretir
.github/workflows/deploy.yml → push'ta Cloudflare Pages'e deploy
```

## Ayar: `public/site.json`

| Alan | Açıklama |
|---|---|
| `price.amount` / `price.currency` | Vitrinde görünen fiyat (şu an 6.99 USD) |
| `gumroadUrl` | Gumroad ürün linki. **Boşsa butonlar "Yakında satışta" olur.** |
| `version` | Paket sürümü (örn. `1.0`) |
| `gameVersion` | Desteklenen oyun sürümü |
| `features` | Paket özellikleri (TR/EN) |
| `samples` | Ses örnekleri (aşağıya bak) |
| `faq` | Ana sayfa ve SSS sayfasındaki sorular |
| `versions` | Sürüm geçmişi |
| `contactEmail` | İletişim adresi |

### Satışı açmak

`site.json` içinde:

```json
"gumroadUrl": "https://kullanici.gumroad.com/l/xxxxxx"
```

push et. Butonlar otomatik olarak satın alma moduna geçer.

### Ses örneği eklemek

1. Klipleri `public/assets/ses/` içine koy: `ornek1-tr.mp3`, `ornek1-en.mp3`
2. `site.json` → `samples` dizisine ekle:

```json
{
  "id": "ornek1",
  "name": { "tr": "Karakter adı", "en": "Character name" },
  "tag": { "tr": "Ana karakter", "en": "Main character" },
  "line": { "tr": "Replik...", "en": "Line..." },
  "tr": "/assets/ses/ornek1-tr.mp3",
  "en": "/assets/ses/ornek1-en.mp3"
}
```

Dizi boşken ana sayfada "Ses örnekleri kısa süre içinde" kutusu görünür.

## Yayın

GitHub Actions → Cloudflare Pages. Gerekli repo secret'ları:

| Secret | Nereden |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens (Pages:Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare panel → Workers & Pages → Account ID |

Canlı adres: https://dublajlab.pages.dev

## Yasal not

Site bağımsız bir hayran projesidir. Oyun/marka görselleri kullanılmaz, her sayfada bağımsızlık ibaresi bulunur. Ses örnekleri kısa tutulur.
