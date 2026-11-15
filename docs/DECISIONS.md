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

> **Güncellendi: ADR-052** — davranış `settings.autoLoadDemo` ile kapatılabilir (varsayılan açık).

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

> **Kısmen yerine geçti: ADR-035** (şeker sıklığı haftalık, egzersizde 7. gün dinlenme).
> **Kısmen yerine geçti: ADR-047** (ölçüm saatleri).
> **Kısmen yerine geçti: ADR-048** (akşam vitali kuralı, ölçüm içeriği = takvim).

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

### ADR-035 — Hatırlatma takvimi üç katmanlı (günlük/haftalık/aylık), NASA/CSA pratiğine dayalı

- **Bağlam:** Faz 0 takvimi (`CORE_ROUTINE`) örnek bir şablondu, kaynaksızdı; sıklıklar (ör. şeker
  "haftalık", simülasyonda "3 günde bir") birbiriyle de tutarsızdı.
- **Karar:** Takvim üç katman: **günlük** (uyku, sabah tansiyon/nabız/SpO₂/ısı, egzersiz haftada 6 gün,
  dozimetre, akşam ruh hali), **haftalık** (açlık şekeri, haftalık sağlık özeti), **aylık** (tam muayene,
  uyku/ekip anketi). `ReminderTemplate` geriye uyumlu genişledi: `repeat`'e `'monthly'`, opsiyonel
  `restEveryNDays`, `anchorDay` (haftalık = 7, aylık = 30 görev günü) ve `sourceIds`. Gün kuralı saf
  `isScheduledOn(template, missionDay)` (`@core/utils`). Dayanaklar `sources.config.ts`/`SOURCES.md`'ye
  eklendi; tablo ve gerekçe `docs/ROUTINE_SCHEDULE.md`. Sahip: Mühendis 1.
- **Sonuç:** Saatler (`timeOfDayMET`), ortama göre farklar ve görevin zaman penceresi ayrı kararlar.
  Simülasyon takvimle hizalandı (aynı `isScheduledOn`): 30 gün × 4 kişi 1.484 → 1.452 ölçüm. ADR-016'nın
  şeker sıklığı ve egzersiz kısmının yerine geçer. Bayatlık için `REPEAT_INTERVAL_MS.monthly` = 30 gün.

### ADR-036 — Durum ekranı tek ekran: figürün yanında etiketler, sessiz nominal, tek renkli mini gösterge

- **Bağlam:** Durum ekranı denetimi (14.11.2026): 1180×820'de sayfa ≈ 3,25 ekran boyu kayıyordu; üst
  çubuk iki satıra kırılıp 248 px oluyordu; figür ekranın ≈ %11'iydi; bölgeler görünmez ızgara kutularıyla
  (hit area) ve figürün altındaki çiplerle seçiliyordu (hangi kutunun hangi organ olduğu görünmüyordu);
  her nominal bölge ayrı ayrı nefes alıp parlıyordu (uyarı olan bölge kalabalıkta kayboluyordu);
  ArcGauge'un renkli bantları, değer hangi bantta olursa olsun ekranı "kırmızı/sarı dolu" gösteriyordu.
