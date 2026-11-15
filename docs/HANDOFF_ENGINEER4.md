# HANDOFF_ENGINEER4 — Mühendis 1'den Mühendis 4'e (visualization) devir notları

**Sahip:** Mühendis 1 · **Son güncelleme:** 2026-11-15 · **Branch:** `feat/core-routine`

> Bu dokümandaki her şey Mühendis 1'in mantık/sözleşme değişikliğidir; görünüm, yerleşim ve etkileşim
> tasarımı Mühendis 4'e aittir (ADR-032). Aşağıdaki kurallar korunarak ilgili ekranlar
> revize edilmeli/tasarlanmalıdır.

Hepsi `@modules/routine` (veya `@core/store`) üzerinden gelir; derin import gerekmez. İmzaların tam listesi
`docs/CONTRACTS.md` § routine. "Çalışır-sade" diye geçen bileşenler mantık olarak eksiksizdir ama yalnız UI
kit parçalarıyla (`Card`, `Tile`, `Button`, `EmptyState`) dizilmiştir; stil yok.

**Genel kural (ADR-032):** kişisel ekranlar yalnız **seçili astronotun** (`selectedCrewId`, `CrewPicker`)
verisini gösterir. Ekip görünümlerinde tıbbi değer yok; yalnız görev durumu ve uyum yüzdesi.

---

## 1. Hatırlatmalar (ADR-041)

**Ne değişti:** `useReminders` stub'dı, artık gerçek. Görev başına 5 durum var; `late` (geç yapıldı) yeni.
Pencere: görev saatinden 60 dk önce açılır, 120 dk sonra kapanır (`docs/ROUTINE_SCHEDULE.md` § Durum kuralları).

**API:**

```ts
import { useReminders, REMINDER_STATUS_ICON, ReminderCenter } from '@modules/routine';

const { crewId, reminders, byCrew, due, late, missed, missedCount, completeTask } = useReminders(); // seçili astronot
// reminders[0] →
// { id: 'crew-1:morning-hr:30:0', crewId: 'crew-1', template: { id: 'morning-hr', metric: 'heartRate',
//   taskKey: 'routine.task.restingHeartRate', timeOfDayMET: '06:30', … }, missionDay: 30, occurrence: 0,
//   dueAt: '2026-11-15T06:30:00.000Z', status: 'done', completedAt: '2026-11-15T06:34:00.000Z',
//   completedBy: 'measurement' }
completeTask('crew-1', 'weekly-health-summary'); // true | false — yalnız metriksiz ve açık (due/missed) görev
```

`byCrew` → `{ [crewId]: ReminderInstance[] }`: tüm ekip, yalnız görev durumu.

**Ekranın uyması gereken kurallar:**

- Durum her zaman **ikon + metin**; renk tek ipucu olamaz. `late`, `done`'dan görsel olarak ayrışmalı
  (bugün: `CircleCheck` "Yapıldı" ve `AlarmClockCheck` "Geç yapıldı"). Metinler `routine.reminders.status.*`.
- Kişi görünümü seçili astronotu izler (`useReminders()` argümansız). Ekip görünümünde `byCrew` kullanılır,
  tıbbi değer gösterilmez. `ReminderInstance`'ta zaten değer alanı yok.
- Metriksiz görevler (haftalık özet, aylık muayene ve anket, ekip sohbeti) için "Yapıldı" butonu yalnız
  `due`/`missed` iken görünür; `completeTask` false dönerse bir şey yapma.
- Saatler UTC (`dueAt`); Mars'ta da gün sınırı UTC görev günüdür (ADR-030).

**Önerilen ama zorunlu olmayan:** `due` olanları en üste al; `missed` için "şimdi yap" kısayolu (`/measure`);
`upcoming` sönük, tek satır.

