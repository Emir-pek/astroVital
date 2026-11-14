# DEMO_SCRIPT — Resmî demo (≤30 sn video veya ≤7 slayt)

> **Kural kutusu (Space Apps Project Submission Guide)**
>
> - Demo **ya** en fazla **30 saniyelik video** **ya da** **başlık dahil en fazla 7 slayt**.
> - Jürinin gördüğü her şey **İngilizce**; video başka dilde konuşulursa **İngilizce altyazı zorunlu**.
> - Demo harici bir yerde (YouTube, Drive, GitHub…) **herkese açık link** ile paylaşılır.
> - **Sınır aşılırsa proje Global Judging'e girmez.**
> - Kullanılan uzay ajansı verisi/kaynakları açıkça gösterilir.
> - Kaynak: https://www.spaceappschallenge.org/resources/project-submission-guide/ · İskeletler:
>   `.claude/skills/space-apps-submission/SKILL.md`

**Format seçimi:** video / slayt — son 6 saatte karar (sahip: _TBD_).

Ortak hazırlık: Settings → seed `2026`, 30 gün; production build (`npm run build && npm run preview`);
tarayıcı tam ekran, dil **EN**; feragat bandı görünür. Hedef kriterler: **Etki, Yaratıcılık,
Geçerlilik, İlgililik, Sunum.**

## Bölüm A — 30 sn video senaryosu

Tek bir uyarının uçtan uca akışı. Senaryo: `fever_dehydration` + Ay üssü (`lunar_base`), mürettebat
Kenji (crew-2). Kayıttan önce verinin yüklü olduğundan emin ol.

| Süre      | Ekran                                                                            | İngilizce altyazı / anlatım                                                                                                          | Kriter                 |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| 0:00–0:03 | Başlık kartı: AstroVital logosu + takım adı + challenge adı                      | "AstroVital — Health Monitoring Software for Astronauts. Team <name>."                                                               | Sunum                  |
| 0:03–0:08 | Dashboard (4 mürettebat kartı) + 5 tehlike ikon şeridi                           | "On Mars, the nearest doctor is up to 24 minutes away. Radiation, isolation, distance, gravity and a closed habitat threaten crews." | Etki, İlgililik        |
| 0:08–0:12 | `/log` → Kenji için ısı **38.6 °C** girilir (büyük butonlar)                     | "Kenji logs his temperature: 38.6 °C."                                                                                               | Yaratıcılık            |
| 0:12–0:16 | `/crew/crew-2` → vücut haritasında bağışıklık/tüm vücut **kırmızı atıyor**       | "His body map turns red — immune system, whole body."                                                                                | Sunum                  |
| 0:16–0:21 | Uyarı kartı: **Ne oldu / Neden önemli / Şimdi ne yap / Ne zaman flight surgeon** | "What happened, why it matters, what to do now — rest, hydrate, re-measure — and when to call the flight surgeon."                   | Geçerlilik             |
| 0:21–0:25 | TopBar'dan ortam **Mars**'a → aynı uyarı **otonom protokol + asenkron rapor**    | "On Mars it switches to the autonomous protocol: the CMO leads, the surgeon gets an async report."                                   | İlgililik, Yaratıcılık |
| 0:25–0:30 | Kaynak şeridi (NASA HRP 5 Hazards · NASA-STD-3001 · CSA radiation) + feragat     | "Thresholds from NASA and CSA sources. Prototype — simulated data, not a medical device."                                            | Geçerlilik             |

Sığmadığı için videodan çıkarılanlar (slayt veya canlı sunumda kullanılabilir): kamera ile nabız,
Learn sayfası, trend grafiği, oyunlaştırma (XP uyuma verilir), EN↔TR geçişi.

## Bölüm B — 7 slayt iskeleti (başlık dahil)

