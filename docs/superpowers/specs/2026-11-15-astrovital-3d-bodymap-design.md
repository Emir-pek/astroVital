# AstroVital — 3D vücut haritası, LED kutular, dil değişiminde sabit yerleşim (tasarım)

**Tarih:** 2026-11-15 · **Sahip:** Emir (Mühendis 4, visualization) · **Karar:** ADR-038 · **Durum:** onaylandı (Emir, "A'yı seçiyorum başla")

## 1. Niyet

Durum ekranındaki astronot, uzun görevdeki bir astronotun "vücudumda ne oluyor?" sorusunun cevabıdır.
2D ¾ duruşlu SVG figür donuk kaldı. Kullanıcının istediği:

- Figür **önden, düz bize baksın** ve **parmakla tutulup 360° çevrilebilsin**.
- Bir bölgeye dokununca kamera **o bölgeye yakınlaşsın**, giysi **şeffaflaşsın**, içerideki **organ görünsün**.
- Tablet mantığı: dokunma + sürükleme; eldivenle rahat (≥ 104 px hedef, hassas jest gerektirmeyen yol her zaman var).
- Bölge paneli, panel dışında herhangi bir yere dokununca kapansın.
- EN ↔ TR değişince sayfanın yapısı (konumlar, genişlikler, yükseklikler) değişmesin.
- Kutuların kenarında LED ışık; acil durumda kutular acil durum renginde parlasın.
- İki referans projeden (Maina Site, DoctorCoachAI) beğenilen görünüş ve hareket dili alınsın.

**Anti-hedefler:** tıbbi cihaz gibi görünmek; her şeyin sürekli yanıp sönmesi (alarm körlüğü); eldivenle
yapılamayan tek yol (yalnız pinch ile yakınlaşma gibi); ağ isteği; telifli 3D model.

## 2. Yaklaşımlar

| Yaklaşım | Kazanç | Bedel | Karar |
|---|---|---|---|
| **A. Gerçek 3D (`three`), kodla kurulan astronot + organlar** | Gerçek 360°, yakınlaşma, şeffaf organ, etiket çizgileri organı izler | +1 bağımlılık (ayrı parça olarak geç yüklenir); WebGL yoksa yedek gerekir | **Seçildi** |
| B. 2.5D SVG (ön/yan/arka çizim + sıkıştırma) | Bağımlılık yok | "Kâğıt bebek" görünümü; içteki organı şeffaf göstermek yapay | Elendi |
| C. Hazır glTF model | En gerçekçi | Telif/lisans, NASA tasarım öğesi riski, dosya boyutu | Elendi (CLAUDE.md: kendi çizimimiz) |

## 3. Tasarım

### 3.1 3D sahne (`src/modules/visualization/components/figure3d/`)

- **Astronot:** `three` ilkel şekilleriyle (Lathe gövde/kask, Capsule kol-bacak, RoundedBox sırt çantası,
  Torus eklem halkaları, Tube hortumlar). Önden bakar (yüz +Z), hafif A duruşu. Mat beyaz kumaş, metalik
  eklem halkaları, koyu yansıtıcı vizör (RoomEnvironment yansıması), turuncu şerit (`--av-suit-accent`).
  Işık: sol üst ana ışık + arkadan soğuk kenar ışığı + gökyüzü/zemin dolgusu. Figür döner, kamera ve ışık sabit.
- **Organlar:** her bölgenin bir grubu var — beyin, gözler, kalp, akciğerler, böbrekler, sade iskelet
  (omurga, kaburga, leğen, uzun kemikler), kaslar (pazı, göğüs, uyluk, baldır), damarlar (aort, kol/bacak/boyun
  dalları), bağışıklık (lenf düğümleri, dalak, timus). `whole_body` organ değil, giysinin kendisi.
- **Renk kuralı (değişmedi):** figürde renk yalnız sağlık durumu içindir. Organ, bölgenin durum renginde
  (nominal yeşil, advisory mavi, caution sarı, warning kırmızı, veri yok/eski gri-mavi).
- **Seçim yokken:** giysi opak. Uyarıdaki (advisory/caution/warning) bölgelerin organı giysinin içinden
  "röntgen" gibi soluk parlar. `whole_body` uyarıdaysa giysi o renkte hafif ışır.
- **Seçimde:** kamera bölgeye yumuşakça yaklaşır (600 ms, azaltılmış harekette anında), gerekirse figürü
  çevirir (böbrekler için arkadan). Giysi şeffaflaşır, seçili organ dolu ve parlak görünür.
  `whole_body` seçilince giysi opak kalır ve durum renginde ışır.
- **Jestler (tablet):** tek parmak sürükleme = döndürme (ataletli); iki parmak = yakınlaşma (pinch);
  dokunma (< 10 px hareket) = dokunulan noktaya en yakın bölgeyi seç (aynı bölge = kapat); figür dışına
  dokunma = seçimi kapat. Eldiven yolu: bölge etiketleri (seçim + yakınlaşma), "görünümü sıfırla" düğmesi
  (104 px, yalnız görünüm varsayılandan farklıyken), klavye (← → döndür, + − yakınlaş, 0 sıfırla).