**Revize edilecek:** `ReminderCenter` (çalışır-sade → restyle; `crewId?` prop'u var), `RoutinePage`.

## 2. Bildirim ve kaçırılan rozeti

**Ne değişti:** `ReminderNotifier` `app/providers`'ta görünmez olarak mount edildi. Seçili astronotun görevi
`due` ya da `missed` olunca bir kez toast çıkar; aynı anda açılanlar tek mesajda toplanır. Kullanıcı açtıysa
ve tarayıcı izin verdiyse tarayıcı bildirimi de gelir.

**API:**

```ts
import { useMissedCount, useNotificationSettings } from '@modules/routine';

const missed = useMissedCount(); // number — bugün kaçırılan (seçili astronot)
const { enabled, permission, setEnabled } = useNotificationSettings();
// permission: 'default' | 'granted' | 'denied' | 'unsupported'
await setEnabled(true); // tıklama içinde çağır: izin ister, verilirse açar → true; reddedilirse false
```

**Kurallar:** `setEnabled(true)` tarayıcı izni istediği için **kullanıcı tıklamasının içinde** çağrılmalı.
`permission === 'denied'` ise anahtarı açtırma, nedenini yaz. Bildirimler yalnız seçili astronot için.
Uygulama içi toast her zaman açık (kapatılamaz).

**Öneri:** Kaçırılan rozeti Sidebar'da "Rutin" öğesinin üstünde, sayı + metin. Yeri senin kararın.

**Revize edilecek:** `SettingsPage` (anahtar), `Sidebar` veya `TopBar` (rozet).

## 3. Oyunlaştırma (ADR-042)

**Ne değişti:** XP, seviye, seri, 5 rozet, ekip skoru ve 4 günlük sağlık görevi gerçek. XP depolanmıyor,
geçmişten türetiliyor: zamanında 10, geç 5, kaçırılan 0, günlük görev 5.

**API:**

```ts
import { useGamification, MissionBoard, BADGE_I18N } from '@modules/routine';

const g = useGamification(); // seçili astronot
// { crewId, today: 30, xp: 2970, level: 30, levelProgress: 0.7, streakDays: 29, longestStreak: 29,
//   badges: ['streak-7', 'exercise-week'], newBadgesToday: [], teamScore: 100,
//   missions: [{ id: 'hydration', titleKey: 'routine.daily.hydration', xp: 5, type: 'hydration', completedAt? }, …],
//   completeMission: (id) => boolean }
t(`routine.badges.${BADGE_I18N[badge]}.name`); // rozet adı; .description da var
```

**Kurallar:**

- **Arayüz hiçbir yerde ölçüm değerini ödülle ilişkilendirmemeli** (ör. "iyi nabız +XP" yok, rozet değer
  rengiyle boyanmaz).
- `MissionBoard`'daki "XP uyuma verilir, değere değil" açıklaması (`routine.missions.rule`) görünür kalmalı.
- `teamScore` her zaman tüm ekiptir ve yalnız uyumdur; kişi bazında ekip tablosu yapılacaksa yalnız uyum
  yüzdesi, tıbbi durum yok.
- Günlük görev kişi ve gün başına bir kez; `completeMission` false dönerse zaten işaretlidir.

**Öneri:** XP çubuğu (`levelProgress`), seri alevi, kazanılmamış rozetler gri ve açıklamalı.

**Revize edilecek:** `MissionBoard` (çalışır-sade → restyle), `RoutinePage`.

## 4. Astronot pet (ADR-043)

**API:**

```ts
import { useCompanion, formatCompanionMessage } from '@modules/routine';

const c = useCompanion(); // seçili astronot
// { mood: 'concerned', messageKey: 'routine.companion.missedOne', params: { count: 1 },
//   subjectKey: 'routine.task.sleepLog', action: { route: '/routine', labelKey: 'routine.companion.openRoutine' } }
const text = formatCompanionMessage(t, c); // "You missed: Log last night's sleep. No stress — …"
```

Öncelik sırası: uyarı (`alert`) → kaçırılan (`concerned`) → şu an yapılacak (`neutral`) → rozet/seri
kutlaması (`cheerful`) → günün ipucu (`neutral`).

**Kurallar:** 4 mood'un her birine ayrı görsel durum; `action` varsa yönlendirme butonu (`navigate(action.route)`,
etiket `t(action.labelKey)`). Metin kısa kalmalı, stres altında okunur olmalı; teşhis dili yok. Pet yalnız seçili
astronotu konuşur. "Prototip yardımcı, tıbbi cihaz değil" metni: `routine.companion.disclaimer`. Alert
durumu, motor gerçek olunca (Mühendis 3) çalışır; bugün motor stub olduğu için hiç `alert` görmezsin.