- **Karar:**
  1. **Tek ekran düzeni:** üst çubuk tek satır (ortam seçicide kısa ad `topbar.envShort.*`), feragat
     tam genişlikte sabit alt satır, sayfa kendi içinde kayar. Her şey normalken uyarı şeridi yerine
     PageHeader satırında tek satırlık durum hattı (`StatusLine` / `AlertSummary`); uyarı varsa şerit
     üst çubuğun altında kendi satırında — **Durum sayfası hariç:** orada şerit sağ sütunda, değer
     rayının üstünde dikey kart (`AlertPanel`, `AlertStrip layout="stacked"`, kenarı en ağır uyarının
     renginde); ray kalan yükseklikte kendi içinde kayar. Böylece ekranın en önemli olduğu anda (uyarı
     varken) figür ve 10 etiket kaydırmadan görünür. Durum sayfasında alt başlık yok.
  2. **Bölge etiketleri figürün yanında (çip yerine):** 10 görünür etiket, her yanda 5 (152×104 px,
     aralık ≥ 16 px), koyu yüzey + renk + ikon + metin; etiketten organa ince bir kılavuz çizgi. Görünmez
     hit area'lar kaldırıldı — dokunulacak şey görünen şeydir. Yerleşim saf fonksiyon
     (`computeBodyMapLayout`), testli (çakışma yok, çizgiler kesişmez, ≥ 104 px).
  3. **Nominal sessiz:** figürde nominal/eski/veri yok bölgeler hiçbir şey çizmez; yalnız
     advisory/caution/warning bölgeleri siluete kırpılmış durum dolgusu + koyu kontur (≥ 3:1) ve kılavuz
     çizgide küçük bir durum simgesi alır. Nefes yalnız tüm vücut halesinde (nominalken, 4,5 sn) ve
     `prefers-reduced-motion`'da kapalı. Seçim: diğerleri soluklaşır, seçilen kılavuz çizgisi accent
     rengi; çerçeve halkası yok. Damarlar (kan) çizgi değil, kollar/bacaklar boyunca dolgulu, sivrilen
     şeritlerdir (≥ 6 px) — kılavuz çizgileriyle karışmaz. Hale bulanık leke değil, siluetin dışında koyu
     bir boşlukla ayrılmış ince kontur. Bölge paneli Durum ekranında yalnız sağ sütunu örter (`Sheet`
     `width` + `backdrop="clear"`), figür ve etiketler panel açıkken görünür kalır.
  4. **Mini yay gösterge:** 96×44, nötr iz; yalnız değerin bulunduğu bant durum rengiyle boyanır.
     Değerler sağda kompakt bir rayda (`VitalRow`, 6 satır × ≈ 88–90 px), nominal olmayanlar en üstte.
  5. **Figür yeniden çizildi (14.11.2026, ikinci adım):** eski çizim donuk, ayna simetrik bir mankendi
     (tek yatay gradient, kask fazla büyük, üç zemin gölgesi). Yeni çizim gerçek ¾ duruş (sırt çantası
     solda görünür, ağırlık bir bacakta, diğer ayak önde, kollar farklı), her parçanın kendi konturunu
     izleyen tek yönlü ışık (sol üst) + sağda soğuk kenar ışığı, tek zemin gölgesi, ≈ 7,3 kask boyu ve
     ölçülü EVA detayı; hâlâ mat beyaz, ciddi, sevimli değil. viewBox `182 8 226 512`; çapalar yeni
     anatomiye taşındı (testli: `figureGeometry.test.ts`).
- **Sonuç:** 1180×820'de nominal **ve uyarı varken** dikey kaydırma yok; bölge paneli açıkken de 10
  etiket görünür. 1366×768'de sayfa içinde ≈ 48–52 px kayma var (en alttaki iki etiket feragat satırının
  arkasında kısmen kalır). Figür 1180'de ≈ 258 × 584 px. `RegionChips`,
  `hitAreas` silindi; yeni kit parçaları `VitalRow`, `StatusLine`; ArcGauge'a opsiyonel `status` prop'u;
  `AlertStrip`'e `layout`, `Sheet`'e `width` ve `backdrop`; visualization'a `AlertPanel`; yeni token
  `--av-suit-rim`.
  Spec §5.4/§5.5/§6/§7.1/§8/§9 güncellendi. Spec §5.5'teki "her nominal bölge nefes alır" kuralının
  yerine geçer. Sahip: visualization ekibi.

### ADR-037 — Kutu sistemi: Panel / Tile / Pill, token'lı ve testle korunur; Durum'da bölge paneli modal değil

