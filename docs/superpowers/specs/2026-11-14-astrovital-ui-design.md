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
- **Kutu sistemi — her kutu üç rolden biridir (ADR-037):**

  | Rol | Ne için | Zemin | Köşe | İç boşluk | Gölge | Kod |
  |---|---|---|---|---|---|---|
  | **Panel** | Sayfadaki üst düzey kap: kart, uyarı şeridi, değer rayı, modal, toast, açılır menü, yan panel | `card-surface` (surface + üstte %4 açık gradient) | 24 px `--av-radius-panel` | 24 px `--av-pad-panel` | `--av-shadow-soft` | `Card`, `BOX.panel` / `BOX.panelFlush` |
  | **Tile / Satır** | Panelin içindeki kutu veya tekrarlanan liste öğesi (ekip kişisi, güncel değer, boş durum, yer tutucu notu, seçenek kutusu) | `raised` | 20 px `--av-radius-tile` | 16 px `--av-pad-tile` | yok | `Tile`, `BOX.tile` |
  | **Pill** | Rozet, çip, durum hattı | rolün kendi zemini | 999 px `--av-radius-pill` | kendi | yok | `BOX.pill` (`rounded-pill`) |

  Paneller ve sayfa bölümleri arası 24 px (`--av-gap-section`, `gap-section`); dokunma hedefleri arası en az 16 px (`gap-touch-gap`). Kontroller (Button, Segmented, menü öğesi, bölge etiketi) kutu değil, 20 px `rounded-button` köşeli kontroldür. İç içe en fazla iki katman: Panel → Tile; Panel içinde Panel, Tile içinde Tile yok. Divider'lı liste satırları (değer rayı) kutu değildir; paneli `BOX.panelFlush` olur, satırlar `px-panel` taşır.
- Tailwind sınıfları token'dan: `rounded-panel / rounded-tile / rounded-pill`, `p-panel / p-tile`, `gap-section`. Stok yarıçaplar (`rounded-lg`, `rounded-full` …), eski `rounded-card`, stok yazı boyları (`text-sm` …), stok gölgeler (`shadow-xl` …) ve eski renk takma adları kaynakta yasaktır; `src/core/ui/__tests__/boxSystem.test.ts` zorlar (diğer modüllerin henüz taşınmamış dosyaları test içindeki `PENDING_MIGRATION` listesinde, liste yalnız küçülür).
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
- Görünmez tıklama alanı kullanılmaz: dokunulacak şey her zaman görünen bir hedeftir. Figürdeki küçük bölgeler (ör. gözler) figürün yanındaki ≥ 104 px'lik bölge etiketleriyle seçilir (§7.1, §8; ADR-036).
- Laptop demosunda aynı px değerleri kalır (sadece biraz büyük görünür); bu kabul edildi.

### 5.5 Hareket (Framer Motion)
- Varsayılan geçiş: 250–400 ms, `easeOut`; sayfa geçişi yumuşak fade + 8 px kayma.
- **Nefes yalnız tüm vücut halesinde:** hale nominalken 4,5 sn'lik çok hafif "nefes" (opaklık 0.85↔1) alır. İç bölgeler hiç nefes almaz; nominal iç bölgeler figürde hiçbir şey çizmez (ADR-036 — tek bir uyarı, ışıyan kalabalıkta kaybolmasın).
- Sarı (caution) / mavi (advisory): sabit, nefes yok.
- Kırmızı: tam ekran uyarıda sadece ikon 3 Hz / %50 yanıp söner; figürdeki bölge sabit kırmızı işaretli kalır.
- Zıplama, sallanma, yay (spring bounce) efekti yok.
- `prefers-reduced-motion` açıksa nefes ve geçişler kapanır (hale sabit çizilir); yanıp sönme yerine sabit kalın çerçeve.

## 6. Bilgi mimarisi ve yerleşim

```
┌──────┬──────────────────────────────────────────────────────────┐
│ logo │ MET Gün 30 · 18:51 │ ISS ▾ │ Acil │ EN/TR │ Astronot ▾ │  ← tek satır
│      │ Simüle veri         │                                     │
├──────┼──────────────────────────────────────────────────────────┤
│ Durum│ [Uyarı şeridi — sorun varken; Durum'da sağ sütunda]      │
│ Ölçüm│ Başlık (h1)            [● Tüm göstergeler normal · …]    │
│ Geçmiş│            (seçili sayfa içeriği — kendi içinde kayar)  │
│ Ekip │                                                          │
│ Rutin│                                                          │
├──────┴──────────────────────────────────────────────────────────┤
│ Feragat (tam genişlik, sabit alt satır, her sayfada görünür)    │
└─────────────────────────────────────────────────────────────────┘
```

