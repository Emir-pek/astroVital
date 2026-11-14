# CHANGELOG — Ekip değişiklik günlüğü

Kod/config'e dokunan **her değişiklik** burada kayda girer, **en yeni en üstte**. `git pull`'dan sonra
yeni kayıtlar terminale otomatik basılır (post-merge hook) ve her Claude Code oturumu son kayıtları
okuyarak başlar (SessionStart hook).

Format (`document-change` skill'i, pre-commit hook'u ve CI zorlar):

```markdown
### YYYY-MM-DD HH:MM — Yazar (branch) — Kısa başlık

- **Ne:** kullanıcıya görünen etki önce
- **Neden:** gerekçe / karar
- **Dosyalar:** `yol/a`, `yol/b`
- **Ekip ne yapmalı:** hiçbir şey | npm ci | setup'ı tekrar çalıştır | /reload-plugins | ...
```

Not gerektirmeyen önemsiz düzeltme: `SKIP_DOCS=1 git commit ...` veya PR başlığına `[skip-docs]`.
Yalnız `docs/` değişiklikleri kayıt gerektirmez.

<!-- NEW ENTRIES BELOW -->

### 2026-11-14 21:30 — Emir (main) — Dört feat/* branch'i main'e fast-forward edildi; skill/kural erişimi netleştirildi

