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

### 2026-11-15 17:10 — Emir (feat/visualization) — 3D astronotun dokusu ve ışığı iyileşti (şekil aynı)

- **Ne:** Giysi artık dokuma kumaş, eklemler fırçalanmış metal, vizör hafif çizikli/lekeli cam, eldiven ve tabanlar
  lastik gibi görünüyor; kumaşta yumuşak kırışık izleri var. Dokular kodla üretiliyor (sabit tohumlu, görüntü dosyası
  ve ağ yok; dört döşenebilir doku, toplam ≈ 0,8 MB) ve UV gerektirmeyen üç yönlü izdüşümle uygulanıyor. Işık:
  ortam ışığı 0,45 → 0,1 (her şeyi düz aydınlatıp gölgeyi siliyordu; parlak malzemeler kendi yansımasını korur),
  yandan daha güçlü ana ışık + ondan tek yumuşak gölge (1024², PCF), dolgu/kenar ışıkları dengelendi, pozlama 1,12.
  Bembeyaz pikseller %20,5 → %5,5. Siluet piksel maskesiyle karşılaştırıldı: varsayılan, 90°, 180° ve tüm vücut
  görünümlerinde 0 piksel fark (şekil, duruş, parçalar değişmedi). Renk kuralı, seçimde şeffaf giysi ve uyarı
  organları aynı; boştayken yine 0 kare çiziliyor, dönerken kare maliyeti ≈ 0,6 → 1,3 ms.
- **Neden:** Kullanıcı isteği: şekli değiştirmeden doku ve ışıklandırmanın geliştirilmesi.
- **Dosyalar:** `src/modules/visualization/components/figure3d/{buildAstronaut,createStage}.ts`,
  `figure3d/surfaceData.ts` (yeni, saf), `figure3d/surfaces.ts` (yeni),
  `src/modules/visualization/__tests__/surfaces.test.ts` (yeni, 14 test).
- **Ekip ne yapmalı:** hiçbir şey.

### 2026-11-15 16:25 — Emir (feat/visualization) — Sayfa ilk açılırken eski astronotun bir an görünmesi düzeltildi

- **Ne:** Ctrl+F5 / ilk yüklemede 3D parça (`three`) inerken yedek olarak eski SVG astronot ve onun kılavuz
  çizgileri bir an çiziliyor, ardından 3D astronot geliyordu. Artık 3D parça yüklenirken figür alanı boş kalır
  (etiketler görünür ve kullanılabilir), çizgiler 3D figürün ilk karesiyle birlikte gelir. SVG figür yalnız WebGL
  olmayan cihazda veya WebGL bağlamı kaybolunca görünür. 3D astronotun görünüşü değişmedi.
- **Neden:** Kullanıcı hatası: yeni astronottan önce eskisi yanıp sönüyordu (Suspense yedeği SVG figürdü).
- **Dosyalar:** `src/modules/visualization/components/BodyMap.tsx`,
  `src/modules/visualization/__tests__/BodyMap.loading.test.tsx` (yeni; düzeltmeden önce kırmızı, sonra yeşil).
- **Ekip ne yapmalı:** hiçbir şey.

### 2026-11-15 14:30 — Emir (feat/visualization) — 3D döndürülebilir astronot, dışarı dokununca kapanan bölge paneli, LED kutular, EN/TR'de sabit yerleşim

- **Ne:**
  - **3D astronot (Durum):** önden bakan, kodla kurulmuş EVA giysisi + organlar (beyin, göz, kalp, akciğer,
    böbrek, iskelet, kas, damar, bağışıklık). Tek parmakla sürükle = 360° döndür (ataletli), iki parmak / tekerlek =
    yakınlaş. Bir bölgeye (etiket veya figür üzerinde dokunma) dokununca kamera oraya gider (böbrekler arkadan),
    giysi şeffaflaşır, organ durum renginde görünür; aynı bölge tekrar = kapat, figür dışı = kapat. Uyarıdaki
    organlar seçim yokken giysinin içinden parlar. "Görünümü sıfırla" (104 px) yalnız görünüm değiştiyse; klavye:
    ← → döndür, + − yakınlaş, 0 sıfırla. `three` ayrı parça (≈ 150 KB gzip), boştayken kare çizilmez; WebGL yoksa SVG figür.
  - **Bölge paneli dışarı dokunuşla kapanır:** panel dışında herhangi bir yere dokunmak kapatır ve o dokunuşun
    kendi işi de olur (Acil tek dokunuşta açılır). Sürükleme/kaydırma kapatmaz.
  - **LED kutular:** her panelin ve bölge etiketinin kenarında LED şerit; seçili astronotun durumuna göre:
    normal sönük ve sabit, advisory mavi, caution sarı akan ışık, warning kırmızı akan ışık + nabız gibi hale.
    Azaltılmış harekette hareket yok.
  - **EN/TR'de sabit yerleşim:** 1180×820'de 7 sayfada dil değişince > 2 px kayan yapısal kutu 102 → 0 (üst bar
    düğmeleri sabit genişlik, `PageHeader` sağ sütunu 36rem, yer tutucu/eski veri metni iki satır yer ayırır,
    zaman aralığı eşit seçenekli, Acil/Ayarlar satırları sabit). Yolda iki hata düzeldi: değer rayında eski veri
    ipucu alttaki satırın üstüne biniyordu; `Segmented`'te seçilen seçenek kalınlaşınca komşularını itiyordu.
  - **Referans projelerden:** bölümlerin sırayla süzülerek girişi, buzlu cam üst bar, nefes alan canlı noktası,
    3D sahnede HUD köşe parantezleri, global azaltılmış hareket koruması.
- **Neden:** Kullanıcı isteği (figür düz baksın, 360° dönsün, yakınlaşıp organ görünsün; tablette dışarı dokunuşla
  kapanma; dil değişince yapı oynamasın; acil durumda kutular parlasın). Karar ve alternatifler: ADR-053.
- **Dosyalar:** `package.json`, `package-lock.json` (`three`, `@types/three`), `.gitignore` (`.playwright-mcp/`),
  `src/modules/visualization/components/figure3d/*` (yeni: anatomy, orbit, gesture, pick, colours, buildAstronaut,
  createStage, AstronautStage, leaders, stageTypes, webgl), `components/{BodyMap,RegionLabel,VitalsPanel}.tsx`,
  `src/core/ui/{Sheet,Card,Segmented,StatusLine,VitalRow,PlaceholderNotice}.tsx`, `src/core/ui/tokens.css`, `src/index.css`,
  `src/app/layout/{AppShell,TopBar,EnvironmentPicker,CrewPicker}.tsx`, `src/app/providers/{AppProviders,LedSync}.tsx`,
  `src/app/providers/ledLevel.ts`, `src/app/pages/{StatusPage,PageHeader,HistoryPage,EmergencyPage,SettingsPage}.tsx`,
  `src/core/i18n/{en,tr}.json` (`visualization.stage.*`), testler: `visualization/__tests__/{orbit,gesture,anatomyPick,buildAstronaut,AstronautStage,leaders3d}`,
  `core/ui/__tests__/{Sheet,ledAndLayout,boxes}`, `app/__tests__/{ledLevel,LedSync,pageLayout}`;
  docs: `DECISIONS.md` (ADR-053), `CONTRACTS.md`, `TEAM.md` (UI kit), `SETUP_CHECK.md` § 5, UI spec §8 notu,
  `specs/2026-11-15-astrovital-3d-bodymap-design.md` (yeni), `src/modules/visualization/CLAUDE.md`.
