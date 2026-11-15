# SETUP_CHECK — Kurulum Kontrol Listesi

> ⚡ **Hızlı yol:** `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1` (Windows) veya
> `bash scripts/setup.sh` (macOS/Linux/Git Bash) § 1–2'yi otomatik yapar (`npm ci`, git hook'ları,
> Claude plugin'leri) ve sonunda `npm run doctor` çalıştırır. § 3 için `npm run verify`. Aşağıdaki
> liste ayrıntılı/elle kontrol içindir.

> Projeyi ayağa kaldıran kişi (veya onun Claude Code CLI'ı) bu listeyi **yukarıdan aşağı** çalıştırır,
> her adımın beklenen çıktısını karşılaştırır ve sonunda "Durum raporu"nu doldurur.
> Komutlar proje kök klasöründe çalıştırılır; Windows PowerShell, Git Bash, macOS/Linux aynıdır.
>
> 🔒 **Kural:** `package.json`'a bağımlılık eklenir/çıkarılır/sürümü değişirse, **aynı commit'te**
> aşağıdaki "Bağımlılık kaydı" tablosu güncellenir. `src/test/setup-check.test.ts` bunu zorlar —
> tablo eksikse `npm test` kırmızı olur.

## 1. Sistem araçları

| #   | Komut              | Beklenen                                                              | Eksik / geride ise                                                                    |
| --- | ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1.1 | `node -v`          | `v22.x` veya üstü (`engines.node`: `>=22`). Test edilen: **v24.15.0** | Node 24 LTS kur: https://nodejs.org (veya `nvm install 24` / `fnm install 24`)        |
| 1.2 | `npm -v`           | `10.x` veya üstü. Test edilen: **12.0.2**                             | Node ile birlikte gelir; `npm i -g npm@latest`                                        |
| 1.3 | `git --version`    | `2.40` veya üstü. Test edilen: **2.53.0**                             | https://git-scm.com                                                                   |
| 1.4 | `claude --version` | İsteğe bağlı (önerilir): Claude Code CLI, son sürüm                   | https://code.claude.com/docs/en/overview — kurulum script'i plugin'leri bununla kurar |
| 1.5 | `gh --version`     | İsteğe bağlı: GitHub CLI (PR/merge/branch işleri için)                | `winget install GitHub.cli`, sonra `gh auth login`                                    |

Python / venv **gerekmez** (saf Node projesi; izolasyonu `node_modules` + `package-lock.json` sağlar).

## 2. Bağımlılıklar

| #   | Komut                                        | Beklenen                                                                                                                                                | Sorun varsa                                                                                                                                   |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `npm ci`                                     | `added N packages` — hata yok                                                                                                                           | Windows'ta `ENOTEMPTY`/`EPERM` verirse: `node_modules` klasörünü tamamen sil, ardından `npm install` (lock dosyası değişmemeli: `git status`) |
| 2.2 | `npm ls --depth=0`                           | Çıkış kodu `0`; `missing`, `UNMET DEPENDENCY`, `invalid`, `extraneous` **yok**                                                                          | `missing/UNMET` → `npm install` · `invalid` → sürüm uyuşmuyor, `npm install` · `extraneous` → `npm prune`                                     |
| 2.3 | Sürümleri "Bağımlılık kaydı" ile karşılaştır | `npm ls --depth=0` çıktısındaki her paket, tablodaki aralığı karşılar                                                                                   | Tablodan farklıysa `npm ci` (lock'taki sürüme döner)                                                                                          |
| 2.4 | `npm outdated`                               | Bilgi amaçlı. Yalnız aşağıdakiler **beklenen** farklardır: `typescript` (7.x mevcut, bilinçli olarak 6.0'da — ADR-002), `@types/node` (Node 24'e sabit) | Ekip kararı olmadan **major** yükseltme yapma                                                                                                 |
| 2.5 | `npm audit --omit=dev`                       | `found 0 vulnerabilities`                                                                                                                               | Kanalda paylaş. Not: dev bağımlılıklarında (minimatch, eslint zinciri) bilinen 7 "moderate" uyarı var, uygulamaya girmez                      |

## 3. Proje sağlığı

| #   | Komut                              | Beklenen                                                                                        | Sorun varsa                                                                                                          |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 3.1 | `npm run verify`                   | lint 0 hata/uyarı · typecheck temiz · tüm testler geçer · `✓ built`                             | Test "Cannot find module ... node_modules/..." diyorsa kurulum yarım kalmıştır → `node_modules`'ü sil, `npm install` |
| 3.2 | `npm run dev`                      | `VITE ... ready` ve `http://localhost:5173`                                                     | Port doluysa: `npm run dev -- --port 5174`                                                                           |
| 3.3 | Tarayıcıda `http://localhost:5173` | Dashboard'da 4 mürettebat kartı, üstte MET saati, sarı "Prototype — not a medical device" bandı | Boşsa: Settings → "Load demo data"                                                                                   |

## 4. Durum raporu (CLI bunu doldurup kullanıcıya verir)

```text
SETUP CHECK — <tarih>
[ ] 1.1 node      : v__.__.__   (gerekli >=22)
[ ] 1.2 npm       : __.__.__    (gerekli >=10)
[ ] 1.3 git       : __.__       (gerekli >=2.40)
[ ] 2.1 npm ci    : ok / hata: ...
[ ] 2.2 npm ls    : temiz / eksik: ... / fazla: ...
[ ] 2.3 sürümler  : tabloyla uyumlu / farklı: ...
[ ] 2.4 outdated  : yalnız beklenenler / beklenmeyen: ...
[ ] 2.5 audit     : 0 / ...
[ ] 3.1 verify    : yeşil / kırmızı adım: ...
[ ] 3.2 dev       : çalışıyor (port ____)
Eksikler ve önerilen komutlar:
- ...
```

## 5. Bağımlılık kaydı

`Aralık` sütunu `package.json`'daki değerle **birebir** aynı olmalı (test kontrol eder).
Yeni satır eklerken: paket, aralık, tür, amaç, kimin eklediği / tarih.

> **UI kit motorları (ADR-029, ADR-034):** Base UI (`@base-ui/react`) kurulu (aşağıdaki tabloda). Radix
> (`radix-ui` / `@radix-ui/*`) da serbest ama **şu an kurulu değil**; ilk ihtiyaç duyan kendi PR'ında kurar ve
> satırını buraya **o PR'da** ekler. Yalnız `src/core/ui` içinde import edilir (ESLint zorlar).

<!-- DEPS:BEGIN -->

| Paket                                    | Aralık     | Tür     | Amaç                                                                         | Ekleyen / tarih        |
| ---------------------------------------- | ---------- | ------- | ---------------------------------------------------------------------------- | ---------------------- |
| `react`                                  | `^19.3.1`  | runtime | UI kütüphanesi                                                               | Faz 0 / 2026-11-14     |
| `react-dom`                              | `^19.3.1`  | runtime | React DOM render                                                             | Faz 0 / 2026-11-14     |
| `react-router`                           | `^8.5.1`   | runtime | Sayfa yönlendirme (hash router)                                              | Faz 0 / 2026-11-14     |
| `zustand`                                | `^5.1.0`   | runtime | Global durum + persist (localStorage)                                        | Faz 0 / 2026-11-14     |
| `zod`                                    | `^4.6.7`   | runtime | Form/import veri doğrulama                                                   | Faz 0 / 2026-11-14     |
| `recharts`                               | `^3.10.1`  | runtime | Zaman serisi grafikleri                                                      | Faz 0 / 2026-11-14     |
| `framer-motion`                          | `^14.14.0` | runtime | Animasyonlar                                                                 | Faz 0 / 2026-11-14     |
| `i18next`                                | `^27.1.1`  | runtime | Çeviri altyapısı (EN/TR)                                                     | Faz 0 / 2026-11-14     |
| `react-i18next`                          | `^18.0.1`  | runtime | i18next React bağlayıcısı                                                    | Faz 0 / 2026-11-14     |
| `date-fns`                               | `^4.4.0`   | runtime | Tarih biçimlendirme                                                          | Faz 0 / 2026-11-14     |
| `lucide-react`                           | `^1.73.0`  | runtime | İkonlar                                                                      | Faz 0 / 2026-11-14     |
| `clsx`                                   | `^2.1.1`   | runtime | Koşullu CSS sınıfları                                                        | Faz 0 / 2026-11-14     |
| `vite`                                   | `^8.3.8`   | dev     | Geliştirme sunucusu + build                                                  | Faz 0 / 2026-11-14     |
| `@vitejs/plugin-react`                   | `^6.3.0`   | dev     | Vite React eklentisi                                                         | Faz 0 / 2026-11-14     |
| `typescript`                             | `~6.0.3`   | dev     | Tip kontrolü (6.0'da sabit — ADR-002)                                        | Faz 0 / 2026-11-14     |
| `@types/react`                           | `^19.3.0`  | dev     | React tipleri                                                                | Faz 0 / 2026-11-14     |
| `@types/react-dom`                       | `^19.3.0`  | dev     | React DOM tipleri                                                            | Faz 0 / 2026-11-14     |
| `@types/node`                            | `^24.19.2` | dev     | Node tipleri (config dosyaları)                                              | Faz 0 / 2026-11-14     |
| `tailwindcss`                            | `^4.3.5`   | dev     | CSS framework                                                                | Faz 0 / 2026-11-14     |
| `@tailwindcss/vite`                      | `^4.3.5`   | dev     | Tailwind Vite entegrasyonu                                                   | Faz 0 / 2026-11-14     |
| `vitest`                                 | `^5.1.0`   | dev     | Test çalıştırıcı                                                             | Faz 0 / 2026-11-14     |
| `@vitest/coverage-v8`                    | `^5.1.0`   | dev     | Test kapsam raporu                                                           | Faz 0 / 2026-11-14     |
| `jsdom`                                  | `^31.0.1`  | dev     | Testlerde tarayıcı ortamı                                                    | Faz 0 / 2026-11-14     |
| `@testing-library/react`                 | `^16.3.3`  | dev     | Bileşen testleri                                                             | Faz 0 / 2026-11-14     |
| `@testing-library/dom`                   | `^10.4.2`  | dev     | RTL peer bağımlılığı                                                         | Faz 0 / 2026-11-14     |
| `@testing-library/jest-dom`              | `^7.0.1`   | dev     | DOM eşleştiricileri (`toBeInTheDocument`)                                    | Faz 0 / 2026-11-14     |
| `@testing-library/user-event`            | `^14.6.10` | dev     | Kullanıcı etkileşimi simülasyonu                                             | Faz 0 / 2026-11-14     |
| `eslint`                                 | `^10.15.0` | dev     | Lint + modül sınırı kuralları                                                | Faz 0 / 2026-11-14     |
| `@eslint/js`                             | `^10.0.1`  | dev     | ESLint temel kurallar                                                        | Faz 0 / 2026-11-14     |
| `typescript-eslint`                      | `^8.72.2`  | dev     | TypeScript lint                                                              | Faz 0 / 2026-11-14     |
| `eslint-plugin-react-hooks`              | `^7.1.1`   | dev     | Hook kuralları                                                               | Faz 0 / 2026-11-14     |
| `eslint-plugin-react-refresh`            | `^0.5.7`   | dev     | Fast refresh uyumu                                                           | Faz 0 / 2026-11-14     |
| `eslint-config-prettier`                 | `^10.1.8`  | dev     | ESLint ↔ Prettier çakışmasını kapatır                                        | Faz 0 / 2026-11-14     |
| `globals`                                | `^17.14.0` | dev     | ESLint global tanımları                                                      | Faz 0 / 2026-11-14     |
| `prettier`                               | `^3.10.1`  | dev     | Kod biçimlendirme                                                            | Faz 0 / 2026-11-14     |
| `@base-ui/react`                         | `^1.9.0`   | runtime | Erişilebilir UI primitifleri (AlertDialog, Drawer, RadioGroup, Select, Menu) | UI Plan 1 / 2026-11-14 |
| `@fontsource/atkinson-hyperlegible-next` | `^5.3.0`   | runtime | Metin fontu (yerel, offline)                                                 | UI Plan 1 / 2026-11-14 |
| `@fontsource/jetbrains-mono`             | `^5.3.0`   | runtime | Sayı fontu (yerel, offline)                                                  | UI Plan 1 / 2026-11-14 |
| `three`                                  | `^0.187.0` | runtime | 3D vücut haritası (döndürme, yakınlaşma, şeffaf organ — ADR-038; ayrı parça) | Emir / 2026-11-15      |
| `@types/three`                           | `^0.187.0` | dev     | three tipleri                                                                | Emir / 2026-11-15      |

<!-- DEPS:END -->

## 6. Yeni bağımlılık ekleme prosedürü

1. **Önce sor:** ekip kanalına paket adı, neden gerektiği, yaklaşık boyutu ve ağ isteği yapıp yapmadığını yaz (offline-first).
2. `npm install <paket>` (dev aracıysa `npm install -D <paket>`).
3. Bu dosyada **5. Bağımlılık kaydı** tablosuna satır ekle. Aralık `package.json`'dakiyle birebir aynı olmalı.
4. Yeni bir **sistem aracı** gerekiyorsa (ör. Python, ffmpeg) bunu **1. Sistem araçları** tablosuna ekle.
5. `npm run verify`'ı çalıştır, ardından `package.json`, `package-lock.json` ve `docs/SETUP_CHECK.md`'yi **tek commit**'te gönder: `build(deps): add <paket> for <amaç>`.
6. Diğerleri pull ettikten sonra `npm ci` çalıştırır.
