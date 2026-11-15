# HANDOFF_ENGINEER4 — Mühendis 1'den Mühendis 4'e (visualization) devir notları

**Sahip:** Mühendis 1 · **Son güncelleme:** 2026-11-15 (akşam) · **Branch:** `feat/core-routine`

> Bu dokümandaki her şey Mühendis 1'in mantık/sözleşme değişikliğidir; görünüm, yerleşim ve etkileşim
> tasarımı Mühendis 4'e aittir (ADR-032). Aşağıdaki kurallar korunarak ilgili ekranlar
> revize edilmeli/tasarlanmalıdır.

Hepsi `@modules/routine` (veya `@core/store`) üzerinden gelir; derin import gerekmez. İmzaların tam listesi
`docs/CONTRACTS.md` § routine. "Çalışır-sade" diye geçen bileşenler mantık olarak eksiksizdir ama yalnız UI
kit parçalarıyla (`Card`, `Tile`, `Button`, `EmptyState`) dizilmiştir; stil yok.

**Genel kural (ADR-032):** kişisel ekranlar yalnız **seçili astronotun** (`selectedCrewId`, `CrewPicker`)
verisini gösterir. Ekip görünümlerinde tıbbi değer yok; yalnız görev durumu ve uyum yüzdesi.

---

## 0. Özet (15.11.2026 akşam): eklenen arayüz, senin dosyaların, senden beklenenler

Arayüzü olmayan özelliklere Mühendis 1, senin görsel dilinle (kutu sistemi, token renkleri, ≥ 104 px, ≥ 16 px
metin, renk + ikon + metin, figürün `useReducedMotion` yöntemi) arayüz ekledi. Görünüm onayı ve son söz sende.

**Eklenen arayüz parçaları**

| Parça                  | Yer                                                       | Durum                                         |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------- |
| `CompanionDock` (pet)  | `src/modules/routine/components/companion/`               | sol menünün altında mount edildi (§4)         |
| `ReminderCenter`       | `src/modules/routine/components/ReminderCenter.tsx`       | yeniden çizildi; `RoutinePage` değişmedi (§1) |
| `MissionBoard`         | `src/modules/routine/components/MissionBoard.tsx`         | yeniden çizildi; `RoutinePage` değişmedi (§3) |
| `MissedCountBadge`     | `src/modules/routine/components/MissedCountBadge.tsx`     | hazır, **yerleştirilmedi** (§2)               |
| `RoutineSettingsPanel` | `src/modules/routine/components/RoutineSettingsPanel.tsx` | hazır, **yerleştirilmedi** (§5, §8)           |
| `ProgressBar` (kit)    | `src/core/ui/ProgressBar.tsx`                             | hazır, envanterde (kendi)                     |
| `Popover` (kit)        | `src/core/ui/Popover.tsx`                                 | hazır, envanterde (Base UI)                   |

**Senin dosyalarına eklenen satırlar (tek satırlık mount/export istisnası)**

- `src/app/layout/Sidebar.tsx`: `import { CompanionDock } from '@modules/routine';` ve `</nav>`'dan sonra
  `<CompanionDock />`. Başka satır değişmedi.
- `src/core/ui/index.ts`: `Popover` ve `ProgressBar` export satırları.

**Emir'den beklenen**

1. `SettingsPage`: `import { RoutineSettingsPanel } from '@modules/routine';` + `<RoutineSettingsPanel />`
   (bildirim anahtarı, demo otomatik yükleme, "önerilen ortamı da uygula", dışa/içe aktarma). Kendi
   "Demo verisini yükle" düğmenle aynı işi yapan "Senaryoyu yükle" düğmesini birleştirmek isteyebilirsin.
2. `Sidebar`: `MissedCountBadge`'i "Rutin" öğesinin yanına (öğe 104 px'te kalmalı; rozet ikon + sayı + metin).
3. "Tüm veriyi sıfırla" (`SettingsPage`): aynı tıklamada `useRoutineStore.getState().resetRoutine()` çağır;
   yoksa rutin ilerlemesi ve pet açık/kapalı durumu eski veriden kalır.
4. Pet: yer ve görünüm onayı. 1366×768'de menü petle birlikte kayar (pet akışta, üst üste binmez).
5. Ekip sayfası (`TeamPage`, §7.7 "bugünkü rutin uyumu %"): `useReminders().byCrew` ile kişi başı ilerleme
   gösterilebilir; `ReminderCenter`'ın "Ekip" görünümü örnek.
6. Bayatlık önerisi (§6), karar senin.

