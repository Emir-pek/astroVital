# AstroVital — UI Tasarım Belgesi ve Claude Code Talimatı

> **Claude Code için:** Bu belge AstroVital arayüzünün onaylanmış tasarımıdır. Arayüzün tamamı (Modül 1'in görünen kısımları, Modül 2'nin giriş ekranları, Modül 4'ün tamamı) bu belgeye göre yapılır. Çalışma şekli en altta, "Claude Code çalışma talimatı" bölümünde.
>
> Kaynak belge: `AstroVital_Modul_Yol_Haritasi.docx` (teknoloji yığını, modüller, eşik tablosu, senaryolar, zaman planı). Bu belge onunla çelişirse UI konularında bu belge geçerlidir; mimari ve sözleşme konularında yol haritası geçerlidir.

---

## 1. Amaç ve neden

- **Ne:** NASA Space Apps Challenge 2026, "Create Health Monitoring Software for Astronauts on Space Missions" görevi için astronotun **kendi sağlığını değerlendirip harekete geçmesini** sağlayan arayüz.
- **Kim için:** Birincil kullanıcı **astronot**. Ekip doktoru (CMO) modu bu sürümde yok.
- **Neden önemli:** Arayüz jürinin ilk gördüğü yüz. Rakip projeler (ör. Crew Health Monitor) kavram olarak bize çok yakın; fark **görsel kalite, NASA ekran standardına uyum ve eldivenli tablet kullanımı** ile yaratılacak.
- **Başarı:** Jüri 3 dakikalık demoda (1) astronotun durumu bir bakışta anladığını, (2) bir sorunun nasıl öne çıktığını ve ne yapılacağının söylendiğini, (3) arayüzün NASA standartlarına dayandığını görür.

## 2. Hedefler, hedef olmayanlar, anti-hedefler

**Hedefler**
- Açılışta genel durum; acil bir şey varsa önce o.
- Kalite + yumuşaklık: olgun, sakin, premium bir görsel dil.
- NASA-STD-3001 Ek F ekran kurallarına ve eldivenli dokunmatik kullanıma uyum.
- İnternetsiz, tamamen tarayıcıda çalışma.

**Hedef olmayanlar**
- 3D model / Three.js (kesinlikle yok).
- CMO / uçuş doktoru ekranı, sunucu, telefon görünümü.

**Anti-hedefler (teknik olarak çalışsa bile başarısızlık sayılır)**
- **Sevimli / çocuksu görünüm:** büyük kafa oranları, emoji yüzler, zıplayan animasyonlar, karikatür. Hedef "yumuşak ve kaliteli", **tatlı değil**.
- Kırmızı/sarı/turuncu/mavinin uyarı dışında süs olarak kullanılması.
- Yanıp sönen, sürekli hareket eden, dikkat dağıtan ekran.
- Eldivenle basılamayacak kadar küçük hedefler.
- Ekip arkadaşlarının tıbbi değerlerinin başkalarına gösterilmesi.

## 3. Uyulacak standartlar (zorunlu)

Kaynak: NASA-STD-3001 Vol. 2, Ek F (Display Standard), MIL-STD-1472 (dokunmatik alan boyutu).

| Kural | Kaynak | Uygulama |
|---|---|---|
| Acil/Warning = kırmızı, Caution = sarı, Advisory = mavi | F.6.4.1–3 | `status` renkleri (§5). Normal = nane yeşili. |
| Renk süs için kullanılmaz; kritik bilgide renge ek ipucu | F.5.10 | Her durum **renk + ikon + metin** ile gösterilir. |
| Ters video (renkli zemin + açık yazı) sadece acil dikkat için | F.5.10 | Sadece kırmızı tam ekran uyarıda. |
| Eşik dışı değerde sarı/kırmızı yukarı/aşağı ok | F.4.3.1.4 | Değerin yanında ▲/▼. |
| Eski veri belirtilmeli | F.4.3.1.3 | §7.6 "eski veri" görünümü. |
| Acil/warning/caution olayı prosedüre bağlanır | F.6.4.8 | Her uyarıda "Ne yapmalıyım?" butonu. |
| Ekip tek tek göstergeleri susturabilir | F.6.4.10 | Sarı/mavi uyarıda "Ertele" (kırmızıda yok). |
| Sans serif; l/1, O/0 ayırt edilebilir | F.5.1.2–3 | §5.3 yazı tipleri. |
| Sayısal veride sabit genişlikli font | F.5.1.4 | Tüm değerler mono font. |
| Akronim dışı metin karışık harf (mixed case) | F.5.1.8 | TAMAMI BÜYÜK HARF başlık yok (MET, SpO₂ gibi akronimler hariç). |
| Kontrast en az 6:1, tercihen 10:1 | F.5.10 | §5.1'deki tüm kombinasyonlar ölçüldü. |
| Yanıp sönme sadece acil dikkat; yüksek öncelik 3 Hz %50 | F.5.11 | Sadece kırmızı uyarı ikonu, küçük alan; onayla durur. |
| Yanıp sönme 10 sn'den uzun sürerse durdurulabilir | F.5.11.5 | "Gördüm" ve "Yanıp sönmeyi durdur". |
| Eldivenli dokunma alanı min 20 mm × 20 mm, aralık ≥ 3 mm | MIL-STD-1472 | §5.4 boyutlar. |

## 4. Kararlaştırılan konular (kullanıcının kararları)

1. Birincil kullanıcı astronot.
2. Açılış: genel durum görünür; acil bir şey varsa önce o, uyarı olarak.
3. Uyarı modeli **karışık**: kırmızı = onaylanana kadar tam ekran; sarı ve mavi = sadece üstteki şerit.
4. Arayüzün tamamı bu ekipte (sayfa yapısı, menü, tema, ölçüm ekranları, figür, grafikler, ekip, rutin).
5. Cihaz: **tablet, yatay, dokunmatik**, eldivenle kullanım ana senaryo.
6. Ekip sayfası standartlara uyar (tıbbi gizlilik).
7. Figür **2D**; 3D yok.
8. Tema: **koyu ama yumuşak** (gece mavisi + pastel aksanlar).
9. Görsel dil: kalite ve yumuşaklık; **tatlılık/sevimlilik değil**.
10. Karakter: **skafandrlı astronot**, mat, hacimli, yumuşak ışıklı 2D illüstrasyon (referans: mat beyaz skafandr, yuvarlak hacimler, dağınık yumuşak ışık). Sağlık bölgeleri kıyafetin altından yumuşak ışık olarak belirir; dokununca yan panelde şematik organ illüstrasyonu açılır.
11. Arayüz bileşenleri: **Base UI tabanlı (`@base-ui/react`, shadcn/ui tarzı) + kendi tasarım değişkenlerimiz**.

## 5. Tasarım sistemi (token'lar)

### 5.1 Renkler

Tüm metin/zemin çiftleri ölçüldü; hepsi ≥ 6:1.

| Token | Hex | Kullanım |
|---|---|---|
| `bg` | `#0E1530` | Uygulama zemini (gece mavisi) |
| `surface` | `#172042` | Kartlar, menü |
| `raised` | `#212C55` | Seçili / üstte duran yüzeyler |
| `text` | `#F4F6FB` | Ana metin (bg'de 16.6:1) |
| `text-2` | `#B9C1DC` | İkincil metin (raised'da 7.5:1) |
| `text-3` | `#ADB6D6` | Üçüncül metin, etiketler (raised'da 6.7:1) |
| `accent` | `#C3B5FF` | Lavanta — seçili menü, odak halkası, nötr vurgu. **Tek aksan rengi.** |
| `status-nominal` | `#7FE0B8` | Normal (nane) |
| `status-advisory` | `#7DBDFF` | Advisory (mavi) |
| `status-caution` | `#FFD35C` | Caution (sarı) |
| `status-warning` | `#FF8F99` | Warning metin/ışıma (raised'da 6.2:1) |
| `status-warning-fill` | `#A51D2D` | Kırmızı tam ekran zemini (beyaz yazı 7.5:1) |
| `status-stale` | `text-3` + %50 opaklık | Eski veri |

Kurallar:
- `accent` mavi **değildir** (mavi advisory'ye ayrıldı). Arayüzde camgöbeği/mavi süs yok.
- Turuncu sadece astronot karakterinin kıyafet detaylarında, soluk tonda (`#E8A66B`) ve küçük alanlarda. Arayüz elemanlarında turuncu yok.
- Parametrelere (nabız, tansiyon...) hastane monitörlerindeki gibi ayrı renk **verilmez**; grafik çizgileri `accent` veya `text-2` olur, renk sadece durumu anlatır.
- Ortam teması (ISS / Ay / Mars) sadece arka plan illüstrasyonunu ve zemin tonunu çok hafif değiştirir; durum renklerine dokunmaz.

### 5.2 Yüzey dili ("yumuşak, hacimli 2D")
- Köşe yarıçapı: kart 24 px, buton 20 px, çip 999 px.
- Gölge: yumuşak ve dağınık (`0 12px 32px rgba(0,0,0,.35)`); sert kenar yok.
- Kartlarda çok hafif dikey gradient (üst %4 daha açık); cam efekti (backdrop-blur) sadece üst barda.
- Işıma (glow) sadece durum anlatmak için (ör. sorunlu bölge); süs ışıması yok.

### 5.3 Yazı tipleri (internetsiz: `@fontsource` ile yerel paket)
- Metin: **Atkinson Hyperlegible Next** (l/1/I ve O/0 ayrımı için tasarlanmış).
- Sayılar: **JetBrains Mono** (çizgili sıfır), `font-variant-numeric: tabular-nums`.
- Boyutlar (tablet, ~50 cm göz mesafesi): gövde 18 px, etiket 16 px (minimum), kart değeri 40 px, sayfa başlığı 28 px, ana durum cümlesi 24 px.

### 5.4 Dokunma alanı
- Hedef cihaz: iPad yatay, **1180 × 820 CSS px** (yaklaşık 132 CSS px/inç).
- 20 mm ≈ **104 CSS px** → tüm dokunulabilir hedefler en az **104 × 104 px** (`--touch-min: 104px`).
- Hedefler arası en az **16 px** (≈3 mm).
- Görünen eleman küçükse (ör. figürdeki göz bölgesi) görünmez, genişletilmiş bir tıklama alanı eklenir.
- Laptop demosunda aynı px değerleri kalır (sadece biraz büyük görünür); bu kabul edildi.

### 5.5 Hareket (Framer Motion)
- Varsayılan geçiş: 250–400 ms, `easeOut`; sayfa geçişi yumuşak fade + 8 px kayma.
- Normal bölgeler: 4–5 sn'lik çok hafif "nefes" (opaklık 0.85↔1, ölçek ≤ 1.02).
- Sarı: sabit sarı ışıma, nefes yok.
- Kırmızı: tam ekran uyarıda sadece ikon 3 Hz / %50 yanıp söner; figürdeki bölge sabit kırmızı ışır.
- Zıplama, sallanma, yay (spring bounce) efekti yok.
- `prefers-reduced-motion` açıksa nefes ve geçişler kapanır; yanıp sönme yerine sabit kalın çerçeve.

## 6. Bilgi mimarisi ve yerleşim

```
┌──────┬──────────────────────────────────────────────────────────┐
│ logo │ MET 042:13:07 │ Ortam: ISS ▾ │ SİMÜLE VERİ │ Acil │ EN/TR │ Astronot ▾ │
├──────┼──────────────────────────────────────────────────────────┤
│ Durum│ [Uyarı şeridi — sadece sorun varken]                     │
│ Ölçüm│                                                          │
│ Geçmiş│            (seçili sayfa içeriği)                      │
│ Ekip │                                                          │
│ Rutin│                                                          │
└──────┴──────────────────────────────────────────────────────────┘
```

- **Sol menü:** sabit, 5 öğe, her biri ≥ 104 px yüksek, ikon + etiket. Seçili öğe `accent`.
- **Üst bar:** görev saati (MET, mono), ortam seçici, sürekli görünen "Simüle veri" etiketi (jüriye dürüstlük), **Acil** butonu (acil durum protokolüne götürür; Modül 3'ün eskalasyon zincirine bağlanır), dil seçici, aktif astronot seçici.
- **Öğren paneli** ayrı sayfa değil; figürde/uyarıda bir şeye dokununca sağdan açılan, sağa kaydırarak da kapanan panel (Base UI `Drawer`).

## 7. Ekranlar

### 7.1 Durum (ana ekran)
```
┌──────────────────────────────────────────────────────────┐
│ ⚠ Sarı  Uyku 5.8 sa · 3 gündür düşük      [Ne yapmalı?] │  ← sadece sorun varsa
├───────────────────────────┬──────────────────────────────┤
│                           │  Nabız     72  bpm  ●        │
│     [astronot figürü]     │  Tansiyon 118/76    ●        │
│                           │  SpO₂      97  %    ●        │
│                           │  Isı     36.8  °C   ●        │
│ [Beyin][Kalp][Akciğer]... │  Uyku     5.8  sa ▼ ⚠        │
│  (bölge çipleri)          │  Ruh hali  4/5      ●        │
└───────────────────────────┴──────────────────────────────┘
```
- **Uyarı şeridi:** önem sırası kırmızı (onaylanmış) → sarı → mavi. Sorun yoksa yerinde tek satır: "Tüm göstergeler normal · son ölçüm 2 sa önce".
- **Figür:** ortada (§8).
- **Bölge çipleri:** figürün altında 10 bölge (beyin, gözler, kalp, akciğer, kan, kemik, kas, bağışıklık, böbrek, tüm vücut), her biri durum ikonu ile. Küçük bölgeler için figüre dokunmanın erişilebilir alternatifi.
- **Değer kartları:** sağda. Her kart: etiket, değer (mono, 40 px), birim, durum ikonu, eşik dışıysa ▲/▼, son ölçüm zamanı. Kart içinde ince **yay gösterge** ve üzerinde sarı/kırmızı eşik bantları (Open MCT'den alınan fikir).

### 7.2 Kırmızı tam ekran uyarı
- Base UI `AlertDialog`, kapatılamaz (ESC ve dışarı tıklama kapalı).
- Zemin `status-warning-fill`, beyaz yazı (ters video, F.5.10'a uygun tek yer).
- İçerik: ikon (3 Hz yanıp söner), gösterge adı + değer, tek cümle açıklama.
- Butonlar (≥ 104 px): **"Ne yapmalıyım?"** (prosedürü açar) ve **"Gördüm"** (onaylar). Onaydan sonra uyarı şeride kırmızı olarak iner, çözülene kadar orada kalır.

### 7.3 Öğren / detay paneli (sağdan açılır)
Sıra her zaman aynı (rakipten alınan iyi pratik: önce eylem):
1. **Ne yapmalıyım?** (Modül 3'ün önerisi + eskalasyon adımı)
2. Şu anki değer + mini trend (7 gün)
3. Neden önemli (sade dil)
4. Nedir? / Uzayda nasıl ölçülür? / Uzay bunu nasıl etkiler?
5. Kaynak ve verinin yaşı
- Üstte bölgenin **şematik organ illüstrasyonu** (aynı yumuşak 2D dil).

### 7.4 Ölçüm (giriş)
- Büyük karo ızgarası: her gösterge bir karo (≥ 104 px).
- Sayı girişi için **ekranda büyük tuş takımı** (sistem klavyesi eldivenle küçük kalır).
- Ruh hali 1–5: **emoji yok**; 5 adımlı, etiketli, sade çizgi ikonlu ölçek.
- Uyku: büyük tutamaklı kaydırıcı.
- Kamera nabzı ve ultrason ekranları: aynı kabuk içinde, "deneysel" etiketiyle.
- Her girişten sonra yumuşak onay ve "Durum'a dön".

### 7.5 Geçmiş (grafikler)
- Recharts. Aralık seçici: 24 sa / 7 gün / 30 gün / tüm görev (segmentli, büyük butonlar).
- `ReferenceArea` ile sarı/kırmızı eşik bantları (düşük opaklık), `ReferenceLine` ile kişisel baseline.
- Çizgi rengi `accent`; eşik dışı noktalar durum rengiyle işaretlenir.

### 7.6 Eski veri görünümü
- Her göstergenin "en uzun geçerlilik süresi" ortam takviminden gelir (Modül 1).
- Süre aşılırsa kart %50 opaklık + saat ikonu + "Son ölçüm 14 sa önce · yeniden ölç" ve figürdeki bölge gri/nötr olur. Asla "normal" yeşili gösterilmez.

### 7.7 Ekip
- **Tıbbi değer ve tıbbi durum gösterilmez** (NASA'da tıbbi veri kişi ile uçuş doktoru arasında kalır).
- Gösterilen: isim, rol, bugünkü rutin uyumu (%), son check-in zamanı, ekip skoru.

### 7.8 Rutin
- Bugünün ölçüm görevleri (yapılacak / gecikmiş / tamam), seri, rozetler, günlük sağlık görevleri.
- Ödül **değere değil rutine uyuma** verilir (yol haritasındaki kural).
- Rozetler: görev armalarından esinlenen, sade çizgi insignia; parıltı ya da konfeti yok.

## 8. Astronot figürü

- **Teknik:** Kod içinde elle yazılmış SVG React bileşenleri (`<AstronautFigure />`), Framer Motion ile animasyon. Dışarıdan resim/3D yok.
- **Görünüm:** Gerçek yetişkin oranlarında (≈7.5 baş boyu), ayakta, hafif ¾ duruş; mat beyaz/açık gri skafandr, kaskın vizörü koyu ve yumuşak yansımalı (**yüz/ifade yok**). Hacim yumuşak radial/linear gradientler ve tek bir yumuşak alt gölge ile verilir. Az ama özenli detay.
- **Sağlık bölgeleri:** Kıyafetin altından görünen yumuşak ışık lekeleri (blur'lu şekiller), anatomik olarak doğru yerlerde:
  - beyin (kask içi üst), gözler (vizör hizası), kalp (göğüs sol), akciğer (göğüs iki yan), kan (kollar/bacaklar boyunca ince damar çizgileri), kemik (uyluk/kaval), kas (üst kol + uyluk), bağışıklık (boyun + koltuk altı noktaları), böbrek (bel iki yan), tüm vücut (silüeti saran ince hale).
- **Durum → görünüm:** nominal = çok hafif nane ışıma + nefes; caution = sabit sarı ışıma; warning = sabit kırmızı ışıma; stale = gri, ışıma yok; veri yok = kesik çizgili kontur.
- **Etkileşim:** Her bölgenin görünmez, ≥ 104 px'lik tıklama alanı var; dokununca Öğren paneli açılır. Seçili bölge `accent` kontur alır.
- **Performans:** `filter: blur` sınırlı sayıda; animasyonlar sadece `opacity`/`transform`.
- Her bölge `data-region` ve `data-status` attribute'ları taşır (test ve stil için).

## 9. Teknik yaklaşım

**Seçilen:** Base UI primitifleri (`@base-ui/react`; shadcn/ui tarzı, bileşenler projeye kopyalanır) + Tailwind + kendi token'larımız. (14.11.2026'da Radix'ten geçildi — ADR-029.)
- Gerekçe: odak yönetimi ve erişilebilirlik hazır gelir, dokunmatik desteği güçlü; görünüm tamamen bizde.

| İhtiyaç | Base UI bileşeni |
|---|---|
| Kırmızı tam ekran uyarı | `AlertDialog` |
| Öğren paneli | `Drawer` (sağdan, kaydırarak kapanır) |
| Segmentli seçici | `RadioGroup` |
| Seçiciler | `Select` (bir `Drawer`/`Dialog` içine konmaz) |
| Astronot menüsü | `Menu` |
| Kaydırıcı (uyku) | `Slider` |

**Elenenler:**
- Sıfırdan Tailwind: erişilebilirliği ve odak yönetimini sıfırdan yazmak 48 saatte riskli.
- Hazır kit (Mantine/Chakra): kendi görsel dili baskın; yumuşak 2D dilimizi giydirmek daha pahalı.

**Klasörler**
- `src/core/ui/` — tasarım sistemi: `tokens.css` (CSS değişkenleri), Tailwind tema genişletmesi, temel bileşenler (Button, Card, StatusBadge, ArcGauge, ValueCard, AlertStrip, RedAlertDialog, Sheet, Segmented, Keypad, Slider). Diğer modüller buradan `index.ts` üzerinden import eder.
- `src/app/` — kabuk: sol menü, üst bar, yönlendirme, sayfa geçişleri.
- `src/modules/visualization/` — figür, Durum ekranı, Geçmiş grafikleri, Ekip paneli.
- `src/modules/intake/` ve `src/modules/routine/` — bu ekranların **görünümü** `src/core/ui` bileşenleriyle yapılır; mantıkları modül sahiplerinde.
- Sözleşmeler `src/core/types` içinde. **Değiştirmeden önce takıma duyurulur.**

**Durum renginin tek kaynağı:** UI durumu kendisi hesaplamaz; Modül 3'ün döndürdüğü `status` (nominal/advisory/caution/warning) + stale bilgisini kullanır. Sadece görselleştirir.

## 9.1 Tasarımcının küçük kararları (değerlendirme sırasında netleştirildi)
- **Aynı anda birden fazla kırmızı:** tek bir tam ekran pencerede liste halinde; her satırın kendi "Gördüm" butonu var, hepsi onaylanınca kapanır.
- **"Ertele" (sarı/mavi):** 2 saat; süre dolunca uyarı şeride geri gelir. Kırmızı ertelenemez.
- **Astronot seçici:** "giriş yapan kişi" anlamındadır (demoda 4 kişi arasında geçiş). Ekranda her zaman sadece seçili kişinin kendi verisi görünür.
- **Dikey tutuş:** desteklenmez; dikeyde "Tableti yatay çevirin" mesajı.
- **Acil butonu:** Modül 3'ün eskalasyon zincirini (kendi bakım → CMO → uçuş doktoru → acil) adım adım gösteren tam ekran prosedür sayfasını açar.

## 10. Builder'a bırakılanlar (senin kararın, makul seç)
- İkon seti (önerilen: Lucide; çizgi kalınlığı tutarlı, 1.75).
- Ortam arka plan illüstrasyonlarının detayı (hafif, düşük kontrastlı).
- Boş durum (hiç veri yok) metinleri ve illüstrasyonları.
- Kartların tam ızgara ölçüleri (1180 × 820 içinde, §5.4 kurallarına uyarak).

## 11. Test ve doğrulama
- Vitest + Testing Library:
  - Uyarı şeridinin önem sırası (kırmızı > sarı > mavi).
  - Kırmızı uyarının "Gördüm" olmadan kapanmaması.
  - Eski verinin "normal" olarak gösterilmemesi.
  - Her durumun renk + ikon + metin üçlüsünü taşıması.
  - Dokunulabilir öğelerin min 104 px olduğu (bileşen seviyesinde).
- Küçük bir script ile `tokens.css` renk çiftlerinin ≥ 6:1 kontrastı.
- Her birleştirmeden önce lint, tip kontrolü, testler (yol haritası kuralı).
- Tüm metinler i18n anahtarı ile (EN varsayılan, TR).

## 12. Öncelik sırası (yol haritası zaman planına uyumlu)
1. **Öncelik 1:** token'lar + `src/core/ui` temel bileşenleri → kabuk (menü, üst bar) → Durum ekranı (şerit, değer kartları) → astronot figürü + bölge durumları → kırmızı tam ekran uyarı.
2. **Öncelik 2:** Öğren paneli → Ölçüm ekranları (tuş takımı, ruh hali, uyku) → Geçmiş grafikleri → Ekip → Rutin.
3. **Öncelik 3:** ortam temaları, eski veri cilası, şematik organ illüstrasyonları, sunum modu, reduced-motion.

---

## Claude Code çalışma talimatı

1. Bu belgeyi repoya `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` olarak koy ve commit et.
2. Kodlamaya başlamadan önce `src/core/types`'ı, `src/core`'u ve mevcut modül iskeletlerini oku. Sözleşmeleri bu belgeyle karşılaştır; uyuşmazlık varsa önce bildir, kendiliğinden değiştirme.
3. Bu belgeden bir **uygulama planı** çıkar (superpowers yüklüyse `superpowers:writing-plans` ile), §12'deki öncelik sırasına göre küçük, test edilebilir adımlara böl, planı onaya sun.
4. Onaydan sonra adım adım uygula; her adımda test yaz, lint/tip/test geçmeden birleştirme yapma.
5. §2'deki anti-hedefler ve §3'teki standart tablosu kesin kurallardır; bir karar bunlarla çelişirse uygulama, sor.
6. Kod, yorum ve commit mesajları İngilizce; arayüz metinleri i18n anahtarıyla (EN + TR).
7. Görsel bir bileşeni bitirdiğinde ekran görüntüsünü al ve §5–§8'e uygunluğunu kendin kontrol et (renk, boyut, hareket, "sevimli değil" kuralı).
