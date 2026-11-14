# DECISIONS — Karar Kaydı (ADR tarzı, kısa)

Format: **Bağlam → Karar → Sonuç**. Yeni karar = yeni numara; eski kararı değiştiren karar,
eskisine "Yerine geçti: ADR-0xx" notu ekler. Sahibi belirtilmemişse karar Faz 0'da mimar
(kurulum) tarafından verilmiştir.

---

### ADR-001 — Mevcut klonlanmış repo kullanıldı (`git init` yapılmadı)

- **Bağlam:** Klasör zaten bir git reposu (`main`, "Initial commit", LICENSE) ve `origin`
  remote'u GitHub'a işaret ediyor. Talimat: "push yapma, remote ekleme".
- **Karar:** `git init -b main` yerine mevcut `main` üzerine commit atıldı. Mevcut `origin`
  **silinmedi, eklenmedi, push yapılmadı**. Feature branch'ler yerel.
- **Sonuç:** Ekip push etmeye karar verdiğinde remote hazır; o zamana kadar her şey yerel.
- **Yerine geçti:** ADR-026 (push serbest bırakıldı).

### ADR-002 — TypeScript 6.0 (7.0 değil)

- **Bağlam:** `create-vite` şablonu TS 7.0 kullanıyor; ancak `typescript-eslint@8.72` peer
  bağımlılığı `typescript <6.1`.
- **Karar:** `typescript ~6.0.3`. ESLint (no-restricted-imports + type-aware olmayan kurallar) çalışıyor.
- **Sonuç:** typescript-eslint TS 7 desteği gelince yükseltilebilir.

### ADR-003 — Güncel yığın sürümleri

Vite 8, React 19.3, React Router 8 (`react-router` paketi), Zustand 5, Zod 4, Recharts 3,
Framer Motion 14, Tailwind CSS 4 (`@tailwindcss/vite`), i18next 27 / react-i18next 18,
date-fns 4, lucide-react, Vitest 5 + RTL 16 + jsdom 31, ESLint 10 (flat config), Prettier 3.
Node 24 LTS, npm.

### ADR-004 — Modül sınırları iki katmanda zorlanır

- **Karar:** (1) ESLint `no-restricted-imports` regex desenleri, katman başına üretilir
  (`eslint.config.js > boundary()`); (2) `tsconfig.app.json > paths` modüller için sadece
  `index.ts`'i tanımlar (wildcard yok).
