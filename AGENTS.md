# AGENTS.md — dublajlab

Bu repo DublajLab sitesidir: statik site + Cloudflare Pages.

## Kurallar

- **Derleme yok.** Site build gerektirmez; `public/` olduğu gibi yayınlanır.
- Yayın **sadece GitHub Actions** ile yapılır (`wrangler pages deploy`). Lokalde deploy/zımba komutu çalıştırma.
- Her konuşmanın başında `git fetch origin`, `git status -sb` ve `git log --oneline HEAD..@{upstream}` ile GitHub ile senkron ol.
- Değişiklikleri anlamlı mesajla commit et, `main` branch'ine push et, Actions sonucunu bekle.
- Ürün bilgileri `public/site.json` içinde tutulur; fiyat, Gumroad linki, sürüm ve SSS oradan güncellenir.
- Sırlar (token, şifre) repoya yazılmaz.
- GTA/Rockstar logosu, ekran görüntüsü veya marka varlığı ekleme; site bağımsız hayran projesi olarak kalır.