- **Bağlam:** Kutu denetimi (15.11.2026): iki köşe sistemi yan yanaydı (kit 24/20/999 px, eski kod
  `rounded-lg`/`rounded-md` 8/6 px); aynı roldeki kutular farklı boşluk kullanıyordu (`Card` 24, `ValueCard`
  16, `Modal` 20, satırlar 12/16 px); `card-surface` yalnız iki bileşendeydi, `Modal` gölgesizdi ve yasak
  `border-border` kullanıyordu, `Toast` `shadow-xl` + `bg-surface-2`; Ayarlar'da 12–14 px yazı ve ≈ 44 px
  hedefler vardı. Ölçüm/Rutin/Ayarlar başka bir ürün gibi görünüyordu. Ayrıca Durum ekranındaki bölge paneli
  tam pencere yüksekliğindeydi ve üst barı (Acil düğmesinin yarısı, dil ve astronot seçicileri) örtüyordu;
  şeffaf arka plan yine de modal bir katmandı (Acil'e ilk dokunuş yalnız paneli kapatıyordu).
- **Karar:**
  1. **Üç rol:** Panel (üst düzey kap: `card-surface`, 24 px köşe, 24 px boşluk, `shadow-soft`), Tile/Satır
     (panel içi kutu veya liste öğesi: `raised`, 20 px köşe, 16 px boşluk, gölgesiz), Pill (rozet/çip/durum
     hattı: tam yuvarlak). Token'lar `tokens.css`'te (`--av-radius-panel/tile/pill`, `--av-pad-panel/tile`,
     `--av-gap-section`), Tailwind'e `rounded-panel/tile/pill`, `p-panel/p-tile`, `gap-section` olarak bağlı.
     `--av-radius-card` / `rounded-card` eski takma ad.
  2. **İfade biçimi:** bileşenler (`Card` = Panel, yeni `Tile`) + bileşenin saramadığı yerler için tek kaynak
     tarifler (`BOX`, `src/core/ui/box.ts`; Base UI popup'ları, tile görünümlü `<button>`). Rol başka bir
     köşe/boşluk/gölge sınıfıyla karıştırılmaz.
  3. **Koruma:** `boxSystem.test.ts` tüm `src`'yi tarar; stok yarıçap, `rounded-card`, stok yazı boyu, stok
     gölge ve eski renk takma adı bulursa kırmızıdır. Diğer modüllerin henüz taşınmamış dosyaları
     `PENDING_MIGRATION` listesinde; liste yalnız küçülür (temizlenen dosya listede kalırsa test kırmızı).
  4. **Bölge paneli (Durum):** `Sheet`'e `bounds` (üst/alt/sağ mesafe) eklendi; Durum sayfası paneli sağ
     sütunun kutusuna oturtur (üst barın ve sayfa başlığının altında, feragatın üstünde). `backdrop="clear"`
     artık **modal değildir** (arka plan katmanı yok, odak hapsedilmez, dışarı dokunuş kapatmaz): sayfa
     görünür **ve** kullanılabilir — başka etiket paneli geçirir, aynı etiket kapatır, Acil doğrudan çalışır.
     `dim` (varsayılan) modal kalır; diğer çağıranlar için varsayılanlar değişmedi.
- **Sonuç:** 1180×820'de tüm rotalarda (EN/TR) kabuk, kit ve visualization alanlarında en küçük yazı 16 px,
  en küçük hedef 104 px; bölge paneli üst kenarı 183 px (üst bar 128 px'de biter), alt kenarı 767 px
  (feragat 779 px'de başlar). Satır uyarı şeridi ≈ 128 → ≈ 156 px oldu (panel boşluğu); Durum sayfası yine
  kaydırmasız (`main` üst boşluğu 4 → 0 px). Ölçüm/Rutin/Değerlendirme içleri sahiplerince taşınacak
  (CHANGELOG 15.11.2026). ADR-036 karar 3'teki "panel sayfayı karartmaz, dışarı dokunmak kapatır" ifadesinin
  yerine geçer. Sahip: visualization ekibi (tasarım), Mühendis 1 (kit mimari onayı).

### ADR-047 — Takvim saatleri ISS gün iskeletine göre; simülasyon saatleri takvimden okunur

> Numara notu: ilk yazıldığında ADR-036 idi; PR #13 ile aynı numara iki kez oluştuğu için 15.11.2026'da 039'a, ardından ADR-039 anomali tespitine (PR #14) verildiği için 045'e, 15.11.2026 akşamı main'e eşitlemede core-routine ADR'leri tek blokta toplanırken 047'ye taşındı.

- **Bağlam:** ADR-035 takvimin yapısını kaynaklara bağladı ama saatler Faz 0 örneğiydi. Simülasyon
  ölçüm saatlerini kendi içinde sabit yazıyordu; takvimle ayrışmıştı (ör. egzersiz takvimde 15:00,
  demo verisinde 17:00).
- **Karar:** Saatler ISS gün iskeletine göre (UTC): 06:00 uyanış → 06:00–07:00 uyku sonrası blok → mesai →
  19:30–21:30 uyku öncesi blok → 21:30 uyku. Uyku kaydı 06:15; sabah vitalleri (KB, nabız, SpO₂, ısı) ve
  açlık şekeri 06:30; egzersiz 17:30 (günün toplamı); dozimetre ve ISS akşam nabzı 19:30; ruh hali ve aylık
  anket 21:00; haftalık özet ve aylık muayene 10:00 (1. gün muayenesi = kişisel başlangıç). Simülasyon her
  slotun saatini aktif ortamın takviminden, metrik eşleşmesiyle okur; takvimde karşılığı olmayan slotlar
  ADR-016 saatinde kalır. Dayanak: `esa-outpost42-daily-schedule`, `esa-pesquet-blog-presleep`,
  `clickorlando-2020-day-in-space` (ikincil), `nasa-std-3001-v1-medops`. Sahip: Mühendis 1.
- **Sonuç:** Takvim ve demo verisi tek kaynaktan; ölçüm sayısı değişmez (30 gün × 4 kişi ISS: 1.452).
  Rover ve diğer ortam-özel saatler değişmedi. Takvimle eşleşmeyen simülasyon ölçümleri (akşam vitali,
  rover'daki eksik maddeler) `docs/ROUTINE_SCHEDULE.md` § Açık konular'da; hizalama ayrı karar.
  ADR-016'nın ölçüm saatleri kısmının yerine geçer.

### ADR-048 — Demo verisi takvime birebir uyar (veri = takvim)

> Numara notu: ilk yazıldığında ADR-037 idi; PR #13 ile aynı numara iki kez oluştuğu için 15.11.2026'da 040'a, akşam main'e eşitlemede 048'e taşındı.

- **Bağlam:** ADR-035/047 sonrası sıklık ve saat takvimden geliyordu ama simülasyon takvimde olmayan
  ölçümler de üretiyordu: günlerin ~%50'sinde akşam KB + nabız + ısı (ADR-016) ve takvimde maddesi olmayan
  solunum hızı. Ekranda "görev listesinde olmayan ölçüm" görünüyordu.
- **Karar:** Üretici yalnız aktif ortamın takviminde o gün düşen hatırlatmalar için, o hatırlatmanın
  saatinde ölçüm üretir. Takvime `morning-resp` (solunum, günlük 06:30, `csa-bio-monitor`) eklendi;
  diastolik `morning-bp` ile gelir. ISS'te akşam yalnız `evening-hr` (her gün 19:30); transit/Ay/Mars'ta
  akşam vitali yok. Takvimi `CORE_ROUTINE`'i içermeyen ortamlar (bugün rover) takvimde olmayan metrikler
  için ADR-016 davranışında kalır; ortam farkları ayrı karar. Sahip: Mühendis 1.
- **Sonuç:** 30 gün × 4 kişi ISS 1.452 → 1.324 ölçüm. Bayatlık: ISS'te artık her metrik takvimli
  (solunum 48 sa yerine günlük × 1.5). ADR-016'nın akşam vitali kuralının yerine geçer (rover hariç).
- **Güncelleme (15.11.2026 akşam):** Veri takvimi izler; senaryolar hikâyeye uygun **bilinçli
  kaçırma/gecikme** içerebilir (`ScenarioDefinition.adherence(slot, ctx)` → `{ skip }` veya
  `{ delayMin }`). Günler sabittir (son günden uzaklık), `Math.random` yok. Atlanan slotun değerleri de
  örneklenir, yalnız çıktıya yazılmaz: PRNG akışı ve diğer bütün değerler aynı kalır. Bugün yalnız
  `mixed_mission` kullanıyor (Kenji, Selin, Lucas; Mira kusursuz — `docs/DEMO_CREW_STORIES.md` "Uyum").
  Takvimde olmayan ölçüm hâlâ üretilmez; geç girilen ölçüm takvim saatinden sonra, aynı gün içindedir.

### ADR-038 — Varsayılan demo senaryosu: karma görev (dört durum seviyesi); mürettebat 4 kişi sabit

- **Bağlam:** Varsayılan senaryo `nominal`'di; jüri tek ekranda uyarı sistemini göremiyordu. Ayrıca crew
  baseline'ları bant kenarındaydı (uyku 6.9–7.6, egzersiz 125–140, solunum 13, şeker 96): varsayılan
  seed'de nominal senaryoda bile dört kişinin dördü caution çıkıyordu.
- **Karar:** Yeni senaryo `mixed_mission` (varsayılan, ISS): Mira nominal, Kenji warning (öncü işaretler +
  ateş/sıvı kaybı), Selin caution (izolasyon kaynaklı uyku/ruh hali trendi), Lucas advisory (kişisel
  baseline'dan +9 mmHg sapma, egzersiz uyumu düşük). Etki büyüklükleri mevcut eşik bantlarına göre seçildi;
  eşik dosyası değişmedi. Baseline'lar nominal bantların içine, gürültüye pay bırakacak şekilde çekildi
  (ayrıntı: `docs/DEMO_CREW_STORIES.md`). Mürettebat 4 kişi sabit (Evolvable Mars Campaign 4, DRA 5.0 6:
  `nasa-nesc-mars-crew-size`); ekleme/çıkarma arayüzü "sonra" kapsamı. Diğer 6 senaryo aynen duruyor.
- **Sonuç:** `ScenarioId`'ye `'mixed_mission'` eklendi (eklemeli). Durumlar varsayılan seed'de (2026)
  testle kilitli; başka seed'lerde gürültü nedeniyle tek bir değer bant kenarını aşabilir. Motor bugün stub;
  `advisory` üretimi Mühendis 3'te (ADR-031). Eski tarayıcı verisi: Ayarlar → Sıfırla → Demo verisini yükle.

### ADR-046 — Yayın: GitHub Pages

> Numara düzeltmesi: bu karar ilk mergede yanlışlıkla ADR-039 ile (anomali tespiti kararıyla aynı
> numarayla) girmişti — aynı anda birden fazla branch'in bağımsız numara seçip birleşmesinden
> (bu arada ADR-048/044/045 de başka kararlarca alındı). `docs/DECISIONS.md`'de tekrar eden/sırasız
> numaralar var; tam bir yeniden numaralandırma geçişi ayrı, koordineli bir iş (Mühendis 1).

- **Bağlam:** Teslim için projenin herkese açık, hesap/şifre istemeyen bir linkle erişilebilir olması
  gerekiyor (NASA Space Apps 2026 teslim kuralları). Uygulama tamamen statik ve sunucusuz: backend yok,
  offline-first, tüm veri tarayıcıda simüle (`docs/PROJECT_BRIEF.md`). `base: './'` ve hash router
  (ADR-007) zaten göreli/sunucu-rewrite'ı olmayan bir barındırma için hazır.
- **Karar:** GitHub Pages, "Source: GitHub Actions" (ücretsiz plan yalnız public repoda çalışır; repo
  zaten public). Yeni iş akışı `.github/workflows/deploy-pages.yml`: `main`'e her push'ta (ve elle
  `workflow_dispatch`) `npm ci && npm run build` → `dist/` Pages artifact'ı olarak yüklenir → yayınlanır.
  Mevcut `ci.yml`'e (lint/typecheck/test/build + CHANGELOG kontrolü) dokunulmadı; iki iş akışı bağımsız
  çalışır. Site: `https://emir-pek.github.io/astroVital/`.
  **Güncelleme (15 Kasım, teslim günü):** hesap genelinde faturalama kilidi (Actions/Codespaces/
  Packages için `$0.00/$0.00 — Usage blocked`) yüzünden `deploy-pages.yml` hiç tetiklenmedi (ne push'ta
  ne elle). Kilit açılana kadar geçici olarak klasik "Deploy from a branch" kullanıldı: derlenmiş
  `dist/` çıktısı `gh-pages` branch'ine commit'lendi (+ `.nojekyll`), Pages ayarı `build_type: legacy`,
  `source: gh-pages`'e çevrildi (`gh api PUT .../pages`). Site doğrulandı: ana sayfa ve her asset
  (JS/CSS/font) 200 dönüyor. **Kilit açılınca yapılacak:** `gh api PUT repos/Emir-pek/astroVital/pages
  -f build_type=workflow` ile Pages'i tekrar "GitHub Actions" kaynağına çevir; o andan sonra `main`'e
  her push otomatik yayınlar ve `gh-pages` branch'i elle güncellenmeyi bırakır (silinebilir).
- **Sonuç:** Faturalama düzelene kadar site elle (bu PR'daki gibi bir sonraki `npm run build` + commit
  ile) güncellenmeli; düzelince `main`'e her merge siteyi otomatik günceller. Ziyaretçinin girdiği
  ölçüm verisi yalnız kendi tarayıcısında kalır (localStorage); GitHub, Pages'i servis ederken ziyaretçi
  IP'sini kendi güvenlik/analiz amaçlarıyla loglar (GitHub'ın kendi gizlilik politikası, bizim
  uygulamamızın değil). README'ye canlı link eklendi.
### ADR-039 — Anomali tespiti çevrimdışı bir Python aracı olarak `tools/anomaly-detection/` altında

- **Bağlam:** Veri seti + anomali tespiti işi (Emre) Python'da yazıldı: gerçek bir açık giyilebilir veri
  setinden (MMASH, PhysioNet, ODbL) 14 günlük sentetik mürettebat verisi üretiyor ve kişiye özel baseline
  (kayan medyan + MAD) ile açıklanabilir uyarılar çıkarıyor (demo verisinde 2/2 olay, 0 yanlış alarm).
  Repo kuralı "Python/venv kullanılmaz"; uygulama offline-first, saf Node/React.
- **Seçenekler:** (a) TypeScript'e port edip `src/modules/assessment` içine almak — uygulamada canlı çalışır,
  ama hackathon gününde büyük iş, assessment sahibi Mühendis 3, tip sözleşmesi değişirse Mühendis 1 onayı;
  (b) ayrı repo — ekipten kopuk; (c) repoda ayrı, çevrimdışı bir araç klasörü.
- **Karar:** (c). Kod `tools/anomaly-detection/` altında (`astrohealth/synth`, `astrohealth/detect`,
  `scripts/`). Uygulama build'ine, `npm run verify`'a ve CI'a **girmez**; uygulama aracı çalışma anında
  çağırmaz, yalnız çıktısını (`results/alerts.csv`) kullanabilir. Python yalnız bu klasör için gereken
  isteğe bağlı bir sistem aracıdır (`docs/SETUP_CHECK.md` § 1.6). Ham MMASH verisi (~100 MB) git'e girmez
  (`.gitignore`); üretilen sentetik veri (~5.5 MB) ve sonuçlar commit'lenir ki ekip MMASH indirmeden
  entegrasyon yapabilsin. Sahip: Emre, branch `feat/anomaly-detection`.
- **Sonuç:** "Python/venv kullanılmaz" kuralı uygulama için geçerli kalır; tek istisna bu klasördür.
  Uyarı seviyelerinin (`BİLGİ/DİKKAT/UYARI`) uygulamanın `Status`'üne (ADR-031) eşlenmesi ve ekranlara
  bağlanması ayrı iş (assessment/visualization ile). Port (a) daha sonra ayrı bir kararla yapılabilir.

### ADR-049 — Hatırlatma durum kuralları: pencere, 'late', kişi bazlı, seçili astronot

> Numara notu: ilk yazıldığında ADR-041 idi (PR #16). PR #16'nın main ile birleştirilmesinde (`1271079`) bu bölüm DECISIONS'tan düşmüştü; 15.11.2026 akşamı geri eklenip 049'a taşındı.

- **Bağlam:** `useReminders` stub'dı; bir görevin ne zaman "yapıldı/kaçırıldı" sayılacağı ADR-035'te ayrı
  karar olarak bırakılmıştı. ISS'te aynı metrik günde iki kez ölçülüyor (sabah ve akşam nabzı); ekip
  ekranında da başkasının tıbbi değeri görünmemeli (ADR-032).
- **Karar:** Saf motor `expandReminders` (`src/modules/routine/services/reminderEngine.ts`). Sabitler tek
  yerde (`reminderConfig.ts`): `EARLY_WINDOW_MIN = 60`, `DUE_GRACE_MIN = 120`. Beş durum:
  `upcoming` (şimdi < saat − 60 dk) · `due` (pencere açık, kayıt yok, saat + 120 dk'ya kadar) · `done`
  (kayıt [saat − 60, saat + 120] içinde) · `late` (kayıt saat + 120'den sonra ama gün bitmeden) ·
  `missed` (saat + 120 geçti, kayıt yok). Gün = UTC görev günü (ADR-030; Mars'ta yalnız etiket "Sol").
  Eşleşme kişi + metrik ile; bir ölçüm yalnız **bir** örneği karşılar: penceresi ölçümü kapsayan,
  henüz karşılanmamış örneklerden saati en yakın olan (sabah/akşam nabzı karışmaz). Metriği olmayan
  görevler (haftalık özet, aylık muayene/anket, ekip sohbeti) elle işaretlenir (`completeTask`, aynı
  pencere kuralları; ancak görev açıkken — `due`/`missed` — kabul edilir). Örnek kimliği
  `${crewId}:${templateId}:${missionDay}:${occurrence}`. `twice_daily` ikinci örnek = ilk + 12 sa
  (**geçici**; ortam farkları kararında kesinleşecek). Kişi görünümü varsayılan olarak seçili astronotu
  (`selectedCrewId`) izler; `byCrew` tüm mürettebatın yalnız görev durumunu verir. Tamamlanma kayıtları
  modülün kendi store'unda (`astrovital:routine`, ADR-005). Sahip: Mühendis 1.
- **Sonuç:** Pencere tablosu `docs/ROUTINE_SCHEDULE.md` § Durum kuralları. Gün sınırını aşan pencere
  yok (en geç görev 21:00 + 120 dk = 23:00). Gece yarısından sonra girilen ölçüm ertesi güne sayılır;
  önceki gün `missed` kalır. Bayatlık (`isStale`) bu karardan bağımsız.

### ADR-050 — Oyunlaştırma: türetilmiş XP, uyuma ödül, değerden bağımsız

> Numara notu: ilk yazıldığında ADR-042 idi (PR #16). PR #16'nın main ile birleştirilmesinde (`1271079`) bu bölüm DECISIONS'tan düşmüştü; 15.11.2026 akşamı geri eklenip 050'ye taşındı.

- **Bağlam:** `useGamification` stub'dı. Kural baştan beri belliydi (XP uyuma, değere değil), ama sayaç
  tutan bir tasarım tekrar tıklamayla şişirilebilirdi ve demo mürettebatı XP'siz başlardı.
- **Karar:** XP depolanan bir sayaç değil; hatırlatma geçmişinden (`expandRange`, ADR-049) ve günlük görev
  işaretlerinden **türetilir** (`src/modules/routine/services/gamification.ts`, saf). Puanlar: `done` = 10,
  `late` = 5, `missed` = 0; elle tamamlanan görev ölçümle aynı (10/5); günlük sağlık görevleri (su, ışıkları
  zamanında kapat, ekip sohbeti, öğren) elle işaretlenir, kişi + gün başına bir kez, 5 XP. Seviye:
  `levels.ts` (700 XP/seviye ≈ kusursuz bir ISS haftası; önce 100 — demo 30. günde seviye 30 oluyordu). **Seri:** metrikli tüm planlı görevlerin `done`/`late` olduğu ardışık görev
  günleri; bugün açık görev varken seri bozulmaz ve sayılmaz; dinlenme günü listeden egzersizi çıkarır,
  seriyi bozmaz; metriksiz görevler seriye girmez. **Rozetler:** `streak-7`, `streak-30` (en uzun seriye
  göre, kazanılınca kalır), `exercise-week` (bir görev haftasında 6 planlı egzersizin 6'sı),
  `monthly-exam-done`, `crew-player` (5 ekip sohbeti). **Ekip skoru:** son 7 görev gününde tüm mürettebatın
  metrikli görevlerinde (done + late) / çözülmüş planlı görev yüzdesi; açık görevler (upcoming/due) hesaba
  girmez. Hiçbir fonksiyon ölçüm değerini okumaz; bunu "değer değişse de XP/seri/rozet aynı" testi kilitler.
  Sahip: Mühendis 1.
- **Sonuç:** Demo mürettebatı geçmiş XP ve seriyle başlar (demo verisi takvime birebir olduğu için
  geçmiş ölçümlerin hepsi `done`; metriksiz görevler elle işaretlenmediğinden XP getirmez). Ekran
  `MissionBoard` çalışır-sade; "XP uyuma verilir" açıklaması görünür kalmalı (görünüm visualization'da).

### ADR-051 — Astronot pet (yardımcı): yalnız mantık, sabit öncelik, kişiye kapalı

> Numara notu: ilk yazıldığında ADR-043 idi (PR #16). PR #16'nın main ile birleştirilmesinde (`1271079`) bu bölüm DECISIONS'tan düşmüştü; 15.11.2026 akşamı geri eklenip 051'e taşındı.

- **Bağlam:** Ekip "astronot pet" fikrini istedi; kuralları Mühendis 1'de, görünümü visualization'da
  (ADR-032). Pet bir sağlık uygulamasında konuştuğu için dil ve gizlilik kuralı gerekiyor.
- **Karar:** Saf `decideCompanion` + `useCompanion(crewId?)` (`src/modules/routine`). Çıktı:
  `{ mood: 'cheerful'|'neutral'|'concerned'|'alert', messageKey, params?, subjectKey?, action?: { route, labelKey } }`.
  Öncelik: (1) `useCrewHealth().overall === 'warning'` → alert, "Durum ekranını aç, adımları izle, CMO'ya
  haber ver"; (2) kaçırılan görev → concerned, nazik hatırlatma; (3) şu an açık görev → neutral, "şimdi
  X zamanı" (ölçümse `/measure`); (4) bugün kazanılan rozet veya seri kilometre taşı (7, 14, 30, 60, 90 gün)
  → cheerful; (5) aksi halde neutral, günün ipucu: Learn içeriğindeki tehlike karşı önlemleri
  (`hazards.*.countermeasures`), kişi ve güne göre deterministik (FNV hash, `Math.random` yok).
  **Dil:** kısa, sade, teşhis yok; değer yazmaz; "prototip, tıbbi cihaz değil" metni (`routine.companion.disclaimer`).
  **Gizlilik:** girdi yalnız o kişinin kendi özeti, görevleri ve ilerlemesi; varsayılan kişi seçili
  astronot; başka astronotun bilgisi asla girmez (testli). Sahip: Mühendis 1.
- **Sonuç:** Değerlendirme motoru bugün stub (hep nominal) olduğu için alert durumu motor gerçek olunca
  çalışır; Mühendis 3'ün `useCrewHealth` sözleşmesine dayanır. Görsel (4 mood'un görünüşü) Emir'de.

### ADR-052 — P2 mantık işleri: demo otomatik yükleme ayarı, veri dışa/içe aktarma, sayfa bazlı yükleme

> Numara notu: ilk yazıldığında ADR-044 idi (PR #16). PR #16'nın main ile birleştirilmesinde (`1271079`) bu bölüm DECISIONS'tan düşmüştü; 15.11.2026 akşamı geri eklenip 052'ye taşındı.

- **Bağlam:** ADR-009 demo verisinin her boş açılışta yüklenmesini "gerçek kullanımda kapatılabilir
  olmalı" notuyla bırakmıştı; dışa/içe aktarma ve code splitting (ADR-021) P2 listesindeydi.
- **Karar (1) — `autoLoadDemo`:** `AppSettings.autoLoadDemo` (varsayılan `true`). `DemoDataBootstrap` yalnız
  açıkken ve cihazda veri yokken yükler. "Tüm veriyi sıfırla" bu tercihi korur (dil ve birim gibi). Store
  şeması `version` 1 → 2; saf `migrateHealthState` eski kayda `autoLoadDemo: true` ekler. Kullanılmayan
  `settings.notificationsEnabled` kayıt uyumluluğu için duruyor, `@deprecated` (anahtar routine store'da, ADR-049).
  Sahip: Mühendis 1; Ayarlar anahtarının görünümü visualization.
- **Karar (2) — Dışa/içe aktarma:** saf `buildExportJson` / `parseImportJson` (Zod v4,
  `src/modules/routine/services/dataTransfer.ts`; routine'de çünkü routine tamamlamalarını da içeriyor ve
  core modülden okuyamaz). Dosya: `{ format: 'astrovital-export', version: 1, exportedAt, measurements, crew,
  settings, routine: { completions, dailyMissionCompletions } }`. İçe aktarma bir **geri yüklemedir**:
  ölçümleri, mürettebatı, ayarları ve routine tamamlamalarını değiştirir (birleştirme yok, ID çakışması
  sorunu olmaz). Her ölçüm kendi `source`'unu korur (kamera ölçümü kamera olarak kalır; `'import'` ile
  ezilmez — kökeni görünür kalsın). Geçersiz girdide hiçbir şey değişmez; sonuç `invalidJson` /
  `invalidFormat` (en çok 10 yol: "measurements.0.metric: …") / `unknownCrew`. Yeni core store aksiyonu
  `replaceData`. CSV ve arayüz yok (butonlar visualization).
- **Karar (3) — Sayfa bazlı yükleme:** `router.tsx`'te Durum (`/`) dışındaki sayfalar `React.lazy` +
  `Suspense` (fallback boş: parçalar aynı statik klasörden, milisaniyede gelir; ağ isteği yok, offline-first).
  Durum ana parçada kalır, ilk ekran beklemez. Sonuç (15.11.2026 build): ana parça 965 kB → 562 kB
  (gzip 311 → 180 kB); sayfa parçaları 0,3–5 kB; ortak bağımlılıklar (grafik, modüller) Rolldown'ın
  `PageHeader` adını verdiği 422 kB'lık paylaşılan parçada. 500 kB uyarısı ana parça için sürüyor
  (ADR-021 kabulü geçerli); daha fazlası için kütüphane bazlı `codeSplitting` ayrı iş.
- **Sonuç:** Üç iş de arayüzsüz; Ayarlar'daki anahtar ve butonlar visualization'a devredildi
  (`docs/HANDOFF_ENGINEER4.md`). Sahip: Mühendis 1.