**Öneri:** `alert`'te pet animasyonu durur (dikkat dağıtmaz); `cheerful` tek seferlik küçük hareket;
`prefers-reduced-motion`'a uy.

**Revize edilecek:** yeni bileşen (yeri senin kararın: Durum sayfası veya Rutin).

## 5. Ortam ve senaryo

**Ne değişti:** Ortam değişince tek toast çıkar: "Ortam: X. Hatırlatma takvimi ve eşikler güncellendi."
`EnvironmentChangeNotice` `app/providers`'ta mount edildi. Hatırlatmalar aktif ortamdan türetilir, ek iş yok.
Yeni store aksiyonu:

```ts
useHealthStore
  .getState()
  .applyScenario('solar_particle_event', { withRecommendedEnvironment: true });
// senaryoyu yükler; true ise SCENARIOS[id].recommendedEnvironment'ı da uygular
```

**Kural:** Ayarlar'daki senaryo seçimine "önerilen ortamı da uygula" seçeneği eklenmeli; önerilen ortam
`SCENARIOS[id].recommendedEnvironment` (`@core/simulation`). `SettingsPage`'e dokunulmadı.

**Revize edilecek:** `SettingsPage` (senaryo bölümü).

## 6. Bayatlık (staleness.ts) — öneri, karar senin

Egzersizin dinlenme gününden (7., 14. … gün) sonraki gün egzersiz değeri "eski" görünebilir: `isStale`
sıklık × 1,5 kuralını kullanıyor ve `restEveryNDays`'i bilmiyor. Öneri: `exercise` için geçerlilik
penceresine bir dinlenme günü ekle (ör. `restEveryNDays` varsa pencere + 24 sa).

## 7. ADR numaraları

Çakışma düzeltmesi: Mühendis 1'in "Takvim saatleri ISS gün iskeletine göre" kararı **ADR-039**, "Demo verisi
takvime birebir" kararı **ADR-040** oldu. Senin ADR-036 (Durum ekranı) ve ADR-037 (Kutu sistemi) değişmedi.
Bu görevin yeni ADR'leri: 041 (hatırlatma durumları), 042 (oyunlaştırma), 043 (pet), 044 (P2 işleri).

## 8. P2 (yapıldı, arayüz bekliyor)

- **Demo verisini otomatik yükle** anahtarı: `updateSettings({ autoLoadDemo: boolean })`, varsayılan açık
  (ADR-044). Ayarlar'da açıklamayla göster: "Kapalıyken boş cihazda demo yüklenmez."
- **Dışa aktar:** `exportData()` → JSON metni; dosya olarak indir (`Blob` + `a[download]`, ör.
  `astrovital-backup-<tarih>.json`). Ağ isteği yok.
- **İçe aktar:** dosyayı oku → `importData(text)` →
  `{ ok: true } | { ok: false, error: 'invalidJson'|'invalidFormat'|'unknownCrew', issues: string[] }`.
  İçe aktarma **geri yüklemedir** (mevcut verinin yerine geçer): önce onay iste. Hata metnini çevir;
  `issues`'u ayrıntı olarak göster. i18n anahtarları henüz yok (senin önekinle ekle).
- **Sıfırla:** Ayarlar'daki "Tüm veriyi sıfırla" şu an yalnız core store'u temizliyor. Rutin tamamlamaları
  da gitsin istiyorsan aynı tıklamada `useRoutineStore.getState().resetRoutine()` çağır.
- **Sayfa bazlı yükleme:** Durum dışındaki sayfalar `React.lazy` ile yükleniyor (ADR-044). Görünümde fark yok;
  testte sayfa başlığını `findBy…` ile bekle.