- **Tek ekran (ADR-036):** kabuk görünüm alanı yüksekliğindedir (`h-dvh`); belge kaymaz, yalnız sayfa alanı kendi içinde kayar. Feragat tam genişlikte sabit alt satırdır, kaydırmadan her zaman görünür.
- Üst bar 1180 px'de EN ve TR'de tek satırdır (≈ 128 px): ortam seçicide kısa ad (`topbar.envShort.*`, ör. "ISS", "Mars üssü"); tam ad erişilebilir adda ve açılan listede.
- **Sayfa başlığı (`PageHeader`) iki satırlık ızgaradır:** 1. satır başlık (h1) + sağda durum hattı; 2. satır alt başlık + sağda sayfa eylemleri (ör. Geçmiş'te aralık seçici). Eylem yoksa alt başlık tam genişliği kullanır. Böylece 1180 px'de EN ve TR'de durum hattı hiçbir zaman alt başlığın altına kırılmaz. Başlık ile içerik arası 16 px.

- **Sol menü:** sabit, 5 öğe, her biri ≥ 104 px yüksek, ikon + etiket. Seçili öğe `accent`.
- **Üst bar:** görev saati (MET, mono), ortam seçici, sürekli görünen "Simüle veri" etiketi (jüriye dürüstlük), **Acil** butonu (acil durum protokolüne götürür; Modül 3'ün eskalasyon zincirine bağlanır), dil seçici, aktif astronot seçici.
- **Öğren paneli** ayrı sayfa değil; figürde/uyarıda bir şeye dokununca sağdan açılan, sağa kaydırarak da kapanan panel (Base UI `Drawer`). Varsayılan 480 px, ekranın sağ kenarına yapışık tam yükseklikte ve arkasını karartır (modal). Durum ekranında bölge paneli sağ sütunun kutusuna oturan yüzen bir paneldir: üst barın altında, feragat satırının üstünde; sayfayı karartmaz ve modal değildir (§7.1).

## 7. Ekranlar

### 7.1 Durum (ana ekran)
```
┌──────────────────────────────────────────────────────────────────┐
│ Durum                  [● Tüm göstergeler normal · son ölçüm …]  │  ← sorun yoksa
├─────────────────────────────────────────┬────────────────────────┤
│ [Beyin  ]──╮               ╭──[Gözler ] │ ⚠ Uyku 5.8 sa · düşük  │  ← sadece sorun
│ [Bağışık]──┤   astronot    ├──[Kalp   ] │ [Ne yapmalıyım?] [+2]  │    varsa
│ [Akciğer]──┤    figürü     ├──[Böbrek ] ├────────────────────────┤
│ [Kemik  ]──┤               ├──[Kas    ] │ Son değerler (kayar)   │
│ [Tüm v. ]──╯               ╰──[Kan    ] │ Uyku    5.8 sa ⚠  ◠    │
└─────────────────────────────────────────┴────────────────────────┘
          ≈ %60                                    ≈ %38
```
- **1180×820'de dikey kaydırma yok — uyarı varken de.** Figür ve 10 etiket her durumda kaydırmadan görünür (ADR-036). 1366×768'de sayfa alanında ≈ 48–52 px kayma kabul edilir (en alttaki iki etiket feragat satırının arkasında kısmen kalır: 584 px'lik etiket sütunu ≈ 540 px'e sığmaz).
- **Uyarı şeridi:** önem sırası kırmızı (onaylanmış) → sarı → mavi; ikon + başlık + ayrıntı, "Ne yapmalıyım?", "Ertele" (kırmızıda yok) ve "+n daha". Diğer sayfalarda üst barın altında kendi satırında, tek satırlık panel (≈ 156 px: 104 px düğme + panel boşluğu + renkli kenar, `AlertStrip layout="row"`; kenarı en ağır uyarının renginde). **Durum sayfasında** aynı içerik sağ sütunda, değer rayının üstünde dikey kart olarak durur (`AlertPanel`, `AlertStrip layout="stacked"`; kenarı en ağır uyarının renginde; üç düğmeyle ≈ 340 px); ray kalan yükseklikte kendi içinde kayar, nominal olmayan satırlar en üstte olduğu için uyarıdaki değer görünür kalır. Sorun yoksa şerit yoktur; yerine sayfa başlığı satırının sağında tek satırlık durum hattı (`StatusLine`, `AlertSummary`): "Tüm göstergeler normal · son ölçüm 2 sa önce". Durum sayfasında alt başlık yok.
- **Figür:** sol bölmenin (≈ %60) ortasında, kapsayıcısıyla viewBox üzerinden ölçeklenir (1180×820'de ≈ 258 × 584 px) (§8).
- **Bölge paneli:** bir etikete dokununca açılan panel tam olarak sağ sütunun (uyarı kartı + değer rayı) yerini alır: aynı genişlik, aynı üst/alt/sağ kenar (`Sheet` `bounds`; 1180'de 378 px genişlik, üst kenar 183 px — üst bar 128 px'de biter —, alt kenar 767 px — feragat 779 px'de başlar; en az 360 px) ve sayfayı karartmaz: figür, 10 etiket ve basılan etiketin accent halkası/kılavuz çizgisi panel açıkken görünür kalır. **Üst bar (Acil düğmesi başta) hiçbir zaman örtülmez.** Panel modal değildir: odak panelde hapsolmaz, sayfanın geri kalanı dokunulabilir kalır — başka bir etikete dokunmak paneli o bölgeye geçirir, aynı etikete tekrar dokunmak kapatır, Acil doğrudan çalışır. Kapatma: kapat düğmesi, Escape, sağa kaydırma veya aynı etiket.
- **Bölge etiketleri (çiplerin yerine, ADR-036):** figürün iki yanında 10 görünür etiket, her yanda 5 (sol: beyin, bağışıklık, akciğer, kemik, tüm vücut; sağ: gözler, kalp, böbrek, kas, kan). Her etiket 152×104 px, aralık ≥ 16 px, koyu yüzey üzerinde ad + durum (renk + ikon + metin); uyarıdaki etiketin kenarı durum renginde. Etiketten organdaki noktaya ince bir kılavuz çizgi (koyu kılıf + ince çizgi) gider; çizgiler kesişmez. Klavye sırası sol sütun yukarıdan aşağı, sonra sağ sütun.
- **Değer rayı:** sağda (≈ %38) kompakt liste, 6 satır × ≈ 88–90 px (`VitalRow`): etiket + durum rozeti, büyük değer (mono, 40 px) + birim, eşik dışıysa ▲/▼ ve **mini yay gösterge**. Nominal olmayan satırlar en üstte (warning → caution → advisory → eski → veri yok → nominal). Son ölçüm zamanı yalnız veri eskiyse görünür (saat ikonu ile); aksi halde ekran okuyucuya okunur.
- **Mini yay gösterge (96×44):** nötr iz; yalnız değerin bulunduğu bant durum rengiyle boyanır (Open MCT eşik bandı fikri, sadeleştirilmiş). Bant dışı değer ◀/▶ ile gösterilir.

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
- Süre aşılırsa değer ve gösterge %50 opaklık + saat ikonu + "Son ölçüm 14 sa önce · yeniden ölç"; figürde bölge işaretsiz kalır, bölge etiketi "Eski" der. Asla "normal" yeşili gösterilmez.

### 7.7 Ekip
- **Tıbbi değer ve tıbbi durum gösterilmez** (NASA'da tıbbi veri kişi ile uçuş doktoru arasında kalır).
- Gösterilen: isim, rol, bugünkü rutin uyumu (%), son check-in zamanı, ekip skoru.

### 7.8 Rutin
- Bugünün ölçüm görevleri (yapılacak / gecikmiş / tamam), seri, rozetler, günlük sağlık görevleri.
- Ödül **değere değil rutine uyuma** verilir (yol haritasındaki kural).
- Rozetler: görev armalarından esinlenen, sade çizgi insignia; parıltı ya da konfeti yok.

## 8. Astronot figürü

- **Teknik:** Kod içinde elle yazılmış SVG React bileşenleri (`<AstronautFigure />`), Framer Motion ile animasyon. Dışarıdan resim/3D yok.
- **Görünüm:** Gerçek yetişkin oranlarında (kask dahil ≈ 7,3 kask boyu — kasklı bir 7,5 baş figürü; büyük kafa yok), ayakta, ¾ duruş; mat beyaz/açık gri skafandr, kaskın vizörü koyu ve yumuşak yansımalı (**yüz/ifade yok**). Az ama özenli detay.
  - **Duruş (asimetrik):** gövde ve vizör izleyicinin sağına dönük; yaşam destek sırt çantası bu yüzden solda, yakın kolun arkasında ve omzun üstünde görünür. Ağırlık yakın (sol) bacakta; uzak bacak bir adım önde (botu daha aşağıda, burnu sağa dönük). Yakın kol dirsekte hafif bükük sarkar, uzak kol dirsekten bükük, eldiven kalçanın yanında; omuzlarda hafif eğim. Hiçbir parça ayna kopyası değil.
  - **Işık:** tek anahtar ışık sol üstten. Her parça kendi konturuna göre gölgelenir (parçanın dışı ışığa doğru kaydırılıp bulanıklaştırılır ve parçaya kırpılır → ışıktan dönen kenarda form gölgesi, ışığa bakan kenarda ışık; mesafe parçanın kalınlığıyla orantılı). Öndeki parça arkadakine yumuşak gölge düşürür; sağ dış siluette soğuk ince kenar ışığı (`--av-suit-rim`) gövdeyi gece mavisinden ayırır. Yere tek yumuşak gölge.
  - **Detay (ölçülü):** göğüs kontrol ünitesi + tek umbilikal hortum ve konnektörü, termal giysi panel dikişleri, diz takviyeleri, omuz/bilek/bel/ayak bileği halkaları, eldiven parmak çizgileri, bot burun dikişi ve koyu taban, kask lambası (mercek ileri bakar), uyluklarda soluk turuncu kimlik şeridi. Ajans logosu/arması yok.
- **Sağlık bölgeleri:** anatomik olarak doğru yerlerde, siluete kırpılmış işaretler:
  - beyin (kask içi üst), gözler (vizör hizası), kalp (göğüs sol), akciğer (göğüs iki yan), kan (kollar/bacaklar boyunca dolgulu, sivrilen damar şeritleri — çizgi değil alan), kemik (uyluk/kaval), kas (üst kol + uyluk), bağışıklık (boyun + koltuk altı noktaları), böbrek (bel iki yan), tüm vücut (silüeti saran ince hale).
- **Durum → görünüm (ADR-036):**
  - nominal, eski (stale) ve veri yok: figürde **hiçbir şey çizilmez** — durum yanındaki etikette okunur (eski veri asla "normal" görünmez; etiket "Eski"/"Veri yok" der).
  - advisory / caution / warning: siluete kırpılmış, ortası güçlü kenara doğru açılan durum renginde dolgu + koyu kontur (`--av-bg`, beyaz kıyafet üzerinde ≥ 3:1); damarlar da aynı dolgu + konturla (genişlik ≥ 6 px), böylece hiçbir işaret kılavuz çizgisine benzemez. Kılavuz çizgi durum renginde ve üzerinde küçük bir durum simgesi (organı örtmesin diye noktadan 24 px geride).
  - tüm vücut halesi: siluetin birkaç px dışında, koyu bir boşlukla ayrılmış ince kontur çizgisi + çok hafif ışıma (bulanık leke değil). Nominalken ince, soluk nane + nefes (§5.5); uyarıda sabit, daha kalın durum rengi; eski/veri yokken çizilmez.
- **Etkileşim:** Figürün üzerinde görünmez tıklama alanı yok; seçim figürün yanındaki görünür bölge etiketleriyle yapılır (§7.1); dokununca Öğren paneli açılır. Seçili bölgede: etiket `accent` halka alır, kılavuz çizgisi `accent` olur, diğer bölgelerin işaretleri ve çizgileri soluklaşır. Figürde çerçeve halkası yok.
- **Ölçek:** figür kapsayıcısıyla viewBox (`182 8 226 512`, siluete + haleye kırpılmış) üzerinden ölçeklenir. Yerleşim saf fonksiyonla hesaplanır (`computeBodyMapLayout`); bölge çapaları (`REGION_ANCHORS`) çizimdeki organların üzerindedir (`figureGeometry.test.ts`).
- **Performans:** `filter: blur` yalnız kıyafet ve halede; animasyonlar sadece `opacity`/`transform`.
- Her bölge `data-region` ve `data-status` attribute'ları taşır (test ve stil için).

## 9. Teknik yaklaşım

**Seçilen:** Base UI primitifleri (`@base-ui/react`; shadcn/ui tarzı, bileşenler projeye kopyalanır) + Tailwind + kendi token'larımız. (14.11.2026'da mevcut parçalar Radix'ten Base UI'a taşındı — ADR-033. Radix yasak değil; gerekirse parça bazında kullanılabilir — ADR-029, ADR-034.)
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
- `src/core/ui/` — tasarım sistemi: `tokens.css` (CSS değişkenleri), Tailwind tema genişletmesi, temel bileşenler (Button, Card (= Panel), Tile, `BOX` tarifleri, StatusBadge, ArcGauge, ValueCard, VitalRow, StatusLine, AlertStrip, RedAlertDialog, Sheet, Segmented, Keypad, Slider). Diğer modüller buradan `index.ts` üzerinden import eder.
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
