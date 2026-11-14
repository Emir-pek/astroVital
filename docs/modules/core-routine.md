# Mühendis 1 — Platform, Çekirdek & Görev Rutini

**Branch:** `feat/core-routine` · **Sahip:** Mühendis 1 (_TBD_)

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
- [x] i18n altyapısı (EN/TR) + anahtar eşitlik testi
- [x] MET saati (`MetClock`)
- [ ] Koyu "mission control" temasını cilala (tipografi, ızgara arka plan, cam efektli paneller)
- [ ] Ortam seçici: TopBar rozetinden hızlı geçiş (popover), ortam değişince toast
- [ ] UI kit tamamla: `Tabs`, `Select`, `Slider`, `Tooltip`, `ProgressBar`, `Skeleton` (çevrilmiş metin alır)
- [ ] Senaryo seçince `recommendedEnvironment`'ı öner (tek tıkla ortamı da değiştir)
- [ ] Sözleşme bakımı: diğer mühendislerin ekleme isteklerini değerlendir, `npm run docs:contracts`

### P1 (Faz 2)

- [ ] `useReminders`: aktif ortamın `reminderSchedule`'ını bugünün MET gününe aç; `metric`'i olan
      görevler için o zaman penceresinde ölçüm varsa `done`, süresi geçtiyse `missed`
- [ ] Bildirim: uygulama içi toast + izin verildiyse `Notification` API (Settings'te açma anahtarı)
- [ ] Kaçırılan ölçüm takibi (Dashboard'da rozet)
- [ ] Oyunlaştırma: modül-yerel persist store (`astrovital:routine`), XP, seviye, seri (streak),
      rozetler, ekip skoru, günlük görevler (egzersiz, hidrasyon, uyku hijyeni, ekip sohbeti, öğren)
- [ ] **Kural:** XP yalnız **uyum** için (ölçüm yapıldı, görev tamamlandı) — değerin "iyi" olması
      ödüllendirilmez. Bunu `MissionBoard`'da kullanıcıya da açıkla.
- [ ] Uçtan uca entegrasyon testi `src/app/__tests__/e2e-flow.test.tsx`

### P2 (Faz 3)

- [ ] JSON/CSV dışa/içe aktarma (Zod ile doğrula, `source: 'import'`)
- [ ] Demo modu (otomatik akış: senaryo yükle → sayfaları gez)
- [ ] Sayfa bazlı code splitting (`React.lazy`) — ADR-021
- [ ] Store `version`/`migrate`; 180 gün için boyut kontrolü (ADR-016)
- [ ] Demo verisi otomatik yüklemeyi Settings'ten kapatma (ADR-009)
- [ ] README son hali, build/preview kontrolü

## Kabul kriterleri

- `npm run verify` her merge'de yeşil; tüm sayfalar açılıyor (routes testi).
- Ortam değişince: tema tonu, TopBar rozeti, hatırlatma takvimi ve eşikler (motor üzerinden) değişir.
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
- **Mühendis 4:** `tokens.css` ortam tonları, `data-env`; sunum modu için global bayrak gerekirse store'a eklenir.

## Yapma listesi

- ❌ Başka modülün iç dosyasına dokunma / import etme.
- ❌ `src/core/types`'ı duyurmadan değiştirme.
- ❌ Store'a türetilmiş (değerlendirme) veri persist etme.
- ❌ Ağ isteği gerektiren bağımlılık (CDN font, analitik) ekleme — offline-first.
- ❌ Push / remote ekleme.