| #   | Başlık (SKILL.md)                   | Ekran görüntüsü / görsel                                                     | Tek mesaj                                                                                                        |
| --- | ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Title                               | Logo + takım üyeleri + challenge adı                                         | AstroVital — astronotlar için sade dilde sağlık takibi.                                                          |
| 2   | Problem                             | 5 tehlike (RIDGE) şeması + Mars gecikmesi (4–24 dk)                          | Mürettebat kendini değerlendirmek zorunda; Dünya'daki yardım uzakta.                                             |
| 3   | Solution                            | Dashboard + vücut haritası tek ekran görüntüsü                               | Ölç, anla, ne yapacağını bil — tamamen offline.                                                                  |
| 4   | How it works                        | Akış: ölç → eşik/baseline ile karşılaştır → açıkla → yap → eskale et         | Her sonuç "Ne oldu / Neden önemli / Şimdi ne yap / Kime haber ver" der; ortam (ISS→Mars) eskalasyonu değiştirir. |
| 5   | Space-agency data & sources         | `docs/SOURCES.md`'den kaynak listesi (NASA HRP, NASA-STD-3001, CSA, MSL/RAD) | Her eşik ve öneri bir NASA/CSA ya da hakemli kaynağa bağlı.                                                      |
| 6   | Demo highlights / real vs simulated | Uyarı kartı + Mars otonom protokolü ekran görüntüsü                          | Gerçek: kural motoru, arayüz, ortam uyarlaması. Simüle: mürettebat verisi (seed'li).                             |
| 7   | Impact & next steps                 | Yol haritası (gerçek sensör entegrasyonu, CMO paneli)                        | Uzun görevler ve Dünya'daki uzak bölgeler için öz bakım aracı. Prototip, tıbbi cihaz değil.                      |

## Bölüm C — Canlı sunum (opsiyonel, yalnız yerel etkinlik isterse; süre organizatöre göre)

Resmî teslimin parçası **değildir**. Aşağıdaki 3 dakikalık akış yerel jüri canlı sunum isterse kullanılır.

| Süre      | Ekran                                                | Söylenecek (özet)                                                                                                                                                                    | Kriter                |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 0:00–0:20 | Dashboard (ISS, `nominal`)                           | "Mars'a giden bir astronot, Dünya'daki doktora 20 dakika uzakta. AstroVital, astronotun kendi sağlığını **sade dille** takip etmesini sağlar — tamamen çevrimdışı." Feragati göster. | Etki, İlgililik       |
| 0:20–0:50 | `/log`                                               | Ruh halini 5 adımlı, etiketli ölçekle (eldivenle, emoji yok) gir; klavyeyle nabız gir, makul olmayan değerde uyarıyı göster; kamera ile nabız (deneysel, güven skoru).               | Yaratıcılık           |
| 0:50–1:30 | `/crew/crew-1`                                       | Vücut haritası: kalbe tıkla → işlevi, uzaydaki riski, ilgili ölçümler. Grafikte yeşil/sarı/kırmızı bantlar, 30 günlük trend.                                                         | Sunum                 |
| 1:30–2:10 | Settings → `fever_dehydration` + Ay üssü → `/alerts` | Kenji'de ateş: kırmızı, "CMO'ya bildir", "yeniden ölç", **neden önemli** açıklaması. Ortamı **Mars**'a çevir → aynı durum "otonom protokol + asenkron rapor (gecikme 4–24 dk)".      | Geçerlilik, İlgililik |
| 2:10–2:35 | `/learn`                                             | "Astronotun her şeyi bildiğini varsaymıyoruz": her ölçüm için _Nedir? / Uzayda nasıl ölçülür? / Renkler ne demek?_ + 5 NASA tehlikesi. Kaynak bağlantıları.                          | Geçerlilik            |
| 2:35–2:50 | `/mission`                                           | XP **uyuma** verilir, "iyi değere" değil → sahte veri teşviki yok. Seri, ekip skoru.                                                                                                 | Yaratıcılık, Etki     |
| 2:50–3:00 | Dil EN→TR, kapanış                                   | "Her eşik bir NASA/CSA kaynağına bağlı; açık kaynak, offline, her ortama uyarlanır."                                                                                                 | Sunum                 |

## Yedek planlar

- Kamera izni/ışık sorunu (canlı sunum) → "manuel girişe düşüş" akışını göster (bu da bir özellik).
- Canlı sunum bozulursa: resmî 30 sn videoyu oynat.
- Veri karışırsa: Settings → "Tüm veriyi sıfırla" → "Demo verisini yükle" (seed deterministik).
- Video çekimi tutmazsa: aynı ekran görüntülerinden 7 slaytlık sürüme geç (Bölüm B).

## Prova kontrol listesi

- [ ] `npm run build && npm run preview` ile **production** build'de çekim/prova
- [ ] İnternet kapalıyken açılıyor mu? (offline iddiası)
- [ ] Süre: **video ≤0:30 / slayt ≤7 (başlık dahil)** — iki prova
- [ ] **İngilizce altyazı var** (video) / tüm slayt metni İngilizce
- [ ] **Link gizli pencerede açılıyor** (herkese açık)
- [ ] **Feragat görünür:** "Prototype — simulated data, not a medical device"
- [ ] Kullanılan uzay ajansı kaynakları videoda/slaytta gösteriliyor