- **Ne:** `feat/assessment`, `feat/core-routine`, `feat/intake`, `feat/visualization` branch'leri main'in ucuna
  (PR #9 dahil) fast-forward edildi. Hiçbiri main'den ayrışan commit taşımıyordu (hepsi main'in öncülü), bu yüzden
  merge değil, doğrudan işaretçi ilerletme yapıldı — hiçbir iş kaybolmadı, çakışma çıkmadı, force push yok.
  Ayrıca ekip Claude kurulumunun kapsamı netleştirildi (bkz. `docs/CLAUDE_SETUP.md` tablosu): **yerel** Claude
  Code (terminal / masaüstü Code sekmesi / VS Code), bu repoda, `git pull` sonrası skill'leri canlı (yeniden
  başlatmadan), `CLAUDE.md` + `.claude/rules/*.md`'yi ise **yeni oturumda** okur — açık bir oturum `/clear`
  ile yenilenmeden eski kuralı kullanmaya devam eder. **Bulut** oturumları (claude.ai/code, Projects thread'leri)
  kök `CLAUDE.md` ve kök `.claude/rules/*.md`'yi okur ama repo skill'lerini, `.mcp.json`'ı ve
  `.claude/settings.json` plugin'lerini **hiç yüklemez** — bu Claude Code'un kendi sınırı, repo ayarıyla aşılamıyor.
- **Neden:** Branch'ler main'in gerisinde kalmıştı; ileride her yeni PR'da çakışma riski oluşturuyordu. Ekip
  arkadaşlarının hangi ortamda hangi aracın gerçekten çalıştığını bilmesi gerekiyor.
- **Dosyalar:** (yalnız bu kayıt) `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git fetch origin` sonra `git reset --hard origin/<branch-adın>`
  (yerelde bu PR'dan sonra kendi commit'in yoksa güvenli; varsa önce `git branch backup-<tarih>` ile yedek al).
  Üzerinde çalışırken **yerel** Claude Code kullan (bu repo klasöründe `claude`); bulut/Projects yalnız
  `CLAUDE.md` ve `.claude/rules/`'ı görür, skill çalıştıramaz. Açık bir Claude oturumun varsa yeni kural
  dosyalarını görmesi için `/clear` yap veya yeniden başlat.

### 2026-11-14 21:00 — Emir (docs/ai-brief-adimlar) — AI beyanı, iletişim kuralları, ADIMLAR ve proje özeti repoya eklendi

- **Ne:** `AI.md` (jüri için İngilizce yapay zekâ kullanım beyanı — Space Apps kuralı: AI'nin nerede/nasıl
  kullanıldığı belirtilir, AI görsel/videoya filigran, NASA markası kullanılmaz); `.claude/rules/ai-collaboration.md`
  (Claude'un ekiple konuşma biçimi: önce anla, soru sor, övme, Ne → Neden → Nasıl, trade-off — her oturumda
  otomatik yüklenir); `docs/ADIMLAR.md` (projeyi gündelik dille, örneklerle anlatan rehber);
  `docs/PROJECT_BRIEF.md` (claude.ai proje talimatı + KAYNAKLAR.md'nin repodaki karşılığı). `docs/SETUP_CHECK.md`
  § 1'e Claude Code ve GitHub CLI (isteğe bağlı) eklendi. `CLAUDE.md`, README, `document-change` skill'i ve
  `docs/CLAUDE_SETUP.md` bu dosyalara bağlandı. YAPILANLAR = `CHANGELOG.md` (ayrı dosya açılmadı).
- **Neden:** Ekip arkadaşının istediği dosya seti (CLAUDE / ADIMLAR / YAPILANLAR / SETUP_CHECK / AI) ve
  Space Apps teslim rehberindeki "Use of Artificial Intelligence" kuralı; yerel ve bulut Claude'un claude.ai
  proje talimatına erişememesi.
- **Dosyalar:** `AI.md`, `.claude/rules/ai-collaboration.md`, `docs/ADIMLAR.md`, `docs/PROJECT_BRIEF.md`,
  `docs/SETUP_CHECK.md`, `CLAUDE.md`, `README.md`, `.claude/skills/document-change/SKILL.md`,
  `docs/CLAUDE_SETUP.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** `git merge origin/main`; açık Claude oturumunda yeni oturum başlat (`/clear`) ki yeni
  kural dosyası yüklensin. AI ile yeni bir şey ürettiysen (görsel, video, araç) `AI.md`'yi güncelle.

### 2026-11-14 20:00 — Muhammed Bektaş (feat/core-routine) — Hatırlatma takvimi üç katmanlı (günlük/haftalık/aylık), NASA/CSA kaynaklı

- **Ne:** Takvim günlük / haftalık / aylık katmanlara ayrıldı: sabah SpO₂ eklendi, egzersiz haftada 6 gün, açlık şekeri
  haftalık; yeni haftalık sağlık özeti, aylık tam muayene ve aylık uyku/ekip anketi. Her madde `sourceIds` ile 9 yeni
  NASA/CSA kaynağına bağlı. `ReminderTemplate`'e `'monthly'` ve opsiyonel `restEveryNDays`/`anchorDay`/`sourceIds`;
  yeni saf fonksiyon `isScheduledOn(template, missionDay)` (`@core/utils`). Demo verisi takvimle aynı kuralı izliyor.
  Saatler değişmedi.
- **Neden:** Faz 0 takvimi kaynaksız bir örnekti; sıklıklar artık ISS pratiğine dayanıyor (ADR-035).
- **Dosyalar:** `src/core/types/routine.ts`, `src/core/utils/routineSchedule.ts`, `src/core/utils/staleness.ts`,
  `src/core/utils/index.ts`, `src/core/config/environments.config.ts`, `src/core/config/sources.config.ts`,
  `src/core/simulation/generator.ts`, `src/core/i18n/en.json`, `src/core/i18n/tr.json`, testler, `docs/ROUTINE_SCHEDULE.md` (yeni),
  `docs/SOURCES.md`, `docs/DECISIONS.md`, `docs/CONTRACTS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** git merge origin/main. ReminderTemplate'e opsiyonel alanlar eklendi (kırılma yok). Mühendis 3:
  sources.config.ts/SOURCES.md'ye takvim kaynakları eklendi, gözden geçir. Demo verisinde şeker artık haftalık, egzersizde 7. gün dinlenme.

### 2026-11-14 19:00 — Muhammed Bektaş (feat/core-routine) — Base UI ve Radix birlikte kullanılabilir (Radix yasağı kalktı)

- **Ne:** `src/test/no-radix.test.ts` kaldırıldı; yerine `src/test/headless-ui-boundary.test.ts` (U-12) geldi: Base UI
  ve Radix'in ikisi de serbest, yalnız `src/core/ui` dışında import edilirse test kırılır (ESLint kuralı zaten aynı).
  Yeni ADR-034; ADR-033'ün Radix yasağı kaldırıldı. Mevcut parçalar Base UI'da kalır, yeni paket kurulmadı.
- **Neden:** ADR-029 (esnek motor) ile ADR-033 + `no-radix` testi çelişiyordu; ekip kararı ADR-029 yönünde.
- **Dosyalar:** `src/test/no-radix.test.ts` (silindi), `src/test/headless-ui-boundary.test.ts`, `docs/DECISIONS.md`,
  `CLAUDE.md`, `src/core/CLAUDE.md`, `docs/SETUP_CHECK.md`, `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md`,
  `docs/superpowers/specs/2026-11-14-astrovital-ui-test-plan.md`, `docs/TEAM.md` (UI kit envanteri PR #7 parçalarıyla
  güncellendi: ArcGauge, ValueCard, AlertStrip, RedAlertDialog, Sheet, Segmented, Menu, Select), `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git merge origin/main`. Kit parçası yazarken Base UI varsayılan; Radix'te daha iyi
  bir primitif varsa o parça için kullanabilirsin (önce `npm install radix-ui` + SETUP_CHECK § 5 satırı, aynı PR'da). Motoru
  TEAM.md "UI kit envanteri"ne yaz.

### 2026-11-14 18:35 — Emir (feat/visualization) — PR #7 main ile birleştirildi, lint hataları ve ADR numaraları düzeltildi

- **Ne:** `main` branch'e alındı (çakışma yok). Lint hataları giderildi: `CrewPicker` ve `EnvironmentPicker`
  Base UI'ı doğrudan import ediyordu → `src/core/ui/Menu.tsx` artık Base UI `Menu`'nün kit sarmalayıcısı
  (önceki sürüm açılıp kapanmayan bir taslaktı), yeni `src/core/ui/Select.tsx`; ikisi `@core/ui`'dan alınıyor
  ve testli. `MetClock`: kullanılmayan `met` değeri, bileşen yorumunda yazdığı gibi tooltip'e (`title`) bağlandı.
  Çakışan ADR numaraları: visualization'ın ADR-029/030/031'i → **ADR-031/032/033** (main'deki ADR-029 UI kit,
  ADR-030 zaman modeli aynen kaldı).
- **Neden:** PR #7'nin `verify` kontrolü kırmızıydı (3 lint hatası) ve iki branch aynı ADR numaralarını kullanıyordu.
- **Dosyalar:** `src/core/ui/Menu.tsx`, `src/core/ui/Select.tsx`, `src/core/ui/index.ts`,
  `src/core/ui/__tests__/MenuSelect.test.tsx`, `src/app/layout/CrewPicker.tsx`, `src/app/layout/EnvironmentPicker.tsx`,
  `src/modules/routine/components/MetClock.tsx`, `docs/DECISIONS.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** `npm ci`. Base UI parçası gerekiyorsa `@core/ui`'dan al (`Menu`, `Select`). **Karar
  bekliyor:** ADR-029 "Base UI veya Radix serbest" derken ADR-033 ve `no-radix` testi Radix'i yasaklıyor —
  ekip hangisinin geçerli olduğunu netleştirmeli.

### 2026-11-14 16:45 — Visualization Ekibi (feat/visualization) — AstroVital UI Plan 1: Dört seviyeli durum, Base UI bileşenleri, eldiven dostu kabuk ve Durum ekranı

- **Ne:** NASA-STD-3001 Ek F uyumlu 4 seviyeli durum (`nominal` / `advisory` / `caution` / `warning`), yerel fontlar (`@fontsource/atkinson-hyperlegible-next`, `@fontsource/jetbrains-mono`), `@base-ui/react` tabanlı `AlertStrip`, `RedAlertDialog`, `Sheet`, `Segmented`, `ArcGauge`, `ValueCard` bileşenleri, 5 sekmeli eldiven dostu `AppShell` (≥ 104 px dokunma hedefleri), katmanlı astronot figürü (`SuitArt`), bölge detay çekmecesi ve Vital kartlarıyla yeni Durum (`/`) ekranı eklendi.
- **Neden:** Onaylı AstroVital UI tasarım spesifikasyonu (`docs/superpowers/specs/2026-11-14-astrovital-ui-design.md`) ve ADR-031..033 kararlarının uygulanması.
- **Dosyalar:** `src/core/ui/`, `src/core/types/assessment.ts`, `src/core/config/thresholds.config.ts`, `src/core/utils/`, `src/core/i18n/`, `src/app/`, `src/modules/visualization/`, `package.json`, `docs/DECISIONS.md`, `docs/CONTRACTS.md`, `docs/SETUP_CHECK.md`
- **Ekip ne yapmalı:** `npm ci` (yeni `@base-ui/react` ve `@fontsource/*` paketleri için). `Status` tipi artık `'nominal' | 'advisory' | 'caution' | 'warning'` değerlerini alır (ADR-029).

### 2026-11-14 16:35 — Muhammed Bektaş (feat/core-time-model) — Zaman modeli: UTC + ortama göre gün etiketi (Mars'ta Sol)

- **Ne:** Görev saati artık "Day 12 · 04:33:10" biçiminde; Mars üssünde gerçek sol uzunluğuyla "Sol 12 · …" gösteriyor
  (tam MET ipucu olarak duruyor). Yeni ortak hook `useNow()` (`@core/hooks`, tek paylaşılan zamanlayıcı); yeni saf
  fonksiyonlar `missionDayFor`, `formatTimeInDay`. `EnvironmentProfile`'a opsiyonel `dayLengthSec` / `dayLabelKey`.
- **Neden:** Tüm hesaplar UTC; yalnız gösterim ortama göre etiketlenir. Saati ileri sarma/geliştirici arayüzü yok,
  zaman mantığı `now` parametresiyle test edilir (ADR-030).
- **Dosyalar:** `src/core/types/environment.ts`, `src/core/config/environments.config.ts`, `src/core/utils/time.ts`,
  `src/core/hooks/`, `src/modules/routine/components/MetClock.tsx`, `src/core/i18n/en.json`, `src/core/i18n/tr.json`, testler,
  `docs/DECISIONS.md`, `docs/CONTRACTS.md`, `src/core/CLAUDE.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git merge origin/main`. Bileşende güncel zaman gerekiyorsa `new Date()` yerine `@core`'dan `useNow()` kullan; zaman hesaplayan fonksiyonlarına `now`'ı parametre olarak ver. EnvironmentProfile'a opsiyonel `dayLengthSec`/`dayLabelKey` eklendi (kırılma yok).

### 2026-11-14 16:25 — Muhammed Bektaş (feat/core-routine) — Mimari kural: paylaşılan veri dosyalarının yeri

- **Ne:** Yeni kural: tek modülün kullandığı veri dosyası (ör. gömülü uzay ajansı verisi) o modülde kalır; birden fazla modül
  veya `core/simulation` kullanacaksa `src/core/config/` altına konur (içerik sahibi veriyi getiren, merge onayı Mühendis 1).
- **Neden:** Modüller core'dan okuyabilir, core hiçbir modülden okuyamaz (ESLint) — paylaşılan veri modülde kalırsa diğerleri erişemez.
- **Dosyalar:** `CLAUDE.md`, `src/core/CLAUDE.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Hiçbir şey; yeni bir veri dosyası eklerken bu kurala göre yer seç.

### 2026-11-14 15:22 — Muhammed Bektaş (feat/core-routine) — UI kit kuralları: açık katkı modeli + Base UI/Radix yalnız core/ui'da

- **Ne:** UI kit (`src/core/ui`) açık katkı modeline geçti: genel/2+ modülde kullanılacak parçaları her
  mühendis ekleyebilir, önce `docs/TEAM.md` "UI kit envanteri"ne adını ve motorunu yazar (yeni "Motor"
  sütunu). Konumlanan/odak yöneten parçalarda Base UI veya Radix serbest; ESLint `@base-ui/react`,
  `radix-ui` ve `@radix-ui/*` importunu `src/core/ui/**` dışında hata olarak işaretliyor. Yeni paket kurulmadı.
- **Neden:** Tasarım sahibini tek kütüphaneye kilitlememek; kütüphaneler kitin içinde kaldığı için seçim
  parça bazında değişebilir ve modülleri etkilemez (ADR-029).
- **Dosyalar:** `eslint.config.js`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/TEAM.md`,
  `docs/SETUP_CHECK.md`, `src/core/CLAUDE.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi branch'inde `git merge origin/main`. Genel arayüz parçası gerekiyorsa src/core/ui'a ekle; önce docs/TEAM.md 'UI kit envanteri'ne adını ve motorunu (kendi/Base UI/Radix) yaz. Base UI veya Radix gerekiyorsa paketi kendi PR'ında kur; yalnız src/core/ui içinde import et (lint zorlar).

### 2026-11-14 15:25 — Emir (chore/changelog-union) — CHANGELOG çakışmaları yerel merge'te otomatik çözülür

- **Ne:** `.gitattributes`'a `CHANGELOG.md merge=union` eklendi: kendi branch'inde `git merge origin/main`
  yaptığında iki taraftaki CHANGELOG kayıtları otomatik birleşir, çakışma çıkmaz.
- **Neden:** Paralel PR'lar kaydı hep aynı yere (en üst) eklediği için her seferinde çakışıyordu (PR #2).
- **Dosyalar:** `.gitattributes`, `docs/TEAM.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Hiçbir şey. Bu kuralı içeren main'i branch'ine aldığın **ilk** merge'te bir kez daha
  çakışma çıkabilir (iki kaydı da tut); sonrakiler otomatik. GitHub web arayüzündeki "Resolve conflicts" bu
  kuralı kullanmaz — merge'ü yerelde yap.

### 2026-11-14 15:00 — Emir (docs/team-onboarding) — README'ye adım adım ekip kurulumu

- **Ne:** README'ye "Team onboarding (step by step)" bölümü: araç kurulumu → klonlama → setup → verify →
  uygulamayı çalıştırma → Claude Code trust + MCP/plugin/skill/hook doğrulama → dokümantasyon
  kontrolü denemesi → günlük akış; her adımda beklenen çıktı ve sonda kontrol listesi.
- **Neden:** Her ekip üyesinin kurulumunu kendi başına yapıp doğru çalıştığından emin olabilmesi.
- **Dosyalar:** `README.md`, `docs/TEAM.md`
- **Ekip ne yapmalı:** README › Team onboarding'i baştan sona uygula ve kontrol listesini tamamla.

### 2026-11-14 13:30 — Emir (main) — Ekip altyapısı: tek komut kurulum, dokümantasyon zorunluluğu, ortak Claude araçları

- **Ne:** Tek komutla kurulum (`scripts/setup.ps1` / `scripts/setup.sh`) ve otomatik kontrol (`npm run doctor`);
  her değişikliğin bu dosyaya yazılmasını zorlayan pre-commit hook + CI + Claude Stop hook'u; `git pull`
  sonrası değişiklik özeti; repoda paylaşılan Claude Code ayarları (plugin'ler, MCP sunucuları, skill'ler,
  hook'lar); GitHub Actions CI (`npm run verify`); PR şablonu; Codespaces dev container. Git akışı PR tabanlı
  oldu: `main`'e doğrudan push yerine PR + yeşil CI + 1 onay.
- **Neden:** Dört mühendisin aynı ortamı ve aynı Claude araçlarını tek adımda alması; birinin yaptığı her
  değişikliğin diğerleri tarafından okunabilmesi (ADR-027, ADR-028).
- **Dosyalar:** `.claude/`, `.mcp.json`, `.githooks/`, `.github/`, `.devcontainer/`, `scripts/setup.*`,
  `scripts/doctor.mjs`, `scripts/docs-check.mjs`, `scripts/claude-setup.mjs`, `package.json` (yalnız script'ler),
  `CHANGELOG.md`, `docs/CLAUDE_SETUP.md`, `README.md`, `CLAUDE.md`, `docs/TEAM.md`, `docs/SETUP_CHECK.md`,
  `docs/DECISIONS.md`, `.gitignore`, `.env.example`, `.vscode/extensions.json`
- **Ekip ne yapmalı:** `git pull` (kendi `feat/*` branch'inde `git merge origin/main`), sonra bir kez kurulum
  script'ini çalıştır (README › Quick start) ve repo klasöründe `claude` açıp trust sorusuna evet de.