- **Doğrulama (Faz 0):** 3 geçici dosyada 8 ihlal denendi (yasak modül, derin import, `@app`,
  göreli `../../core`, `@test`, kendi index'ini import, core→modül, visualization→intake) —
  hepsi `error` verdi; izinli `visualization → assessment` hata vermedi. Dosyalar silindi.

### ADR-005 — Paylaşılan veri core store'da, modül-yerel durum modülde

- **Karar:** `useHealthStore` yalnız alan verisi tutar (ölçümler, mürettebat, ortam, ayarlar).
  Uyarı onayları (assessment), XP/rozet (routine) gibi durumlar modülün **kendi** persist'li
  zustand store'unda (`astrovital:<modül>` anahtarı).
- **Sonuç:** `src/core` değişikliği gerektirmeden paralel çalışma; merge çatışması azalır.

### ADR-006 — i18n: tek namespace, tipli anahtar yok, testle güvence

- **Karar:** `translation` tek namespace; config'teki anahtarlar dinamik (`metrics.${id}.label`)
  olduğundan i18next tip artırımı kullanılmadı. Bunun yerine `keys.test.ts`: (a) EN/TR anahtar
  kümeleri eşit, (b) config'te geçen her anahtar `en.json`'da var.
- **Sonuç:** Eksik çeviri CI'da (test) yakalanır.

### ADR-007 — Hash router + `base: './'` (offline-first)

- **Bağlam:** Uzay aracında sunucu yeniden yazma kuralı olmayan statik bir dosya paylaşımından
  çalışabilmeli.
- **Karar:** `createHashRouter`, Vite `base: './'`.
- **Sonuç:** `dist/` herhangi bir klasörden servis edilebilir; URL'ler `/#/crew/crew-1` biçiminde.

### ADR-008 — Tasarım token'ları CSS değişkeni, Tailwind'e `@theme inline` ile eşleme

- **Karar:** `core/ui/tokens.css` ham değerler; `index.css` `@theme inline` ile `bg-surface`,
  `text-ok/warn/crit`, `text-env` sınıflarını üretir. Ortam tonu `<html data-env>` ile değişir.
- **Sonuç:** Bileşenlerde sabit renk yok; Mühendis 4 ortam temalarını tek dosyadan yönetir.

### ADR-009 — İlk açılışta demo verisi otomatik yüklenir

- **Karar:** `DemoDataBootstrap`, uygulama **açılışında bir kez**, cihazda hiç veri yoksa
  (`measurements.length === 0 && demoLoadedAt === null`) `loadDemoData()` çağırır. Oturum
  içindeki "Tüm veriyi sıfırla" korunur; sonraki açılışta demo yeniden yüklenir.
- **Sonuç:** Jüri asla boş ekran görmez. Gerçek kullanımda bu davranış Settings'ten
  kapatılabilir hale getirilmeli (Mühendis 1, P2).

### ADR-010 — Radyasyon ölçümü = günlük doz; kariyer dozu türetilir

- **Bağlam:** Eşik tablosu kümülatif (kariyer limitinin yüzdesi), dozimetre ise günlük okunur.
- **Karar:** `Measurement.value` (radiationDose) = o günün dozu (mSv). `MetricThreshold.basis =
'cumulativeSum'`; motor `crew.priorRadiationMSv + Σ günlük doz` hesaplar.
  `CrewMember.priorRadiationMSv` (opsiyonel) sözleşmeye eklendi. SPE kuralı ham günlük doz üzerinden.

### ADR-011 — `rover` = Ay yüzeyinde basınçlı gezgin araç

- **Karar:** g = 0.16, doz = Ay yüzeyi, gecikme ~1.3 sn, tahliye ~8 sa (üsse dönüş), `limited`.
  Mars rover'ı gerekirse ayrı ortam olarak eklenir.

### ADR-012 — Uyku > 9 sa = sarı

- **Bağlam:** Spesifikasyon sadece 7–9 yeşil diyor; üst sınır tanımsız.
- **Karar:** ≥9 sa → sarı/self_care ("hastalık/yorgunluk işareti olabilir"). Mühendis 3 doğrular.

### ADR-013 — Egzersiz: tek gün kırmızı = self_care

- **Bağlam:** "Tek metrik kırmızı → CMO" kuralı, kaçırılmış tek bir antrenman için aşırı.
- **Karar:** <60 dk bandı kırmızı ama `self_care`; **3 gün üst üste** <60 dk → `sustained`
  kuralı ile CMO. Uyku <6 sa tek gün için de aynı yaklaşım (3 gün <6.5 → CMO).

### ADR-014 — Sözleşme eklemeleri ve yarı açık bantlar

- **Karar:** Spesifikasyondaki tipler korunarak eklemeler yapıldı (tam liste: CONTRACTS.md
  "Orijinal spesifikasyona yapılan eklemeler"). Bantlar `[min, max)`; bitişiklik testle zorlanır.
  `escalation: 'emergency'` bantlarda kullanılmaz — motor, otonom ortamlarda `flight_surgeon`'ı
  `emergency`'ye yükseltir.

### ADR-015 — `generateHistory`'ye `end` parametresi

- **Karar:** Saflık için "şimdi" dışarıdan verilir (`end: Date`). Store `loadDemoData({ now })`
  ile test edilebilir.

### ADR-016 — Simülasyon ölçüm sıklığı

- **Karar:** Her gün: uyanışta uyku, 07:30 vital (KB, nabız, SpO₂, solunum, ısı — aynı `groupId`),
  17:00 egzersiz, 20:30 dozimetre, 21:00 ruh hali; günlerin ~%50'sinde 19:00 akşam vitali;
  açlık glukozu **3 günde bir** (parmak ucu sarf malzemesi kısıtlı varsayımı).
- **Sonuç:** 30 gün × 4 kişi ≈ 2.000 ölçüm (localStorage için güvenli). 180 gün ≈ 12.000 ölçüm
  (~2.5 MB) — sınırda; Mühendis 1 P2'de gerekirse sıkıştırma/IndexedDB.

### ADR-017 — ISS/transit vücut ısısı kaydırması +0.3 °C

- **Karar:** Literatür ~1 °C'ye kadar artış gösterse de ateşi maskelememek için muhafazakâr
  +0.3 °C. Simülasyon da mikro-g'de +0.3 °C ekler.

### ADR-018 — Dil politikası

- **Karar:** Kod/yorum/değişken İngilizce; `docs/` ve `CLAUDE.md` dosyaları Türkçe (ekip içi);
  `README.md` İngilizce (uluslararası jüri). UI metinleri yalnız i18n anahtarı ile (EN varsayılan + TR).

### ADR-019 — CONTRACTS.md tip bloğu otomatik üretilir

- **Karar:** `npm run docs:contracts` (`scripts/sync-contracts.mjs`) `src/core/types/*.ts`'i
  CONTRACTS.md'ye birebir kopyalar; `contracts-sync.test.ts` kaymayı yakalar. CONTRACTS.md
  Prettier'dan hariç tutuldu.

### ADR-020 — Ortak test yardımcıları `@test/*`

- **Karar:** `src/test/renderWithProviders.tsx` (i18n + Toast + MemoryRouter). ESLint, `@test/*`
  importunu yalnız `__tests__` klasörlerinde serbest bırakır.

### ADR-021 — Bundle boyutu uyarısı kabul edildi (Faz 0)

- **Bağlam:** `npm run build` 711 kB (gzip 225 kB) tek chunk uyarısı veriyor (Recharts, Framer
  Motion, i18n kaynakları).
- **Karar:** Faz 0'da kabul; Mühendis 1 P2'de sayfa bazlı `React.lazy` ile bölecek. Offline
  uygulama olduğu için kritik değil.

### ADR-022 — Kaynak URL'leri henüz doğrulanmadı

- **Karar:** `SOURCES.md` ve `sources.config.ts`'teki tüm kayıtlar `verified: false` / ⏳.
  Faz 0'da internet doğrulaması yapılmadı. Mühendis 3 Faz 3'te doğrular.

### ADR-023 — README İngilizce, ekip adı/isimleri TBD

- **Karar:** TEAM.md'de mühendisler "Mühendis 1–4" olarak geçer; gerçek isimler ekip tarafından
  doldurulacak.

### ADR-024 — Mars iletişim gecikmesi [240, 1440] sn

- **Bağlam:** Spesifikasyon "~4–24 dk" diyor; NASA sayfaları genelde "3–22 dk" (gezegen
  konumuna göre) belirtir.
- **Karar:** Spesifikasyon değeri kullanıldı; Mühendis 3 `nasa-mars-comm-delay` doğrulamasında
  günceller.

### ADR-025 — Farklı bilgisayarlar arası senkronizasyon yöntemi açık

- **Karar:** Push yasak olduğundan yöntem ekipçe seçilecek (bkz. TEAM.md § Farklı bilgisayarlar):
  `git bundle` dosya paylaşımı önerilir.
- **Yerine geçti:** ADR-026 (senkronizasyon GitHub üzerinden).

### ADR-026 — GitHub'a push serbest; repo yeni adreste

- **Bağlam:** Proje sahibi push'u onayladı (Faz 0 scaffold + 4 branch push edildi). GitHub, repo
  adının `NasaHackatonTask3` → `astroVital` olarak değiştiğini bildirdi (eski adresler
  yönlendiriyor).
- **Karar:** `origin` = `https://github.com/Emir-pek/astroVital.git`. Herkes kendi
  `feat/*` branch'ine serbestçe push eder; `main`'e push yalnız `npm run verify` yeşilken; force push
  yasak. Farklı bilgisayarlar arası senkronizasyon GitHub üzerinden (TEAM.md).
- **Sonuç:** ADR-001'deki "push yok" ve ADR-025'teki `git bundle` önerisi geçersiz.
- **Yerine geçti (kısmen):** ADR-028 (`main`'e yalnız PR ile).

### ADR-027 — Ortak Claude kurulumu repoda; her değişiklik CHANGELOG'a

- **Bağlam:** Dört mühendis Claude kullanıyor. claude.ai'nin yeni Projects görünümü tek kullanıcılık,
  paylaşılamıyor; bulut oturumları repo skill'lerini, `.mcp.json`'ı ve `settings.json` plugin'lerini
  yüklemiyor. Paralel branch'lerde kimin neyi değiştirdiği kayboluyordu.
- **Karar:** `.claude/` (settings, skills, hooks) ve `.mcp.json` repoda; sahibi Emir. Kurulum tek
  komut (`scripts/setup.ps1` / `scripts/setup.sh`) — `npm ci`, git hook'ları, Claude plugin'leri,
  `doctor`. Kod/config değişikliği `CHANGELOG.md`'ye yazılır; pre-commit hook, CI `docs` job'u ve
  Claude Stop hook'u zorlar; post-merge ve SessionStart hook'ları yeni kayıtları ekibe okutur.
- **Sonuç:** Repo üzerinde yerel Claude Code kullanılır. Plugin eklenince herkes bir kez
  `npm run claude:setup` çalıştırır. Ayrıntı: `docs/CLAUDE_SETUP.md`.

### ADR-028 — `main`'e yalnız PR ile; CI yeşil olmadan merge yok

- **Bağlam:** ADR-026 `main`'e doğrudan merge + push'a izin veriyordu. 4 kişi aynı anda main'e push
  edince çakışma ve kırık main riski var (14 Kasım'da aynı dakikalarda iki ayrı push oldu).
- **Karar:** Herkes kendi `feat/*` branch'ine push eder ve **Pull Request** açar. GitHub Actions CI
  (`verify`: lint + typecheck + test + build, `docs`: CHANGELOG kontrolü) yeşil + en az 1 onay → PR
  sahibi merge eder. `main` branch koruması bunu zorlar. `src/core` PR'larında onaylayan Mühendis 1.
- **Sonuç:** ADR-026'nın "main'e doğrudan push" kısmının yerine geçer; force push yasağı aynen geçerli.
  Aynı makinede worktree akışı değişmez, yalnız main'e alma adımı PR olur.

### ADR-029 — UI kit: kendi bileşenlerimiz + gerektiğinde Base UI veya Radix (esnek)

- **Bağlam:** Modern ve tamamen kendi tasarımımız olan bir arayüz istiyoruz; tarayıcının kendi
  `<select>` vb. öğeleri açıldığında stillenemiyor; popover/tooltip/konuşma balonu gibi parçaların
  konumlandırma, klavye ve erişilebilirlik davranışını 48 saatte elle yazmak riskli. Uygulamada 6 ham
  `<select>` dağınık duruyor. Tasarım sahibi kit parçalarını kendi yapısıyla yazmaya başladı. Tasarım
  sahibi geniş yelpazede çalışabilmeli; tek kütüphaneye kilitlenmek istemiyoruz.
- **Karar:** Kit parçaları kendi bileşenlerimiz; konumlanan/odak yöneten parçalarda Base UI
  (`@base-ui/react`) veya Radix (`radix-ui` / `@radix-ui/*`) serbest. Kütüphaneler yalnız
  `src/core/ui`'da (ESLint). Paketi ilk ihtiyaç duyan kurar. Tavsiyeler: (a) bir parça = bir motor,
  envanterde "Motor" sütununa yazılır; (b) iç içe açılabilen katmanlar (modal/popover/tooltip/menü)
  mümkünse aynı kütüphaneden — odak/dış tıklama davranışı çakışmasın. Not: Base UI ve Radix ayrı
  kütüphanelerdir; Base UI, Radix/Floating UI/MUI geliştiricilerinden, aktif geliştiriliyor.
- **Sonuç:** Kit'e her mühendis katkı verebilir (açık model): genel/2+ modülde kullanılan parçalar
  src/core/ui'a, modüle özgü parçalar modülde. Çakışmayı TEAM.md 'UI kit envanteri' önler. Mimari onay
  Mühendis 1, görünüm onayı tasarım sahibi. Kütüphane seçimi parça bazında, yalnız kitin içinde olduğu
  için değiştirmek modülleri etkilemez.

### ADR-030 — Zaman modeli: UTC tabanı + ortama göre gün etiketi

- **Bağlam:** Hatırlatma, grafik ve trend hesapları "şimdi"ye bağlı. ISS'de resmî saat UTC; Ay için henüz
  resmî saat yok (Coordinated Lunar Time strateji çalışması 2026 sonuna kadar), pratikte UTC; Mars'ta gün
  (sol) 24 sa 39 dk 35.244 sn ve Mars saatine göre çalışan NASA ekiplerinde vücut saati kaymasının uyku ve
  ruh halini etkilediği gözlenmiş.
- **Karar:** Tüm hesaplar UTC. Görev saati gösterimi ortama göre etiketlenir: Mars üssünde "Sol N"
  (gerçek sol uzunluğuyla hesaplanır), diğer ortamlarda "Görev günü N". Hatırlatma takvimi her ortamda
  UTC. Saati ileri sarma / geliştirici arayüzü yok; zaman mantığı `now`'ı parametre alan saf
  fonksiyonlarla test edilir. Bileşenler güncel zamanı ortak `useNow()` hook'undan alır. Sahip: Mühendis 1.
- **Sonuç:** EnvironmentProfile'a opsiyonel `dayLengthSec`/`dayLabelKey` eklendi (kırılma yok). Gerçek sol
  zamanına göre kayan takvim "sonra" kapsamında; sunumda gelecek adım olarak anılabilir.

### ADR-031 — Durum dört seviyeli: nominal / advisory / caution / warning

- **Bağlam:** UI tasarım belgesi NASA-STD-3001 Ek F (F.6.4.1–3) renk kodunu zorunlu kılıyor:
  warning = kırmızı, caution = sarı, advisory = mavi; normal = nane yeşili.
- **Karar:** `Status` = `'nominal' | 'advisory' | 'caution' | 'warning'`. Eski değerlerin karşılığı:
  green → nominal, yellow → caution, red → warning. `advisory` yeni; değerlendirme motoru henüz
  üretmiyor (Mühendis 3'e görev).
- **Sonuç:** `src/core/types`, eşik tablosu, i18n (`status.*`) ve tüm modüller yeni adları kullanır.

### ADR-032 — Arayüzün tamamı tek tasarım belgesine göre; sahibi visualization ekibi

- **Bağlam:** `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` (onaylı). Proje sahibinin
  kararı (14.11.2026): repodaki eski arayüz geçersiz, her şey belgeye göre yenilenir.
- **Karar:** `src/core/ui`, `src/app` (kabuk, rotalar, sayfalar) ve intake/routine ekranlarının
  **görünümü** visualization ekibindedir; modüllerin mantığı sahiplerinde kalır. Tüm dokunma
  hedefleri ≥ 104 px (`min-h-touch`), metin ≥ 16 px, fontlar yerel (`@fontsource`).
  Eski renk takma adları (`text-ok/warn/crit`, `bg-surface-2`, `text-muted`, `border-border`)
  geçicidir ve Plan 3'te kaldırılır; yeni kodda kullanılmaz.
- **Sonuç:** Rotalar değişti (CONTRACTS.md § Rotalar). Ekip sayfası tıbbi değer/durum göstermez.

### ADR-033 — Davranış katmanı Radix yerine Base UI

- **Bağlam:** Ekip kararı (14.11.2026). Ana senaryo eldivenli tablet.
- **Karar:** `radix-ui` kaldırıldı, `@base-ui/react` eklendi. `RedAlertDialog` → `AlertDialog`,
  `Sheet` → `Drawer` (sağa kaydırarak kapanır), `Segmented` → `RadioGroup`, ortam seçici → `Select`,
  astronot menüsü → `Menu`. Gerekçe: dokunmatik iyileştirmeleri, kaydırarak kapanan Drawer,
  shadcn varsayılanı. Bedel: 3 bileşen yeniden yazıldı; prop imzaları değişmedi.
- **Sonuç:** ~~`src/test/no-radix.test.ts` (U-12) Radix import'unun geri gelmesini engeller.~~ (Radix yasağı
  ADR-034 ile kaldırıldı.) Base UI
  yalnız davranış katmanıdır; görünüm tamamen `tokens.css`. `Select`'i `Drawer`/`Dialog` içine koyma.

### ADR-034 — Base UI ve Radix birlikte kullanılabilir (ADR-033'teki Radix yasağı kalkar)

- **Bağlam:** ADR-029 kit motorunu esnek bırakıyordu (Base UI veya Radix); ADR-033 mevcut bileşenleri
  Base UI'a taşırken `no-radix` testiyle Radix'i tamamen yasakladı. İki karar çelişiyordu.
- **Karar:** ADR-029 geçerli: `src/core/ui` içinde Base UI (`@base-ui/react`) **ve** Radix
  (`radix-ui` / `@radix-ui/*`) birlikte kullanılabilir; seçim parça bazında, TEAM.md "UI kit envanteri"
  "Motor" sütununa yazılır. Varsayılan Base UI (mevcut parçalar onda kalır); Radix'te daha iyi bir
  primitif varsa o parça için Radix seçilebilir. İç içe açılan katmanlar mümkünse aynı motordan.
- **Sonuç:** `no-radix.test.ts` kaldırıldı; yerine `headless-ui-boundary.test.ts` (U-12) iki kütüphanenin
  de yalnız `src/core/ui` içinde import edildiğini kontrol ediyor (ESLint de zorluyor). Radix şu an kurulu
  değil; ilk ihtiyaç duyan kendi PR'ında kurar ve SETUP_CHECK § 5'e ekler. Sahip: Mühendis 1.