- **Ekip ne yapmalı:**
  - `git pull` sonrası **`npm install`** (yeni bağımlılık `three`).
  - **Mühendis 1:** `Sheet` (`dismissOnOutsideTap`), `tokens.css` (LED, `@layer components` içinde `.card-surface`),
    `LedSync` sağlayıcısı onayınızda. Panel iç boşluğu artık 22 px + 2 px LED kenar (dış ölçü aynı); `border-2`
    kullanan `AlertStrip`/`Toast` içte 2 px daha dar.
  - **Mühendis 3 (assessment):** `assessMeasurement` hâlâ Faz 0 taslağı ve her şeye "nominal" diyor — Ölçüm'de
    SpO₂ 89 girildi, eşik tablosuna göre warning olmalıydı, "Nominal" göründü. Motor bitene kadar LED parlaması ve
    organ uyarı görünümü gerçek veride çıkmaz.
  - **Herkes:** yeni metin kutularında dil metni kutu boyutunu belirlemesin (sabit genişlik/yükseklik veya iki
    satır yer + kısaltma, tam metin `title`'da). Yer tutucu metinler artık iki satırla sınırlı.
  - Durum sayfası açıldıktan sonraki ≈ 600 ms içinde bölge açılırsa giriş animasyonu yüzünden panel 10 px'e
    kadar kayık ölçülebilir (bilinen küçük sınır).
### 2026-11-15 20:10 — Muhammed Bektaş (feat/core-routine) — Hata: ilk açılışta "6 görev kaçırıldı" bildirimi; demo metriksiz görevleri

- **Ne:** Boş tarayıcıda ilk açılışta, kusursuz uyumlu Mira için "6 tasks were missed today" çıkıyordu. Demo
  verisi doğruydu (Mira'da kaçırılan 0). Neden: bildirici ilk render'da, demo verisi yüklenmeden önceki boş
  listeyi değerlendiriyor ve sabahın 6 görevini kaçırıldı sayıyordu. Artık yalnız oturum sırasında yeni
  açılan veya yeni kaçırılan görev bildiriliyor; açılışta, astronot değişince ve demo yüklenince geçmiş
  durumlar sessizce işaretleniyor. Ayrıca demo yüklenince metriksiz görevler (haftalık özet, aylık
  muayene/anket) hikâyeye uygun "zamanında yapıldı" sayılıyor (Kenji son 2 günde yapmıyor). Haftalık özet
  gününde öğleden sonra herkes "kaçırdı" görünmüyor. XP tablosu güncellendi (Mira 3.080 …).
- **Neden:** Kural: demo verisi yüklendiği ana kadar takvimle tutarlı; hikâyesinde kaçırma olmayan kişide
  `missed` = 0 (ADR-048 güncelleme 2, ADR-049 güncelleme).
- **Dosyalar:** `src/modules/routine/components/{ReminderNotifier,DemoRoutineSync}.tsx`,
  `src/modules/routine/services/demoCompletions.ts` (yeni), `src/modules/routine/store/{useRoutineStore,dataTransferActions}.ts`
  (`demoCompletionsFor`, store v3), `src/modules/routine/index.ts`, `src/app/providers/AppProviders.tsx`
  (`<DemoRoutineSync />`), testler (`firstLoad.test.tsx` yeni, `ReminderNotifier.test.tsx`, `companionUi.test.tsx`),
  `docs/DECISIONS.md`, `docs/DEMO_CREW_STORIES.md`, `docs/HANDOFF_ENGINEER4.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Hiçbir şey; tarayıcıda eski demo verisi varsa Ayarlar → Sıfırla → Demo verisini yükle.
  Bildirim testi yazan: açılışta toast beklemeyin, saati ilerletin (`firstLoad.test.tsx` örneği).

### 2026-11-15 19:40 — Muhammed Bektaş (feat/core-routine) — Devir notu: eklenen arayüz, Emir'den beklenenler

- **Ne:** `docs/HANDOFF_ENGINEER4.md`'ye §0 eklendi: Mühendis 1'in eklediği arayüz parçaları (pet,
  yeniden çizilen rutin panelleri, `MissedCountBadge`, `RoutineSettingsPanel`, kit `ProgressBar`/`Popover`),
  Emir'in dosyalarına eklenen satırlar (`Sidebar.tsx` mount, `core/ui/index.ts` export) ve "Emir'den
  beklenen" listesi. Pet bölümü yer, katman, karakter, ruh hali ve hareket kurallarıyla güncellendi;
  ADR-051'e arayüz notu eklendi.
- **Neden:** Görünümün sahibi visualization (ADR-032); bağlama ve onay işi tek yerde.
- **Dosyalar:** `docs/HANDOFF_ENGINEER4.md`, `docs/DECISIONS.md` (ADR-051 notu), `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: pet ve rutin ayarları eklendi — `docs/HANDOFF_ENGINEER4.md` "Emir'den beklenen"
  listesine bak; dokunduğum dosyalar: `src/app/layout/Sidebar.tsx` (import + `<CompanionDock />`),
  `src/core/ui/index.ts` (2 export). Mühendis 3: DEMO_CREW_STORIES beklenen tablo motorla karşılaştırıldı —
  fark listesi 18:15 kaydında (tek fark Lucas: kişisel baseline kuralı yok).

### 2026-11-15 19:25 — Muhammed Bektaş (feat/core-routine) — RoutineSettingsPanel: bildirim, demo, senaryo ortamı, yedek

- **Ne:** Kendi başına çalışan bir ayarlar bloğu (üç kart): tarayıcı bildirimleri (açınca izin ister;
  reddedildiyse nedenini söyler), "açılışta demo verisini yükle", senaryoyu önerilen ortamla ya da mevcut
  ortamda yükle, veriyi dosyaya dışa aktar / dosyadan içe aktar (içe aktarma onay penceresi ister; bozuk
  dosyada hiçbir şey değişmez ve nedeni söylenir). Ayarlar sayfasına henüz bağlanmadı.
- **Neden:** P2 ve bildirim mantığı hazırdı ama arayüzde yeri yoktu; `SettingsPage` Emir'in dosyası.
- **Dosyalar:** `src/modules/routine/components/RoutineSettingsPanel.tsx` (yeni), `src/modules/routine/index.ts`,
  test `routineSettings.test.tsx`, `src/core/i18n/{en,tr}.json` (`routine.settings.*`), `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `SettingsPage`'e `import { RoutineSettingsPanel } from '@modules/routine';` ve
  uygun yere `<RoutineSettingsPanel />` ekle. Kendi "Demo verisini yükle" düğmenle çakışırsa birleştir.

### 2026-11-15 19:05 — Muhammed Bektaş (feat/core-routine) — Rutin ekranı: hatırlatma ve görev panelleri tasarım diline geçti

- **Ne:** `ReminderCenter` artık "Ben / Ekip" seçicili. Ben: günün ilerleme çubuğu ("6 / 10 yapıldı · 0
  kaçırıldı"), önce yapılacak olanlar; her satırda saat (mono), görev ve durum pill'i (ikon + metin; "Geç
  yapıldı" kendi ikonu ve kelimesiyle). Metriksiz görevlerde "Yapıldı olarak işaretle" düğmesi var. Ekip: dört
  kişi, yalnız görev ilerlemesi (tıbbi değer ve durum yok). `MissionBoard`: kural cümlesi, seviye + XP çubuğu
  (`ProgressBar`), seri (en uzun dahil), ekip skoru, günlük görevler, 5 rozet arması (kazanılmayan soluk ve
  "Henüz kazanılmadı"). Yeni `MissedCountBadge` ("N kaçırıldı"; henüz yerleştirilmedi).
- **Neden:** Çalışır-sade sürümler Rutin sayfasında görünüyordu; tasarım belgesi §7.7–7.8 ve kutu sistemi (ADR-037).
- **Dosyalar:** `src/modules/routine/components/{ReminderCenter,MissionBoard,MissedCountBadge}.tsx`,
  `src/modules/routine/components/reminderStatusIcon.ts` (yeni), `src/modules/routine/index.ts`,
  test `routineUi.test.tsx`, `src/core/i18n/{en,tr}.json` (`routine.reminders.*`, `routine.missions.*`), `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `RoutinePage` değişmedi, paneller otomatik yeni görünümde. `MissedCountBadge`'i
  Rutin menü öğesinin yanına sen yerleştir (`docs/HANDOFF_ENGINEER4.md` "Emir'den beklenen").

### 2026-11-15 18:45 — Muhammed Bektaş (feat/core-routine) — Astronot pet arayüzü (CompanionDock) + kit: ProgressBar, Popover

- **Ne:** Sol menünün altında pet görünüyor: elle çizilmiş, özgün bir yardımcı kask (figürle aynı palet ve
  ışık; karikatür yüz yok, ifade vizördeki iki ışık çizgisi). Dört ruh hali renk + ikon + metinle ayrışıyor
  (Yolunda / Hazır / Hatırlatma / Dikkat; Dikkat'te kalın uyarı çerçevesi, yanıp sönme yok). Sakin hallerde
  hafif nefes ve seyrek göz kırpma var; azaltılmış hareket tercihinde hiç animasyon yok. Avatara dokununca
  sağa doğru konuşma balonu açılıyor: kısa mesaj, varsa ≥ 104 px yönlendirme düğmesi, "Gizle". Açık/kapalı
  durumu hatırlanıyor (routine store v2). Kırmızı tam ekran uyarı, yan panel ve toast'lar balonun üstünde
  kalıyor. Kit'e iki genel parça eklendi: `ProgressBar` (kendi) ve `Popover` (Base UI).
- **Neden:** Pet mantığı (ADR-051) hazırdı ama arayüzde yeri yoktu; kit envanterinde ikisi de boştaydı.
- **Dosyalar:** `src/modules/routine/components/companion/{CompanionAvatar,CompanionDock}.tsx`, `moodStyle.ts` (yeni),
  `src/modules/routine/store/useRoutineStore.ts` (`companionOpen`, v2 + migrate), `src/modules/routine/index.ts`,
  `src/core/ui/{ProgressBar,Popover}.tsx` (yeni), `src/core/ui/index.ts` (2 export satırı),
  `src/app/layout/Sidebar.tsx` (**Emir'in dosyası: yalnız import + `<CompanionDock />` mount**), testler
  (`companionUi.test.tsx`, `ProgressPopover.test.tsx`), `src/core/i18n/{en,tr}.json` (`routine.companion.*`),
  `docs/TEAM.md` (kit envanteri), `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `Sidebar.tsx`'e ve `core/ui/index.ts`'e yalnız mount/export satırları eklendi;
  görünüm onayı ve gerekirse yeri sende (`docs/HANDOFF_ENGINEER4.md`). 1366×768'de menü kayabilir (pet akışta).

### 2026-11-15 18:15 — Muhammed Bektaş (feat/core-routine) — Demo hikâyeleri gerçek motorla doğrulandı

- **Ne:** PR #15'in değerlendirme motoruyla varsayılan demoda (seed 2026, ISS) dört astronot, 30. günün
  beş farklı saatinde hesaplandı. Mira nominal, Kenji warning/CMO, Selin caution: tabloyla aynı. Lucas
  nominal, beklenen advisory. Fark kural eksikliğinden: motorda kişisel baseline sapma kuralı yok.
  Simülasyonda ayar gerekmedi; motor değiştirilmedi. Yeni test: pet gerçek motorla Kenji için `alert`
  döndürüyor, diğerleri için döndürmüyor.
- **Neden:** Motor stub'tan gerçeğe geçti; beklenen durum tablosunun tutup tutmadığını görmek.
- **Dosyalar:** `src/modules/routine/__tests__/companionEngine.test.tsx` (yeni), `docs/DEMO_CREW_STORIES.md`
  (tablo "Gerçek motor" sütunu + karşılaştırma notu), `CHANGELOG.md`
- **Ekip ne yapmalı:** Mühendis 3: DEMO_CREW_STORIES beklenen tablo motorla karşılaştırıldı. Tek fark Lucas
  (advisory yerine nominal): kişisel baseline (+9 mmHg / son 10 gün) kuralı gerekiyor. Ruh hali tam sayı
  trend notu duruyor.

### 2026-11-15 18:00 — Muhammed Bektaş (feat/core-routine) — Karma görevde bilinçli kaçırma/gecikme (uyum hikâyeleri)

- **Ne:** Demo verisinde artık uyum farkı var. Mira kusursuz. Kenji hastalığın son 2 gününde egzersiz ve
  akşam ruh hali girmiyor, 29. günün sabah vitallerini geç giriyor. Selin son 10 günde 3 akşam ruh halini
  atlıyor. Lucas son 7 günde 2 egzersizi atlıyor. Dört kişinin XP'si ve serisi artık farklı (ör. 30. gün
  sonunda seri 30 / 0 / 2 / 3). Diğer bütün ölçüm değerleri aynı kaldı (atlanan slot da rastgele sayı
  tüketir), motorun dört durumu değişmedi.
- **Neden:** Oyunlaştırma ve pet demoda ayrışmıyordu (herkes aynı XP/seri). ADR-048 güncellendi.
- **Dosyalar:** `src/core/simulation/{scenarios,generator,index}.ts` (`adherence`, `SlotAdherence`, `MIXED`),
  `src/core/simulation/__tests__/generator.test.ts`, `src/modules/routine/__tests__/demoAdherence.test.ts` (yeni),
  `docs/DECISIONS.md` (ADR-048), `docs/DEMO_CREW_STORIES.md` (Uyum satırları + tablo), `CHANGELOG.md`
- **Ekip ne yapmalı:** Demo'da Kenji/Selin/Lucas için geçmiş günlerde "kaçırıldı" ve "geç yapıldı" görünür;
  bu kasıtlı. Tarayıcıda eski demo verisi varsa Ayarlar → Sıfırla → Demo verisini yükle. "Her takvim
  görevi her gün yanıtlanır" varsayan bir testin varsa `nominal` senaryo kullan.

### 2026-11-15 17:40 — Muhammed Bektaş (feat/core-routine) — Seviye eşiği 700 XP (kusursuz bir hafta ≈ 1 seviye)

- **Ne:** `XP_PER_LEVEL` 100 → 700. Kusursuz bir ISS haftası (~10 ölçüm görevi/gün × 10 XP) yaklaşık bir
  seviye eder. Önceden demo mürettebatı 30. günde seviye 30'du.
- **Neden:** Seviye her gün atlıyordu; ilerleme anlamsızdı (ADR-050 notu).
- **Dosyalar:** `src/modules/routine/services/levels.ts`, `src/modules/routine/__tests__/routine.test.tsx`,
  `docs/DECISIONS.md` (ADR-050), `CHANGELOG.md`
- **Ekip ne yapmalı:** Seviye sayısını sabit varsayan ekran/test varsa güncelle (demo 30. günde artık ≈ seviye 5).

### 2026-11-15 17:30 — Muhammed Bektaş (feat/core-routine) — core-routine ADR'leri 047–052; PR #16 birleştirmesinde düşen bölümler geri eklendi

- **Ne:** PR #16'nın main ile GitHub'da birleştirilmesinde (`1271079`) `docs/DECISIONS.md`'den ADR-041–044
  (hatırlatma durumları, oyunlaştırma, pet, P2) ve CHANGELOG'dan Mühendis 1'in 15.11 tarihli 12 kaydı
  düşmüştü; ikisi de `503d21b`'den geri eklendi (başka kayıtların sırası ve içeriği değişmedi). Mühendis 1'in
  altı ADR'i main'deki en yüksek numaradan (ADR-046, GitHub Pages) sonra tek blokta toplandı: takvim saatleri
  **047** (önce 045), veri = takvim **048** (önce 040), hatırlatma durumları **049**, oyunlaştırma **050**,
  pet **051**, P2 **052**. Tüm referanslar (dokümanlar, kod yorumları, test başlıkları, bu dosyadaki kayıtlarım;
  numara değişikliğini anlatan iki eski kayıt hariç) güncellendi. ADR-036/037/039/046 değişmedi.
- **Neden:** Kod ve dokümanlar başlığı olmayan ADR'lere atıf yapıyordu; numaralar artık tekil ve sıralı.
- **Dosyalar:** `docs/DECISIONS.md`, `CHANGELOG.md`, `docs/{ROUTINE_SCHEDULE,DEMO_CREW_STORIES,HANDOFF_ENGINEER4,CONTRACTS,SOURCES}.md`,
  `docs/modules/core-routine.md`, `src/core/config/sources.config.ts`, `src/core/simulation/generator.ts`,
  `src/core/store/useHealthStore.ts`, `src/app/router.tsx`, `src/app/providers/DemoDataBootstrap.tsx`,
  `src/modules/routine/**` (yorumlar), testler (yalnız başlık/yorum)
- **Ekip ne yapmalı:** Mühendis 1'in kararları için 047–052 kullanın; sıradaki boş numara 053. GitHub'ın
  "Resolve conflicts" ekranı `CHANGELOG.md merge=union` kuralını kullanmaz ve bölüm düşürebilir: çakışmayı
  yerelde `git merge origin/main` ile çözün (`.gitattributes` notu).
### 2026-11-15 17:25 — Emir Efe Pekcan (docs/pages-back-to-actions) — Pages yine otomatik: her merge siteyi günceller

- **Ne:** Pages kaynağı tekrar "GitHub Actions" (`build_type: workflow`); elle tetiklenen
  "Deploy to GitHub Pages" yayını 38 saniyede başarılı oldu, https://emir-pek.github.io/astroVital/ ve
  tüm asset'leri 200 dönüyor. Geçici `gh-pages` branch'i silindi. ADR-046'daki "elle yayın gerekiyor"
  notu düzeltildi. **Bu kaydın altındaki 17:05 kaydı artık geçersiz:** faturalama kilidi teşhisi
  yanlıştı, Actions 13:51 UTC'den beri normal çalışıyor; kart eklemeye gerek yok.
- **Neden:** Actions birkaç dakikalık bir kesintiden sonra kendiliğinden düzeldi; yedek yöntem
  gereksiz kaldı ve main'e yapılan merge'lerin siteye yansımasını engelliyordu.
- **Dosyalar:** `docs/DECISIONS.md` (ADR-046), Pages repo ayarı, `gh-pages` branch'i (silindi).
- **Ekip ne yapmalı:** Hiçbir şey. main'e her merge siteyi otomatik günceller. Repo sayfasındaki
  "Deployments" listesinde her merge bir `github-pages` satırı ekler, bu normal.

### 2026-11-15 17:05 — Emir Efe Pekcan (docs/fix-adr-039-duplicate) — Pages şu an `gh-pages` branch'inden elle yayınlanıyor; ADR numarası düzeltildi

- **Ne:** Hesap genelinde faturalama kilidi (`github.com/settings/billing` → Actions/Codespaces/
  Packages `Usage blocked`) yüzünden `deploy-pages.yml` hiç çalışmadı. Geçici olarak klasik
  "Deploy from a branch" kullanıldı: `npm run build` çıktısı `gh-pages` branch'ine elle commit'lendi,
  Pages ayarı o branch'e çevrildi. Site **şu an canlı ve doğrulandı**: https://emir-pek.github.io/astroVital/
  Ayrıca aynı anda birleşen branch'ler yüzünden `docs/DECISIONS.md`'de iki ayrı karar "ADR-039" olmuştu
  (GitHub Pages + anomali tespiti) — benimki **ADR-046**'ya taşındı.
- **Neden:** Teslim linki bu gece lazım; faturalama ancak hesap sahibi tarafından açılabilir, onu
  beklemeden siteyi canlıya almak gerekti.
- **Dosyalar:** `docs/DECISIONS.md` (ADR-046), `gh-pages` branch'i (yeni, kod review'a girmez).
- **Ekip ne yapmalı:** Şimdilik `main`'e merge siteyi **otomatik güncellemiyor** — bir sonraki demo
  öncesi `npm run build` + `gh-pages` branch'ine commit (adımlar ADR-046'da) elle tekrarlanmalı, YA DA
  Emir faturalama kilidini açar açmaz `gh api PUT repos/Emir-pek/astroVital/pages
  -f build_type=workflow` çalıştırılıp otomatik yayına geri dönülür. `docs/DECISIONS.md`'de başka
  numara çakışmaları da var (ADR-039/040/044/045 sırasız) — tam düzeltme ayrı, koordineli bir iş.

### 2026-11-15 16:52 — Muhammed Bektaş (feat/core-routine) — ADR-039 çakışması: takvim saatleri kararı ADR-045 oldu

- **Ne:** main'den gelen anomali tespiti kararı (PR #14) ADR-039 numarasını aldı; Mühendis 1'in "Takvim
  saatleri ISS gün iskeletine göre" kararı (önce ADR-036, sonra ADR-039) **ADR-045**'e taşındı. Anomali
  ADR-039'u ve ona verilen referanslar (`CLAUDE.md`, ARCHITECTURE, SETUP_CHECK, `.gitignore`) değişmedi.
  Takvim saatlerine verilen referanslar güncellendi. Ayrıca birleştirmede `boxSystem.test.ts` listesine geri
  giren, zaten taşınmış üç assessment dosyası listeden çıkarıldı (ayrı commit).
- **Neden:** Tekil ADR numarası; referanslar belirsiz kalmasın.
- **Dosyalar:** `docs/DECISIONS.md`, `docs/ROUTINE_SCHEDULE.md`, `docs/HANDOFF_ENGINEER4.md`,
  `docs/modules/core-routine.md`, `docs/SOURCES.md`, `src/core/config/sources.config.ts` (yorum),
  `src/core/simulation/generator.ts` (yorum), `src/core/simulation/__tests__/generator.test.ts` (başlık), `CHANGELOG.md`
- **Ekip ne yapmalı:** Takvim saatleri kararı için ADR-045 kullanın. ADR-039 = anomali tespiti. Sıradaki boş numara 046.

### 2026-11-15 16:37 — Emir Efe Pekcan (chore/github-pages) — Proje GitHub Pages'te herkese açık yayında

- **Ne:** Yeni iş akışı `.github/workflows/deploy-pages.yml`: `main`'e her push'ta (ve elle
  `workflow_dispatch` ile) uygulamayı derler ve GitHub Pages'e yayınlar. Pages ayarı "Source: GitHub
  Actions" olarak açıldı (`gh api POST .../pages -f build_type=workflow`). Canlı link README'nin en
  üstüne eklendi: **https://emir-pek.github.io/astroVital/**. `base: './'` ve hash router (ADR-007)
  zaten uygundu, değiştirilmedi. ADR-039 (`docs/DECISIONS.md`) kararı kayda geçirdi.
- **Neden:** Teslim için jürinin hesap/şifre olmadan tıklayıp açabileceği herkese açık bir link
  şartı vardı (`docs/PROJECT_BRIEF.md`).
- **Dosyalar:** `.github/workflows/deploy-pages.yml` (yeni), `README.md`, `docs/DECISIONS.md` (ADR-039).
- **Ekip ne yapmalı:** Hiçbir şey. `main`'e her merge siteyi birkaç dakika içinde otomatik günceller;
  canlı link README'de. Mevcut `ci.yml`'e dokunulmadı, ayrı ve bağımsız çalışıyor.

### 2026-11-15 16:30 — Muhammed Bektaş (feat/core-routine) — Mühendis 4'e devir notları (HANDOFF_ENGINEER4)

- **Ne:** Yeni `docs/HANDOFF_ENGINEER4.md`: bugünkü mantık işlerinin (hatırlatmalar, bildirim, kaçırılan
  rozeti, oyunlaştırma, pet, ortam/senaryo, bayatlık önerisi, ADR numaraları, P2) her biri için ne değişti,
  kullanılacak API, ekran kuralları, isteğe bağlı fikirler ve revize edilecek ekran. `docs/modules/visualization.md`
  en üstüne tek satır işaretçi eklendi (başka içerik değişmedi).
- **Neden:** Görünüm visualization'da (ADR-032); bağlama işinin kurallarıyla birlikte tek yerde olması.
- **Dosyalar:** `docs/HANDOFF_ENGINEER4.md` (yeni), `docs/modules/visualization.md` (1 satır),
  `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `docs/HANDOFF_ENGINEER4.md`'yi oku. `ReminderCenter` ve `MissionBoard` çalışır-sade,
  restyle sende. Pet, bildirim anahtarı, kaçırılan rozeti ve `applyScenario` bağlanacak. Benim çakışan iki
  ADR'im yeniden numaralandı (039, 040). Mühendis 3: `useCompanion` uyarı durumunu `useCrewHealth`'e dayandırıyor.

### 2026-11-15 16:25 — Emir Efe Pekcan (feat/assessment) — Değerlendirme motoru gerçek kurallarla çalışıyor (Faz 0 stub kaldırıldı)

- **Ne:** `assessMeasurement`/`assessCrew` artık her zaman "normal" dönen Faz 0 stub'ı değil, gerçek
  kural motoru. Bildirilen hata düzeltildi: **38.5 °C ateşi olan biri artık "normal" değil, ISS'te
  "kırmızı/CMO'ya haber ver" çıkıyor** (eşik bandı + ortam kaydırması hiç uygulanmıyordu). Eklenenler:
  `engine/bands.ts` (ortam düzeltmeli bant arama), `engine/radiation.ts` (kümülatif radyasyon +
  SPE kuralı: günlük doz > 5× ortam beklentisi → kırmızı/flight_surgeon/sığınak), `engine/trend.ts`
  (pencereyi ikiye bölüp ortalama kıyaslayan trend — tek günlük gürültünün sonucu tek başına
  çevirmesini önler; "3 ölçüm üst üste kötüleşme → CMO"), `engine/sustained.ts` (ardışık gün
  kuralları — aradaki eksik gün zinciri bozar), `engine/escalation.ts` (Mars/otonom: yalnız
  flight_surgeon seviyesi emergency'ye yükselir, CMO seviyesi zaten gemide olduğu için yükselmez),
  `engine/recommendations.ts` (öneri kütüphanesi: dinlenme/hidrasyon/egzersiz/beslenme/radyasyon
  sığınağı/psikolojik destek/CMO-flight surgeon iletişimi, kırmızıda zorunlu "yeniden ölç").
  `assessCrew`'e "aynı bölgede ≥2 sarı → CMO" kuralı eklendi. `docs/DEMO_CREW_STORIES.md`'deki
  `mixed_mission` tablosu artık motorla kilitli: crew-1 nominal, crew-2 (Kenji) warning/CMO, crew-3
  (Selin) caution/self_care; crew-4 (Lucas) için beklenen `advisory` henüz üretilmiyor (ADR-031,
  kişisel baseline kuralı P1/sonraki iş — bug değil, bilinen kapsam dışı). Ayrıca `AlertCenter`,
  `LearnPanel`, `RecommendationList` kutu sistemine taşındı (Emir'in 11-15 02:15 kaydındaki "Ekip ne
  yapmalı" listesinden çıkarıldı — `boxSystem.test.ts`'teki `PENDING_MIGRATION` güncellendi).
- **Neden:** Motor Faz 0'da kasıtlı olarak her şeyi "normal" döndürüyordu (görselleştirme/rutin
  ekiplerinin beklemeden ilerleyebilmesi için); bu artık gerçek değerlendirmeyi engelliyordu —
  jüri demosunda hiçbir uyarı/renk görünmüyordu. `docs/modules/assessment.md` P0 listesi bu işi
  tanımlıyordu.
- **Dosyalar:** `src/modules/assessment/engine/{bands,radiation,trend,sustained,escalation,
recommendations,assessMeasurement,assessCrew}.ts`, `src/modules/assessment/engine/__tests__/*`
  (yeni; `__tests__/engine.stub.test.ts` silindi), `src/modules/assessment/components/
{AlertCenter,LearnPanel,RecommendationList}.tsx`, `src/core/ui/__tests__/boxSystem.test.ts`,
  `src/core/i18n/{en,tr}.json` (`assessment.explanation.*`, `assessment.radiation.spe`,
  `assessment.recommendations.*` yeni anahtarlar), `docs/modules/assessment.md`, `docs/TEAM.md`.
- **Ekip ne yapmalı:** `npm install` (bu oturumda `@base-ui/react` ve diğer bazı paketler
  `node_modules`'ta eksikti — `feat/visualization` merge'ünden sonra kurulmamıştı, bağımlılık
  değişmedi, yalnız yerel kurulum eksikti). Motor artık gerçek sonuç ürettiği için **visualization
  ve routine ekranlarında artık gerçek sarı/kırmızı durumlar görünecek** — demo öncesi bir göz atın.

### 2026-11-15 16:15 — Muhammed Bektaş (feat/core-routine) — Sayfa bazlı kod bölme (React.lazy)

- **Ne:** Durum dışındaki sayfalar ilk ziyarette ayrı parça olarak yüklenir. Ana JS parçası 965 kB'tan
  562 kB'a indi (gzip 311 → 180 kB). Görünüm ve rotalar değişmedi; parçalar aynı klasörden gelir (offline).
- **Neden:** ADR-021'deki boyut uyarısı, P2 görevi (ADR-052).
- **Dosyalar:** `src/app/router.tsx`, `docs/DECISIONS.md` (ADR-052), `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Rota testlerinde sayfa başlığını `getBy…` yerine `findBy…` ile bekleyin (sayfa artık
  bir mikro görev sonra gelir). Mevcut testler zaten `findBy` kullanıyor.

### 2026-11-15 16:00 — Muhammed Bektaş (feat/core-routine) — Veri dışa/içe aktarma (JSON yedek, mantık)

- **Ne:** `exportData()` tüm veriyi (ölçümler, mürettebat, ayarlar, rutin tamamlamaları) JSON metni olarak
  verir; `importData(json)` dosyayı Zod ile doğrulayıp geri yükler. Geçersiz dosyada hiçbir şey değişmez
  ve hatanın yeri söylenir ("measurements.0.metric: …"). Ölçümler kendi kaynağını (kamera, klavye,
  simüle) korur. Yeni core store aksiyonu `replaceData`. Arayüz yok.
- **Neden:** P2 görevi (ADR-052).
- **Dosyalar:** `src/modules/routine/services/dataTransfer.ts`, `src/modules/routine/store/dataTransferActions.ts` (yeni),
  `src/modules/routine/index.ts`, `src/core/store/useHealthStore.ts` (`replaceData`), test `dataTransfer.test.ts`,
  `docs/DECISIONS.md` (ADR-052), `docs/CONTRACTS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: Ayarlar'a "Dışa aktar" (metni dosya olarak indir) ve "İçe aktar" (dosyayı oku,
  sonucu göster) butonları. Ayrıntı: `docs/HANDOFF_ENGINEER4.md`.

### 2026-11-15 15:40 — Muhammed Bektaş (feat/core-routine) — Ayar: demo verisini otomatik yükle (autoLoadDemo)

- **Ne:** Yeni ayar `settings.autoLoadDemo` (varsayılan açık). Kapalıyken boş cihazda demo verisi
  kendiliğinden yüklenmez. "Tüm veriyi sıfırla" bu tercihi korur. Kayıtlı veri şeması v1 → v2; eski
  tarayıcı verisi otomatik taşınır (ayar açık gelir), elle bir şey yapmak gerekmez.
- **Neden:** ADR-009'daki "gerçek kullanımda kapatılabilmeli" notu (ADR-052).
- **Dosyalar:** `src/core/store/useHealthStore.ts`, `src/app/providers/DemoDataBootstrap.tsx`,
  test `src/app/__tests__/demoBootstrap.test.tsx`, `docs/DECISIONS.md` (ADR-009 notu, ADR-052),
  `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: Ayarlar'a anahtar (`updateSettings({ autoLoadDemo })`). Store kullanan testlerde
  `settings` nesnesini birebir karşılaştıran varsa yeni alanı ekle.

### 2026-11-15 15:20 — Muhammed Bektaş (feat/core-routine) — Ortam değişim bildirimi ve applyScenario

- **Ne:** Ortam değişince tek bir toast çıkar ("Ortam: Mars üssü. Hatırlatma takvimi ve eşikler
  güncellendi."); bileşen görünmez, `app/providers`'ta mount edildi. Yeni store aksiyonu
  `applyScenario(scenarioId, { withRecommendedEnvironment })`: senaryonun demo verisini yükler, istenirse
  senaryonun önerdiği ortamı da uygular. Store şeması değişmedi (persist version aynı).
- **Neden:** core-routine P0 mantık maddeleri; Ayarlar'ın görünümü visualization'da (ADR-032).
- **Dosyalar:** `src/modules/routine/hooks/useEnvironmentChangeNotice.ts` (yeni), `src/modules/routine/index.ts`,
  `src/app/providers/AppProviders.tsx`, `src/core/store/useHealthStore.ts`, testler (`environmentNotice.test.tsx`,
  `store.test.ts`), `src/core/i18n/en.json`, `src/core/i18n/tr.json` (`routine.envChanged`), `docs/CONTRACTS.md`,
  `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: Ayarlar'daki senaryo seçimine "önerilen ortamı da uygula" seçeneğini
  `applyScenario` ile bağla. `SettingsPage`'e dokunulmadı.

### 2026-11-15 15:00 — Muhammed Bektaş (feat/core-routine) — Astronot pet: yalnız mantık (useCompanion)

- **Ne:** `useCompanion(crewId?)` petin ruh halini (neşeli / nötr / endişeli / uyarı), mesaj anahtarını
  ve varsa bir yönlendirme butonunu verir. Öncelik: uyarı durumu → kaçırılan görev → şu an yapılacak görev →
  rozet/seri kutlaması → günün ipucu. Pet yalnız seçili astronotun kendi durumunu konuşur, teşhis koymaz,
  değer söylemez. Görünüm yok.
- **Neden:** Ekip fikri; kurallar Mühendis 1'de, görsel Emir'de (ADR-032, ADR-051).
- **Dosyalar:** `src/modules/routine/services/companion.ts`, `src/modules/routine/hooks/useCompanion.ts` (yeni),
  `src/modules/routine/hooks/useGamification.ts` (`newBadgesToday`, `today`), `src/modules/routine/services/gamification.ts`
  (`BADGE_I18N`), `src/modules/routine/components/MissionBoard.tsx`, `src/modules/routine/index.ts`,
  test `companion.test.tsx`, `src/core/i18n/en.json`, `src/core/i18n/tr.json` (`routine.companion.*`),
  `docs/DECISIONS.md` (ADR-051), `docs/CONTRACTS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: petin 4 ruh hali için görsel ve buton. Mühendis 3: pet uyarı durumunu
  `useCrewHealth().overall === 'warning'`'ten alıyor; bu sözleşmeyi değiştirirsen haber ver.

### 2026-11-15 14:30 — Muhammed Bektaş (feat/core-routine) — Oyunlaştırma: XP, seri, rozet, ekip skoru (uyuma ödül)

- **Ne:** `useGamification(crewId?)` artık gerçek. XP hatırlatma geçmişinden türetiliyor: zamanında yapılan
  10, geç yapılan 5, kaçırılan 0. Dört günlük sağlık görevi (su, ışıkları zamanında kapat, ekip sohbeti,
  öğren) 5'er XP verir, kişi ve gün başına bir kez. Bunların yanında seviye, seri (dinlenme günü bozmaz),
  5 rozet ve son 7 günün ekip uyum skoru var. Demo mürettebatı geçmiş XP ile başlıyor. `MissionBoard`
  çalışır-sade; "XP uyuma verilir, değere değil" açıklaması görünür.
- **Neden:** P1 oyunlaştırma; değerden bağımsızlık testle kilitli: değerler değişse de XP/seri/rozet aynı (ADR-050).
- **Dosyalar:** `src/modules/routine/services/gamification.ts` (yeni), `src/modules/routine/hooks/useGamification.ts`,
  `src/modules/routine/components/MissionBoard.tsx`, `src/modules/routine/index.ts`, test `gamification.test.tsx`,
  `src/core/i18n/en.json`, `src/core/i18n/tr.json` (`routine.missions.*`, `routine.daily.*`, `routine.badges.*`),
  `docs/DECISIONS.md` (ADR-050), `docs/CONTRACTS.md`, `docs/modules/core-routine.md`,
  `src/core/ui/__tests__/boxSystem.test.ts` (`MissionBoard` artık eski sınıf kullanmıyor → bekleyen
  taşıma listesinden çıktı), `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `MissionBoard` restyle sende. Arayüzde hiçbir yerde ölçüm değerini ödülle
  ilişkilendirme; açıklama metni görünür kalsın.

### 2026-11-15 14:00 — Muhammed Bektaş (feat/core-routine) — Hatırlatma bildirimleri ve kaçırılan sayısı (mantık)

- **Ne:** Seçili astronotun bir görevi "şimdi yap" veya "kaçırıldı" olduğunda bir kez uygulama içi toast
  çıkar. Aynı anda birden çok görev açılırsa ("6 görevin zamanı geldi") tek mesaja toplanır. Kullanıcı
  açtıysa ve tarayıcı izin verdiyse tarayıcı bildirimi de gelir (varsayılan kapalı). Başka astronotun
  görevi bildirilmez. Bildirilenler kişi bazında saklanır: sayfa yenilenince ya da astronot değişip geri
  gelince tekrar bildirilmez. `useMissedCount()` (rozet için), `useNotificationSettings()` ve
  `requestNotificationPermission()` hazır, görünümleri yok.
- **Neden:** P1 bildirim ve kaçırılan ölçüm görevleri (ADR-049); arayüz visualization'da (ADR-032).
- **Dosyalar:** `src/modules/routine/components/ReminderNotifier.tsx`, `src/modules/routine/services/notifications.ts`,
  `src/modules/routine/hooks/useNotificationSettings.ts` (yeni), `src/modules/routine/index.ts`,
  `src/app/providers/AppProviders.tsx` (görünmez mount), test `ReminderNotifier.test.tsx`,
  `src/core/i18n/en.json`, `src/core/i18n/tr.json` (`routine.notify.*`), `docs/CONTRACTS.md`,
  `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: Ayarlar'a bildirim anahtarını (`useNotificationSettings().setEnabled`, tıklamada
  çağrılmalı) ve kaçırılan rozetini (`useMissedCount`) bağla. Ekran değişmedi.

### 2026-11-15 13:40 — Muhammed Bektaş (feat/core-routine) — Hatırlatma durum motoru (kişi bazlı, 'late' durumu)

- **Ne:** `useReminders` artık gerçek: aktif ortamın takvimini bugünün UTC görev gününe açar, her görev
  için 5 durum verir: sırada / şimdi yap / yapıldı / **geç yapıldı (yeni)** / kaçırıldı. Pencere: saatten
  60 dk önce açılır, 120 dk sonra kapanır. Bir ölçüm tek görevi karşılar (sabah ve akşam nabzı karışmaz).
  Metriksiz görevler (haftalık özet, aylık muayene) elle işaretlenir. `useReminders(crewId?)` varsayılan
  olarak seçili astronotu izler; `byCrew` tüm ekibin yalnız görev durumunu verir. Yeni modül store'u
  `astrovital:routine`. `ReminderCenter` çalışır-sade bir liste.
- **Neden:** ADR-035'te ayrı bırakılan zaman penceresi kararı (ADR-049).
- **Dosyalar:** `src/modules/routine/services/{reminderConfig,reminderEngine}.ts` (yeni),
  `src/modules/routine/store/useRoutineStore.ts` (yeni), `src/modules/routine/hooks/useReminders.ts`,
  `src/modules/routine/components/ReminderCenter.tsx`, `src/modules/routine/index.ts`,
  `src/modules/routine/CLAUDE.md`, testler (`reminderEngine.test.ts`, `useReminders.test.tsx`),
  `src/core/i18n/en.json`, `src/core/i18n/tr.json` (`routine.reminders.*`), `docs/DECISIONS.md` (ADR-049),
  `docs/ROUTINE_SCHEDULE.md` (§ Durum kuralları), `docs/CONTRACTS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Emir: `ReminderCenter` çalışır-sade, restyle sende ('late', 'done'dan ikon + metinle
  ayrışmalı). Ayrıntı: `docs/HANDOFF_ENGINEER4.md`.

### 2026-11-15 13:05 — Muhammed Bektaş (feat/core-routine) — Sözleşme uyumu: eski green/yellow/red kalıntıları (ADR-031)

- **Ne:** Repo genelinde eski `Status` adları tarandı. Tip, store, simülasyon, i18n `status.*` ve
  eşik dosyasında kod düzeyinde kalıntı yok. Mühendis 1 alanındaki yorum/doküman ifadeleri yeni adlara
  çevrildi (`environment.ts` yorumu "nominal band", rover egzersiz yorumu, ARCHITECTURE örneği
  `warning / crew_medical_officer`, CONTRACTS Faz 0 notu); `npm run docs:contracts` çalıştırıldı.
- **Neden:** ADR-031 sonrası sözleşme ve dokümanlarda tek terminoloji.
- **Dosyalar:** `src/core/types/environment.ts` (yalnız yorum), `src/core/config/environments.config.ts` (yalnız
  yorum), `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Kendi dosyalarınızda eski adlar kalmış: Mühendis 3 → `src/modules/assessment/README.md`
  ("always green"); Emir → `src/modules/visualization/README.md` ve `MetricTrendChart.tsx` TODO yorumu
  ("green/yellow/red bands" → nominal/advisory/caution/warning). Davranış değişikliği yok.

### 2026-11-15 12:53 — Muhammed Bektaş (feat/core-routine) — Çakışan ADR-036/037 (core-routine) yeniden numaralandı

- **Ne:** `docs/DECISIONS.md`'de iki kez geçen ADR-036 ve ADR-037'nin core-routine olanları taşındı:
  "Takvim saatleri ISS gün iskeletine göre" → **ADR-039**, "Demo verisi takvime birebir" → **ADR-040**.
  Visualization'ın ADR-036 (Durum ekranı) ve ADR-037 (Kutu sistemi) aynen kaldı. Bu iki karara verilen
  referanslar (ADR-016 notu, ROUTINE_SCHEDULE, DEMO_CREW_STORIES, core-routine.md, SOURCES.md,
  sources.config.ts yorumu, simülasyon kod/test yorumları, bu dosyadaki kendi kayıtlarım) güncellendi.
- **Neden:** PR #13 ile feat/core-routine aynı numaraları paralel kullanmıştı; tekil numara olmadan referanslar belirsiz.
- **Dosyalar:** `docs/DECISIONS.md`, `docs/ROUTINE_SCHEDULE.md`, `docs/DEMO_CREW_STORIES.md`,
  `docs/modules/core-routine.md`, `docs/SOURCES.md`, `src/core/config/sources.config.ts`,
  `src/core/simulation/generator.ts`, `src/core/simulation/__tests__/generator.test.ts`,
  `src/core/utils/__tests__/staleness.test.ts`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Takvim saatleri için ADR-039, veri = takvim için ADR-040 kullanın. Yeni ADR'ler 041'den başlar.

### 2026-11-15 02:15 — Emir (feat/visualization) — Tek kutu sistemi (Panel/Tile/Pill); bölge paneli üst barı örtmüyor; başlık satırı kırılmıyor

- **Ne:** Uygulamadaki bütün kutular artık üç rolden biri: **Panel** (üst düzey kap — gradient, 24 px köşe, 24 px
  iç boşluk, yumuşak gölge: `Card`, uyarı şeridi, değer rayı, Modal, Toast, açılır menüler, yan panel),
  **Tile/Satır** (panel içi kutu veya liste öğesi — `raised`, 20 px köşe, 16 px boşluk, gölgesiz: yeni `Tile`,
  `EmptyState`, `PlaceholderNotice`, ekip kişileri, güncel değerler, Ayarlar seçenekleri) ve **Pill** (rozet,
  durum hattı). Yeni token'lar `--av-radius-panel/tile/pill`, `--av-pad-panel/tile`, `--av-gap-section` →
  `rounded-panel/tile/pill`, `p-panel/p-tile`, `gap-section`; tarifler `BOX` (`src/core/ui/box.ts`).
  Modal: Panel + 104 px kapat düğmesi + 16/18 px metin (eski: gölgesiz, `border-border`, ≈ 28 px kapat).
  Toast: Panel + durum renginde kenar, feragat satırının üstünde. Ayarlar baştan: ortam/senaryo seçimi
  eldiven boyu tile'lar, dil/birim/gün sayısı `Segmented`, tohum alanı 104 px; 12–14 px yazı ve 44 px
  `select`'ler kalmadı. Durum ekranında bölge paneli artık sağ sütunun yerine oturan yüzen bir panel
  (1180×820: üst kenar 183 px — üst bar 128'de biter —, alt kenar 767 px — feragat 779'da başlar); üst bar
  ve **Acil** her zaman görünür ve dokunulabilir. Panel modal değil: başka etiket paneli o bölgeye geçirir,
  aynı etiket kapatır. Geçmiş/Ölçüm'de durum hattı artık alt başlığın altına kırılmıyor (`PageHeader` iki
  satırlık ızgara: başlık + durum hattı / alt başlık + eylemler). Satır uyarı şeridi ≈ 128 → ≈ 156 px.
- **Neden:** Kutular iki köşe sisteminden (24/20 px ve 8/6 px), dört farklı boşluktan ve karışık
  yüzeylerden oluşuyordu; Ölçüm/Rutin/Ayarlar başka bir ürün gibi görünüyordu. Bölge paneli üst barı yarıya
  kadar örtüyordu ve şeffaf olduğu hâlde modaldi (Acil'e ilk dokunuş yalnız paneli kapatıyordu). ADR-037.
- **Dosyalar:** `src/core/ui/tokens.css`, `src/index.css`, `src/core/ui/{box.ts,Tile.tsx,Card.tsx,ValueCard.tsx,Modal.tsx,Toast.tsx,EmptyState.tsx,PlaceholderNotice.tsx,StatusBadge.tsx,StatusLine.tsx,AlertStrip.tsx,RedAlertDialog.tsx,Sheet.tsx,VitalRow.tsx,index.ts}`,
  `src/core/ui/__tests__/{boxSystem.test.ts,boxes.test.tsx,Sheet.test.tsx}`,
  `src/app/layout/{AppShell,CrewPicker,EnvironmentPicker}.tsx`, `src/app/pages/{PageHeader,StatusPage,SettingsPage,EmergencyPage,MeasurePage,RoutinePage}.tsx`,
  `src/app/pages/sheetPlacement.ts`, `src/app/__tests__/pageLayout.test.tsx`,
  `src/modules/visualization/components/{VitalsPanel,RegionSheet,RegionDetailPanel,CrewOverview,AlertLayer}.tsx`,
  `src/app/CLAUDE.md`, `src/modules/visualization/CLAUDE.md`, `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` (§5.2, §6, §7.1, §9),
  `docs/DECISIONS.md` (ADR-037), `docs/TEAM.md` (UI kit envanteri: Tile, BOX, Sheet), `docs/CONTRACTS.md` (RegionSheet).
- **Ekip ne yapmalı:** Yeni kutu yazarken `Card` / `Tile` / `BOX.*` kullanın; `rounded-lg`, `rounded-full`,
  `rounded-card`, `text-xs/sm/lg/xl`, `shadow-xl`, `text-muted`, `bg-surface-2`, `border-border` artık
  `boxSystem.test.ts`'i kırmızı yapar. Kit geriye uyumlu (prop'lar değişmedi; `EmptyState` ve
  `PlaceholderNotice` artık tile, metinleri 16 px). **Henüz taşınmamış dosyalar** (testte `PENDING_MIGRATION`;
  taşıyınca listeden silin):
  **Müh. 2 (intake):** `MeasurementForm.tsx` :65/:81/:99 etiketler `text-sm` → `text-label`; :72 ve :91
  `min-h-12 rounded-lg border border-border bg-surface-2 px-3` (48 px hedef; :91 ayrıca `text-lg`), :106
  `min-h-10 …` (40 px hedef) → `min-h-touch rounded-button border-2 border-line bg-raised px-4 text-body`;
  :94 `text-sm text-crit` → `text-label text-warning`; :113 `text-sm text-ok` → `text-label text-nominal`;
  :64 form `gap-3` → `gap-touch-gap`. `QuickLogPanel.tsx` :29 `text-sm text-muted` (14 px) → `text-label
text-text-2`. `MoodPicker.tsx` :46/:58 — 5 × 104 px + 4 × 16 px = 584 px, 1180'de Hızlı kayıt panelinin
  içi 440 px: düğmeler panelden taşıyor ve aralarında boşluk görünmüyor (bu adımdan önce de vardı).
  **Müh. 1 (routine):** `MetClock.tsx` :28 `text-muted` → `text-text-2` (üst barda, her sayfada).
  `MissionBoard.tsx` :15/:19/:25 `rounded-lg bg-surface-2 p-3` → `Tile`; :16/:20/:26 `text-xs text-muted`
  (12 px) → `text-label text-text-2`; :17/:21/:27 `text-xl` → `text-headline`; :14 `gap-3` → `gap-touch-gap`.
  **Müh. 3 (assessment):** `RecommendationList.tsx` :18 `rounded-lg border border-border bg-surface-2 p-3`
  → `Tile` (Durum'daki bölge panelinde görünür), :23 `text-sm text-muted` → `text-body text-text-2`.
  `AlertCenter.tsx` :55 `rounded-lg bg-surface-2 p-3` → `Tile`; :62 `text-sm text-muted`, :70 `text-xs
text-muted` → `text-label text-text-2`. `LearnPanel.tsx` :29/:50/:65 `text-lg` → `text-headline`;
  :37/:41 `text-sm`, :40/:42/:57/:71 `text-sm text-muted`, :72 `text-sm` → `text-label`/`text-body` +
  `text-text-2`.

### 2026-11-14 23:30 — Emir (feat/visualization) — Durum ekranı: uyarı rayın üstünde, dar bölge paneli, astronot yeniden çizildi

- **Ne:** Uyarı varken Durum ekranı artık kaymıyor (1180×820'de sayfa içi kayma 136 → 0 px): şerit Durum
  sayfasında üst satır yerine sağ sütunda, değer rayının üstünde dikey kart (`AlertPanel`; kenarı en ağır
  uyarının renginde, düğmeler ≥ 104 px); ray kalan yükseklikte kendi içinde kayar. Diğer sayfalarda şerit eskisi
  gibi üst satırda. Bölge paneli yalnız sağ sütunu örter (1180'de 404 px) ve sayfayı karartmaz: figür, 10 etiket
  ve basılan etiket panel açıkken görünür. Kan bölgesi uyarıda kollar/bacaklar boyunca dolgulu şerit (eskiden
  ince kırmızı çizgiler kılavuz çizgilerine benziyordu). Astronot yeniden çizildi: gerçek ¾ duruş (sırt çantası
  solda, ağırlık bir bacakta, diğer ayak önde, kollar farklı, omuzlarda hafif eğim), her parçanın konturunu
  izleyen sol üst ışık + sağda soğuk kenar ışığı, tek zemin gölgesi, kask oranı düzeltildi (≈ 7,3 kask boyu),
  ölçülü EVA detayı (hortum, panel dikişleri, diz takviyesi, bilek halkaları, bot tabanı). Tüm vücut halesi
  bulanık leke yerine siluetin dışında ince kontur. Figür 1180'de ≈ 258 × 584 px.
- **Neden:** Ekranın en önemli olduğu an (uyarı) alt etiketleri ve değerleri ekran dışına itiyordu; seçilen
  sağ etiket panelin altında kalıyordu; figür donuk, ayna simetrik bir manken gibi okunuyordu (ADR-036 güncellendi).
- **Dosyalar:** `src/core/ui/{AlertStrip,Sheet,index}.ts(x)` (`AlertStrip.layout`, `Sheet.width/backdrop`),
  `src/core/ui/tokens.css` (`--av-suit-rim`), `src/core/ui/__tests__/{alerts,Sheet}.test.tsx`,
  `src/modules/visualization/components/{AlertLayer,RegionSheet}.tsx`, `components/figure/{SuitArt,geometry,layout,AstronautFigure}.ts(x)`,
  `src/modules/visualization/index.ts` (`AlertPanel`), `__tests__/{AlertLayer.test.tsx,figureGeometry.test.ts (yeni)}`,
  `src/app/layout/AppShell.tsx`, `src/app/pages/StatusPage.tsx`, `docs/DECISIONS.md` (ADR-036), UI spec §6/§7.1/§8,
  `docs/CONTRACTS.md`, `docs/TEAM.md`, `src/app/CLAUDE.md`, `src/modules/visualization/CLAUDE.md`, `AI.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** hiçbir şey (bağımlılık değişmedi). Kit kullanan: `Sheet`'e `width`/`backdrop`, `AlertStrip`'e
  `layout` eklendi (varsayılanlar eskisiyle aynı). Figüre dokunan: çizim değişirse `REGION_ANCHORS`/`REGION_SHAPES`
  birlikte güncellenir, `figureGeometry.test.ts` yeşil kalmalı.

### 2026-11-14 22:30 — Emir (feat/visualization) — Durum ekranı tek ekrana sığdı: figürün yanında bölge etiketleri, kompakt değer rayı

- **Ne:** Durum ekranı 1180×820'de kaydırmasız (önce ≈ 3,25 ekran boyu). Üst çubuk EN/TR'de tek satır (248 → 128 px;
  ortam seçicide kısa ad, yeni `topbar.envShort.*` anahtarları). Feragat tam genişlikte sabit alt satır, her sayfada
  kaydırmadan görünür; sayfa alanı kendi içinde kayar. Sorun yokken uyarı şeridi yerine başlık satırında tek satırlık
  durum hattı (`AlertSummary` / yeni kit parçası `StatusLine`); uyarı varsa şerit tek satırlık kart (≈ 128 px).
  Sol ≈ %60 figür (≈ 560 px boy, viewBox ile ölçeklenir), iki yanında 10 görünür bölge etiketi (152×104, aralık 16 px,
  renk + ikon + metin) ve organa giden kılavuz çizgileri — bölge çipleri ve görünmez tıklama alanları kaldırıldı.
  Figürde nominal bölge hiçbir şey çizmez; advisory/caution/warning siluete kırpılmış dolgu + koyu kontur + çizgide
  durum simgesi. Nefes yalnız tüm vücut halesinde (reduced-motion'da kapalı). Seçimde diğerleri soluklaşır, seçili
  çizgi accent. Sağ ≈ %38 değer rayı (yeni kit parçası `VitalRow`, 6 × ≈ 90 px), nominal olmayanlar üstte; mini yay
  gösterge (96×44) yalnız değerin bandını renklendirir (`ArcGauge`'a opsiyonel `status`, `gaugeSegments`/`segmentIndexAt`).
- **Neden:** Durum ekranı denetimi: çok kaydırma, iki satırlık üst çubuk, küçük figür, görünmeyen dokunma hedefleri,
  her bölgenin parlaması yüzünden uyarının kaybolması (ADR-036).
- **Dosyalar:** `src/app/layout/{AppShell,TopBar,Sidebar,Disclaimer,EnvironmentPicker}.tsx`,
  `src/app/pages/{PageHeader,StatusPage}.tsx`, `src/core/ui/{ArcGauge,arcMath,AlertStrip,ValueCard,index}.ts(x)`,
  `src/core/ui/StatusLine.tsx` (yeni), `src/core/ui/VitalRow.tsx` (yeni), `src/core/i18n/{en,tr}.json`,
  `src/modules/visualization/components/{BodyMap,AlertLayer,VitalsPanel}.tsx`,
  `src/modules/visualization/components/RegionLabel.tsx` (yeni), `components/figure/{AstronautFigure,SuitArt,geometry}.ts(x)`,
  `components/figure/layout.ts` (yeni), `hooks/useElementSize.ts` (yeni), `services/vitalCards.ts`, `index.ts`;
  silindi: `components/RegionChips.tsx`, `components/figure/hitAreas.ts`; testler (`bodyMapLayout.test.ts` yeni,
  `hitAreas.test.ts` silindi, `VitalRow.test.tsx` yeni); `docs/DECISIONS.md` (ADR-036), UI spec §5.4/§5.5/§6/§7.1/§7.6/§8/§9,
  UI test planı F-06, `docs/CONTRACTS.md`, `docs/TEAM.md` (UI kit envanteri), `src/app/CLAUDE.md`,
  `src/modules/visualization/CLAUDE.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** `git merge origin/main` (bağımlılık değişmedi). Yeni sayfa yazan: kabuk artık bir ekran boyu,
  sayfan `main` içinde kayar; `PageHeader` sağında durum hattı var. Kit'te yeni `VitalRow`, `StatusLine`. Değerlendirme
  motoru (Mühendis 3): figür ve ray `advisory/caution/warning` durumlarını hazır gösteriyor.

### 2026-11-14 22:00 — Muhammed Bektaş (feat/core-routine) — Karma görev demo senaryosu; demo verisi takvime birebir

- **Ne:** Yeni varsayılan senaryo **karma görev** (`mixed_mission`): Mira nominal, Kenji warning (önce nabız/uyku öncü
  işaretleri, sonra ateş), Selin caution (uyku ve ruh hali yavaşça düşüyor), Lucas advisory (tansiyon kendi normalinin +9
  üstünde, egzersiz aksıyor). Demo verisi artık yalnız takvimdeki ölçümleri üretiyor: ISS'te akşam yalnız nabız (19:30),
  diğer ortamlarda akşam vitali yok; takvime sabah solunum hızı eklendi. Mürettebat baseline'ları nominal bantların içine
  çekildi (önceden nominal senaryoda bile herkes caution çıkıyordu). Rover değişmedi.
- **Neden:** Jüri dört durum seviyesini tek ekranda görsün; ekranda takvimde olmayan ölçüm görünmesin (ADR-048, ADR-038).
- **Dosyalar:** `src/core/types/simulation.ts`, `src/core/simulation/{generator,scenarios,crew,index}.ts`,
  `src/core/config/environments.config.ts`, `src/core/config/sources.config.ts`, `src/core/store/useHealthStore.ts`,
  `src/core/i18n/en.json`, `src/core/i18n/tr.json`, testler (`generator.test.ts`, `staleness.test.ts`),
  `docs/DEMO_CREW_STORIES.md` (yeni), `docs/ROUTINE_SCHEDULE.md`, `docs/SOURCES.md`, `docs/DECISIONS.md`, `docs/CONTRACTS.md`,
  `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Merge sonrası demo verisi değişir: varsayılan senaryo 'karma görev' — Mira nominal, Kenji warning, Selin caution, crew-4 advisory (motor henüz üretmiyor). Mühendis 3: docs/DEMO_CREW_STORIES.md 'Beklenen durum tablosu'nu motor testlerinde kullan. Emir: senaryonun ekranlara uyarlanması sende, bkz. aynı doküman 'Görselleştirme için'. Tarayıcıda eski demo verisi kalmışsa Ayarlar → Sıfırla → Demo verisini yükle.

### 2026-11-14 21:00 — Muhammed Bektaş (feat/core-routine) — Takvim saatleri ISS gün iskeletine göre; demo verisi saatleri takvimden

- **Ne:** Hatırlatma saatleri ISS gününe göre güncellendi (UTC): uyku kaydı 06:15; sabah tansiyon/nabız/SpO₂/ısı ve
  açlık şekeri 06:30; egzersiz 17:30; dozimetre ve ISS akşam nabzı 19:30; ruh hali 21:00 (değişmedi). Demo verisi artık
  ölçüm saatlerini takvimden okuyor (tek kaynak); ölçüm sayısı değişmedi. 3 yeni kaynak (ESA x2, ikincil ClickOrlando).
- **Neden:** Saatler Faz 0 örneğiydi ve demo verisiyle ayrışmıştı (egzersiz 15:00 vs 17:00) — ADR-047.
- **Dosyalar:** `src/core/config/environments.config.ts`, `src/core/simulation/generator.ts`,
  `src/core/config/sources.config.ts`, `src/core/simulation/__tests__/generator.test.ts`, `docs/ROUTINE_SCHEDULE.md`,
  `docs/SOURCES.md`, `docs/DECISIONS.md`, `docs/modules/core-routine.md`, `CHANGELOG.md`
- **Ekip ne yapmalı:** Merge sonrası demo verisinde ölçüm saatleri değişir (sabah vitalleri 06:30, egzersiz 17:30, dozimetre 19:30). Saat varsayan testin/ekranın varsa kontrol et.

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