## 1. Hatırlatmalar (ADR-049)

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

**Yapıldı (15.11 akşam):** `ReminderCenter` yeniden çizildi: "Ben / Ekip" `Segmented`, günün `ProgressBar`'ı,
önce `due` → `missed` → `upcoming` → `late` → `done`; satır = `Tile` (saat mono + görev + durum pill'i), `due`
satırında accent sol kenar, metriksiz açık görevde "Yapıldı olarak işaretle". Ekip görünümü: kişi başı yalnız
ilerleme çubuğu. Durum pill'lerinde durum renkleri kullanılmadı (bunlar sağlık durumu değil); yalnız `due` accent.

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

**Hazır:** `MissedCountBadge` (pill: `CircleX` + "N kaçırıldı"; 0 iken render etmez) ve
`RoutineSettingsPanel` içindeki bildirim anahtarı (izin reddedildiyse nedenini yazar).

**Emir'den beklenen:** rozeti `Sidebar`'da "Rutin" öğesinin yanına, paneli `SettingsPage`'e yerleştirmek (§0).

## 3. Oyunlaştırma (ADR-050)

**Ne değişti:** XP, seviye, seri, 5 rozet, ekip skoru ve 4 günlük sağlık görevi gerçek. XP depolanmıyor,
geçmişten türetiliyor: zamanında 10, geç 5, kaçırılan 0, günlük görev 5.

**API:**

```ts
import { useGamification, MissionBoard, BADGE_I18N } from '@modules/routine';

const g = useGamification(); // seçili astronot
// Mira, 30. gün 12:00 (XP_PER_LEVEL = 700):
// { crewId, today: 30, xp: 2970, level: 5, levelProgress: 0.24, streakDays: 29, longestStreak: 29,
//   badges: ['streak-7', 'exercise-week'], newBadgesToday: [], teamScore: 98,
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

**Yapıldı (15.11 akşam):** `MissionBoard` yeniden çizildi: kural cümlesi en üstte; seviye `Tile`'ı (seviye +
toplam XP mono + `ProgressBar` "125 / 700 XP"); seri (`Flame`, en uzun seri) ve ekip skoru `Tile`'ları; günlük
görevler; 5 rozet arması (`Award` çizgi ikon, kazanılan `accent`, kazanılmayan soluk + "Henüz kazanılmadı";
parıltı/konfeti yok, §7.8).

## 4. Astronot pet (ADR-051)

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
astronotu konuşur. "Prototip yardımcı, tıbbi cihaz değil" metni: `routine.companion.disclaimer`. Gerçek
motorla (PR #15) varsayılan demoda Kenji her saatte `alert` (testli: `companionEngine.test.tsx`).

**Yapıldı (15.11 akşam): `CompanionDock` + `CompanionAvatar`** (`src/modules/routine/components/companion/`)

- **Yer:** sol menünün en altında (`mt-auto`), 104×104 düğme: avatar (56 px) + ruh hali etiketi. 1180×820'de
  menünün altında ~127 px boş alan vardı; toast (sağ alt), uyarı şeridi (üst), bölge paneli (sağ sütun) ve
  feragat satırıyla çakışmayan tek köşe burası. Pet akışta olduğu için küçük ekranda menü kayar, üst üste binmez.
- **Balon:** avatara dokununca sağa açılan `Popover` (modal değil, 360 px, Panel tarifi): ruh hali başlığı,
  kısa mesaj, varsa ≥ 104 px yönlendirme düğmesi, "Gizle", prototip notu. Dışarı dokunmak veya Escape kapatır.
  Açık/kapalı `useRoutineStore().companionOpen` ile kalıcı (routine store v2). Mesaj değişince `aria-live=polite`
  (balon kapalıyken de).
- **Katman:** balon `z-30`; yan panel (`z-40`), kırmızı tam ekran uyarı, modal ve toast (`z-50`) her zaman
  üstte. Kırmızı uyarı açıkken pet tamamen örtülü (ekran görüntüsüyle kontrol edildi).
- **Karakter:** özgün, elle çizilmiş küçük bir yardımcı kask; figürün paleti (`--av-suit-*`), sol üst ışık,
  koyu yumuşak vizör, kask lambası. Tasarım belgesi §2 "sevimli değil" kuralı yüzünden yüz yok: ifade,
  vizördeki iki ışık çizgisinin biçimi (yükselen yay / düz / eğik / dik).
- **Ruh hali → görünüm:** `cheerful` nane + `CircleCheck` "Yolunda"; `neutral` accent + `MessageCircle`
  "Hazır"; `concerned` advisory mavisi + `Info` "Hatırlatma"; `alert` warning + `OctagonAlert` "Dikkat" ve
  kalın çerçeve. `concerned` için advisory seçildi: kaçırılan görev bilgilendirme düzeyinde (caution sarısı
  sağlık uyarısına ayrıldı). Kararı değiştirmek istersen tek yer `moodStyle.ts`.
- **Hareket:** yalnız `cheerful`/`neutral`: halka opaklık nefesi (0.85↔1, 4,5 sn, figür halesiyle aynı) ve
  6 sn'de bir kısa göz kırpma (`scaleY`). `concerned`/`alert` sabit; yanıp sönme yok. Azaltılmış hareket
  tercihinde hiç animasyon yok (`useReducedMotion`, `data-animated="false"`).

**Emir'den beklenen:** yer ve görünüm onayı; istersen Durum sayfasına da küçük bir pet satırı.

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

**Hazır:** `RoutineSettingsPanel` "Demo verisi" kartında: önerilen ortamı adıyla gösterir, "Önerileni kullan /
Mevcudu koru" seçici + "Senaryoyu yükle (ortam)" düğmesi. **Emir'den beklenen:** paneli `SettingsPage`'e koymak.

## 6. Bayatlık (staleness.ts) — öneri, karar senin

Egzersizin dinlenme gününden (7., 14. … gün) sonraki gün egzersiz değeri "eski" görünebilir: `isStale`
sıklık × 1,5 kuralını kullanıyor ve `restEveryNDays`'i bilmiyor. Öneri: `exercise` için geçerlilik
penceresine bir dinlenme günü ekle (ör. `restEveryNDays` varsa pencere + 24 sa).

## 7. ADR numaraları

Mühendis 1'in ADR'leri main'e eşitlemede tek blokta toplandı (çakışmalar ve PR #16 birleştirmesinde düşen
bölümler yüzünden):

| Karar                                     | Güncel  | Önceki numaralar |
| ----------------------------------------- | ------- | ---------------- |
| Takvim saatleri ISS gün iskeletine göre   | ADR-047 | 036 → 039 → 045  |
| Demo verisi = takvim                      | ADR-048 | 037 → 040        |
| Hatırlatma durum kuralları                | ADR-049 | 041              |
| Oyunlaştırma                              | ADR-050 | 042              |
| Astronot pet                              | ADR-051 | 043              |
| P2 (autoLoadDemo, dışa/içe aktarma, lazy) | ADR-052 | 044              |

Senin ADR-036 (Durum ekranı), ADR-037 (Kutu sistemi) ve ADR-046 (GitHub Pages) değişmedi; ADR-039 anomali tespiti.

## 8. P2 (arayüzü `RoutineSettingsPanel`'de hazır, yerleşim bekliyor)

`RoutineSettingsPanel` aşağıdakilerin hepsini kart kart sunar: otomatik demo anahtarı, dışa aktar (dosya
indirir), içe aktar (dosya seçer → "Tüm veri değiştirilsin mi?" onayı → sonuç toast'ı; hata metinleri
`routine.settings.importError.*`). Aşağıdaki API notları kendi arayüzünü yazmak istersen geçerli.

- **Demo verisini otomatik yükle** anahtarı: `updateSettings({ autoLoadDemo: boolean })`, varsayılan açık
  (ADR-052). Ayarlar'da açıklamayla göster: "Kapalıyken boş cihazda demo yüklenmez."
- **Dışa aktar:** `exportData()` → JSON metni; dosya olarak indir (`Blob` + `a[download]`, ör.
  `astrovital-backup-<tarih>.json`). Ağ isteği yok.
- **İçe aktar:** dosyayı oku → `importData(text)` →
  `{ ok: true } | { ok: false, error: 'invalidJson'|'invalidFormat'|'unknownCrew', issues: string[] }`.
  İçe aktarma **geri yüklemedir** (mevcut verinin yerine geçer): önce onay iste. Hata metnini çevir;
  `issues`'u ayrıntı olarak göster (çeviriler `routine.settings.importError.*`).
- **Sıfırla:** Ayarlar'daki "Tüm veriyi sıfırla" şu an yalnız core store'u temizliyor. Rutin tamamlamaları
  da gitsin istiyorsan aynı tıklamada `useRoutineStore.getState().resetRoutine()` çağır.
- **Sayfa bazlı yükleme:** Durum dışındaki sayfalar `React.lazy` ile yükleniyor (ADR-052). Görünümde fark yok;
  testte sayfa başlığını `findBy…` ile bekle.