- **Etiket çizgileri:** her karede bölge çapası ekrana izdüşürülür, çizgiler DOM'da doğrudan güncellenir
  (React yeniden çizimi yok). Seçimde yalnız seçili bölgenin çizgisi; figürün arkasında kalan çapa soluk.
- **Performans:** isteğe bağlı çizim (yalnız hareket/tween/atalet sürerken kare), DPR ≤ 2, gölge haritası yok
  (temas gölgesi diski). `three` ayrı parça (`React.lazy`), yüklenene kadar ve WebGL yoksa eski SVG figür.
  WebGL bağlamı kaybolursa SVG'ye düşer.
- **Saf, testli parçalar:** `orbit.ts` (görünüm matematiği, tween, atalet), `gesture.ts` (dokunma/sürükleme/pinch
  ayrımı), `pick.ts` (dokunulan nokta → bölge), `anatomy.ts` (çapalar, odak görünümleri, dokunma noktaları).

### 3.2 Bölge paneli dışarı dokununca kapanır (`Sheet`)

- `backdrop="clear"` panelde yeni `dismissOnOutsideTap`: panel dışında başlayan ve 10 px'ten az hareket eden
  dokunma bırakıldığında panel kapanır. Sürükleme/kaydırma kapatmaz.
- Kapatma `pointerup`'ta olur ve olayı yutmaz: Acil'e dokunmak paneli kapatır **ve** Acil'i aynı dokunuşta açar.
- `data-sheet-keep` taşıyan öğeler (bölge etiketleri, 3D sahne) panel kapatmaz; kendi mantıklarını yürütür
  (başka etiket = bölge değiştir, aynı etiket = kapat, sahnede figür dışı = kapat).

### 3.3 LED kutular

- Her Panel (`card-surface`) ve bölge etiketi: şeffaf kenar + kenarın arkasında konik gradyan "LED şerit".
- Durum `<html data-led>` ile (seçili astronotun en kötü bölge durumu):
  - `nominal`/veri yok: sönük accent, **hareketsiz**.
  - `advisory`: mavi, hareketsiz, çok hafif hale.
  - `caution`: sarı, ışık kenarda yavaşça akar.
  - `warning`: kırmızı, ışık akar + dış hale nabız gibi atar — "acil durumda kutular parlar".
- Azaltılmış hareket: akış ve nabız yok, warning'de sabit güçlü hale. Yanıp sönme (on/off) yine yalnız kırmızı uyarı ikonunda.
- Neden hep parlamıyor: her şey parlarsa acil durumdaki parlama anlamını yitirir (alarm körlüğü).

### 3.4 EN/TR değişiminde sabit yerleşim

Ölçüm (1180×820, 7 sayfa, EN ve TR) metne göre boyutlanan kutuları buldu: üst bar Acil düğmesi
(172 ↔ 113 px → sağ grup 59 px kayıyor), sayfa başlığı sütunu (durum hattı 28 px kayıyor), Durum'daki değer
rayı, Ölçüm, Geçmiş zaman aralığı etiketi, Rutin yer tutucu kartları, Acil merdiven satırları, Ayarlar alan
etiketleri. Kural: **dil metni kutunun boyutunu belirlemez** — sabit genişlik/yükseklik veya en uzun dile göre
ayrılmış yer; taşan metin kısaltılır.

### 3.5 Referanslardan alınanlar

| Kaynak | Alınan | Nerede |
|---|---|---|
| DoctorCoachAI | Bölümlerin sırayla süzülerek girişi (`console-section-in`, 45 ms adım) | Sayfaların üst düzey bölümleri |
| DoctorCoachAI | Nefes alan işaret + yayılan halka (`coach-breathe/wave`) | 3D sahnedeki "canlı" göstergesi |
| DoctorCoachAI | Global `prefers-reduced-motion` koruması | tokens.css |
| Maina | HUD köşe parantezleri + ince durum etiketi | 3D sahne çerçevesi |
| Maina | Buzlu cam üst bar (`backdrop-filter`) | TopBar |

Alınmayanlar: Maina'nın kesik köşeli kutuları (ADR-037 yuvarlak sistemiyle çakışır), fareyi izleyen ızgara
(tablette fare yok), sürekli yanıp sönen nokta (ADR-036: yanıp sönme yalnız kırmızı uyarıda).

## 4. Builder'a kalanlar

Organ şekillerinin ince ayarı, ışık şiddetleri, tween eğrileri — `anatomy.ts`/`buildAstronaut.ts` sabitleri.
Bölge çapaları değişirse `COLUMNS` sırası (çizgiler kesişmesin) korunur.
