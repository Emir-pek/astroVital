# Mühendis 1 — Platform, Çekirdek & Görev Rutini

**Branch:** `feat/core-routine` · **Sahip:** Mühendis 1 (Muhammed Bektaş)

> **ADR-032 (14.11.2026) sonrası:** `src/app` ve `src/core/ui`'ın **görünümü** visualization ekibinde (Emir).
> Mühendis 1'de kalanlar: core (types, config, store, simulation, i18n altyapısı, utils), app'in
> mantığı/rotaları/entegrasyonu, routine modülünün mantığı, sözleşme bakımı ve PR mimari onayı.

## Amaç

Herkesin üzerine inşa ettiği zemini sağlam tutmak (kabuk, çekirdek, sözleşmeler, simülasyon) ve
astronotun **rutine uyumunu** destekleyen hatırlatma + oyunlaştırma modülünü yapmak.

## Sahip olunan klasörler

`src/app/**`, `src/core/**` (içerik ortaklıkları için TEAM.md), `src/modules/routine/**`,
`src/test/**`, kök yapılandırma (`vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `package.json`),
`scripts/`, `README.md`, `docs/CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/TEAM.md`.

## Public API (`@modules/routine`)

`<ReminderCenter scope?/>`, `<MissionBoard/>`, `<MetClock/>`, `useReminders()`,
`useGamification()`, `levelForXp`, `levelProgress`, `XP_PER_LEVEL`. Ayrıca tüm `@core/*` yüzeyi
(CONTRACTS.md).

## Bağımlılıklar

routine → `@core/*`, `@modules/assessment` (ör. "kırmızı durumdayken yeniden ölç" görevi).
app → hepsi.

## Görevler

### P0 (Faz 1)

- [x] Uygulama kabuğu, yönlendirme (hash router), layout (Sidebar, TopBar, feragat)
- [x] Store + persist, seçiciler, simülasyon üreticisi + 6 senaryo, `loadDemoData`/`resetAll`
- [x] Demo verisi takvime birebir (veri = takvim, ADR-040)
- [x] Varsayılan senaryo "karma görev": dört astronot, dört durum seviyesi (ADR-038, `docs/DEMO_CREW_STORIES.md`)
- [x] i18n altyapısı (EN/TR) + anahtar eşitlik testi
- [x] MET saati (`MetClock`)
- ~~Koyu "mission control" temasını cilala (tipografi, ızgara arka plan, cam efektli paneller)~~ → Devredildi: visualization (ADR-032)
- ~~UI kit tamamla: `Tabs`, `Select`, `Slider`, `Tooltip`, `ProgressBar`, `Skeleton` (çevrilmiş metin alır)~~ →
  Devredildi: visualization (ADR-032). Not: `Select`/`Menu`/`Segmented`/`Sheet`/`RedAlertDialog` hazır;
  `Tabs`/`Slider`/`ProgressBar`/`Tooltip` envanterde boşta (TEAM.md "UI kit envanteri").
- ~~Ortam seçici: TopBar rozetinden hızlı geçiş (popover), ortam değişince toast~~ → Görünüm devredildi: visualization (ADR-032)
  - [ ] Mantık: ortam değişince store güncellenir, toast tetiklenir, hatırlatma takvimi ve eşikler yeni
        ortama göre yeniden hesaplanır (görünüm: visualization)
- ~~Senaryo seçince `recommendedEnvironment`'ı öner (tek tıkla ortamı da değiştir)~~ → Görünüm devredildi: visualization (ADR-032)
  - [ ] Mantık: senaryo seçilince `recommendedEnvironment` önerisi ve tek aksiyonla hem senaryo hem ortamı
        uygulayan store aksiyonu (görünüm: visualization)
- [x] Sözleşme uyumu: ADR-031 dört seviyeli `Status` sonrası `CONTRACTS.md` (`npm run docs:contracts`),
      `thresholds.config`, i18n `status.*` ve simülasyon/store kodunda eski green/yellow/red kalıntısı
      olmadığını kontrol et
- [ ] Sözleşme bakımı: diğer mühendislerin ekleme isteklerini değerlendir, `npm run docs:contracts`

### P1 (Faz 2)

- [x] Takvim yapısı: günlük/haftalık/aylık, NASA/CSA kaynaklı (ADR-035, `docs/ROUTINE_SCHEDULE.md`)
- [x] Takvim saatleri: ISS gün iskeleti, simülasyon saatleri takvimden (ADR-039)
- [ ] Ortama göre takvim farkları (ayrı karar; rover'ın veri = takvim uyumu dahil)
- [ ] Mürettebat ekleme/çıkarma (sonra kapsamı, ADR-038)
- [x] `useReminders`: aktif ortamın `reminderSchedule`'ını bugünün UTC görev gününe açar; 5 durum
      (`late` dahil), kişi bazlı + seçili astronot, elle tamamlanan görevler (ADR-041). `ReminderCenter`
      çalışır-sade; görünüm visualization'da (`docs/HANDOFF_ENGINEER4.md`)
- [x] Bildirim mantığı: `ReminderNotifier` (app/providers'ta mount) yalnız seçili astronot için due/missed
      başına bir kez toast + açıksa ve izin varsa `Notification`; `useNotificationSettings` /
      `requestNotificationPermission` hazır. Ayarlar anahtarının bağlanması: visualization
- [x] Kaçırılan ölçüm sayısı: `useMissedCount(crewId?)`. Rozetin yeri ve bağlanması: visualization
- [x] Oyunlaştırma mantığı (ADR-042): türetilmiş XP, seviye, seri, 5 rozet, ekip skoru, 4 günlük sağlık
      görevi; `useGamification(crewId?)`. `MissionBoard` çalışır-sade (görünüm: visualization)
- [x] **Kural:** XP yalnız **uyum** için — değerden bağımsızlık testle kilitli; `MissionBoard`'da açıklama
      metni görünür (görünüm: visualization)
- [ ] Uçtan uca entegrasyon testi `src/app/__tests__/e2e-flow.test.tsx` (görünüm: visualization)

### P2 (Faz 3)

- [ ] JSON/CSV dışa/içe aktarma (Zod ile doğrula, `source: 'import'`)
- [ ] Demo modu (otomatik akış: senaryo yükle → sayfaları gez)
- [ ] Sayfa bazlı code splitting (`React.lazy`) — ADR-021
- [ ] Store `version`/`migrate`; 180 gün için boyut kontrolü (ADR-016)
- [ ] Demo verisi otomatik yüklemeyi Settings'ten kapatma (ADR-009)
- [ ] README son hali, build/preview kontrolü

## Kabul kriterleri

- `npm run verify` her merge'de yeşil; tüm sayfalar açılıyor (routes testi).
- Ortam değişince: hatırlatma takvimi ve eşikler (motor üzerinden) değişir; tema tonu ve TopBar rozeti
  değişimi visualization ile birlikte.
- Hatırlatma "yapıldı" durumu ilgili ölçüm girilince ≤1 sn'de güncellenir.
- Gamification hiçbir yerde ölçüm **değerine** bağlı değil (kod incelemesinde kontrol).

## Test beklentileri

- `useReminders` saf çekirdeği (`expandSchedule(schedule, missionStart, now, measurements)`) için
  tablo-güdümlü testler (done/missed/upcoming sınırları).
- XP/seri hesapları saf fonksiyon + test.
- Simülasyon: her yeni senaryo için deterministiklik + beklenen etki testi.

## Entegrasyon noktaları

- **Mühendis 2:** `useAddMeasurement` → store → `useReminders` "done" algılar.
- **Mühendis 3:** `useCrewHealth` sonucu kırmızıysa routine "yeniden ölç" görevi üretir.
- **Mühendis 4 / visualization (Emir):** Ekranların görünümü visualization'da; Mühendis 1 hook/store/aksiyon
  sağlar, Emir bağlar. `tokens.css` ortam tonları, `data-env`; sunum modu için global bayrak gerekirse store'a eklenir.

## Yapma listesi

- ❌ Başka modülün iç dosyasına dokunma / import etme.
- ❌ `src/core/types`'ı duyurmadan değiştirme.
- ❌ Store'a türetilmiş (değerlendirme) veri persist etme.
- ❌ Ağ isteği gerektiren bağımlılık (CDN font, analitik) ekleme — offline-first.
- ❌ Force push, verify'sız `main` push'u, remote ekleme/değiştirme.
