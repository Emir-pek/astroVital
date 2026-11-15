# DEMO_CREW_STORIES — Karma görev senaryosu ve mürettebatın hikâyeleri

**Sahip:** Mühendis 1 · **Karar:** ADR-038 (senaryo), ADR-048 (veri = takvim) · **Kod:**
`mixed_mission` in `src/core/simulation/scenarios.ts` (sabitler: `MIXED`), mürettebat
`src/core/simulation/crew.ts` · **Test:** `src/core/simulation/__tests__/generator.test.ts`

## Amaç

Bu challenge için gerçek bir veri seti yok; demo verisini biz üretiyoruz. Varsayılan senaryo **karma görev**
(`mixed_mission`) jüriye tek ekranda uygulamanın bütün yeteneğini göstersin diye tasarlandı:

- **Dört astronot, dört hikâye, dört durum seviyesi aynı anda:** nominal · advisory · caution · warning.
- Her hikâye gerçek bir uzay tehlikesine (NASA HRP RIDGE) bağlı ve hangi verinin hangi eşiğe takıldığı açık.
- Veri hatırlatma takvimiyle birebir: ekranda görünen her ölçüm, takvimde o gün o saatte olan bir göreve
  karşılık gelir (ADR-048, `docs/ROUTINE_SCHEDULE.md`).

Varsayılan parametreler: ISS, 30 gün, seed `2026`. Gürültü (günden güne doğal oynama) gerçekçilik için
korunuyor; bu yüzden durumlar **varsayılan seed'de** garanti edilir ve testle kilitlidir. Ayarlar'dan seed
değişirse bir astronotun tek bir değeri bant kenarını aşabilir (300 seed'lik denemede hedef durum oranları:
Mira %78, Kenji %100, Selin %83, Lucas %80).

Gün numaraları görev günüdür (1 = görev başlangıcı, 30 = bugün). Eşik bantları: `docs/THRESHOLDS.md` ↔
`src/core/config/thresholds.config.ts` (ISS'te vücut ısısı bantları +0.3 °C kaydırılır).

## Beklenen durum tablosu

| Astronot            | Beklenen Status | Tetikleyen veri                                                                                                       | Beklenen eskalasyon    | Motor bugün üretiyor mu?                                    |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| crew-1 Mira Okafor  | nominal         | Tüm son değerler nominal bantta                                                                                       | `self_care`            | Evet (motor stub'ı da nominal döner)                        |
| crew-2 Kenji Arata  | **warning**     | Isı ≥ 38.3 °C (ISS bandı 38.3–39.8), uyku < 6 sa ve "3 gün < 6.5 sa", egzersiz < 60 dk                                | `crew_medical_officer` | Hayır, motor stub (Mühendis 3)                              |
| crew-3 Selin Aydın  | **caution**     | Son hafta uyku ortalaması 6–7 sa bandında, ruh hali 3 (3–4 bandı), egzersiz 60–120 dk bandında                        | `self_care`            | Hayır, motor stub (Mühendis 3)                              |
| crew-4 Lucas Moreau | **advisory**    | Sistolik kişisel baseline'ın ~+9 üstünde (113 → ~122) ama nominal bantta; son 7 günün 4'ünde egzersiz hedefin altında | `self_care`            | **Hayır**, motor `advisory` üretmiyor (ADR-031, Mühendis 3) |

## crew-1 · Mira Okafor (Komutan) → NOMINAL

- **Kim:** Komutan, 44, K. Baseline: KB 114/74, nabız 61, şeker 86, ısı 36.7, uyku 7.9 sa, ruh hali 4.5,
  SpO₂ 98, solunum 15, egzersiz 150 dk/gün.
- **Hikâye:** Senaryo etkisi yok; yalnız doğal gürültü ve haftalık dinlenme günleri (7., 14., 21., 28. gün
  egzersiz yok). Referans kişi: "sağlıklı biri nasıl görünür?"
- **Bu durum hangi verilerden çıkarılır?** Her metriğin son değeri kendi nominal bandında (ör. uyku 7–9,
  sistolik 90–130, egzersiz ≥ 120); hiçbir sustained/trend kuralı tetiklenmez.
- **İlgili tehlike:** Yok; diğer üçüyle kıyas noktası.

## crew-2 · Kenji Arata (Uçuş Mühendisi) → WARNING

- **Kim:** Uçuş mühendisi, 38, E. Baseline: KB 118/76, nabız 60, şeker 88, ısı 36.6, uyku 7.6 sa, ruh hali
  4.4, SpO₂ 98, solunum 15, egzersiz 150 dk.
- **Hikâye (zaman çizelgesi):**
  - Gün 1–25: normal.
  - **Gün 26–27 (öncü işaretler):** dinlenme nabzı baseline'ın +7 üstü (~67), uyku −0.7 sa (~6.9). Değerler
    henüz nominal/sınırda; tek başına alarm yok, ama grafikte geriye bakınca "önceden belliydi" denir.
  - **Gün 28–30 (ateş + sıvı kaybı, `fever_dehydration` etkisi yeniden kullanıldı):** ısı +2.1 °C'ye kadar
    (~38.6–38.9), nabız +30 (~95–105), solunum +6, SpO₂ −3 (~95), tansiyon −12/−7, şeker +14, uyku −1.6 sa,
    ruh hali −1.4, egzersiz %85 düşer (fiilen atlanır).
- **Bu durum hangi verilerden çıkarılır?**
  - `bodyTemp` ≥ 38.0 (+0.3 ISS kaydırmasıyla ≥ 38.3) → **warning**, `crew_medical_officer` (THRESHOLDS
    "kritik yüksek" bandı).
  - `sleepHours` < 6 → warning bandı; ayrıca sustained kuralı "3 gün < 6.5 sa" → warning, CMO.
  - `exerciseMinutes` < 60 → warning bandı (tek gün `self_care`, ADR-013).
  - `heartRate` 7 günlük trend +%15 kuralı → caution (destekleyici).
- **İlgili tehlike:** Kapalı/düşmanca ortam (`environment`): kapalı alanda enfeksiyon yayılımı, bağışıklık
  değişimi.

## crew-3 · Selin Aydın (Mürettebat Tıp Sorumlusu) → CAUTION

- **Kim:** Mürettebat tıp sorumlusu (CMO), 36, K. Baseline: KB 109/70, nabız 66, şeker 85, ısı 36.8, uyku
  7.9 sa, ruh hali 4.5, SpO₂ 99, solunum 15, egzersiz 150 dk.
- **Hikâye (zaman çizelgesi):**
  - Gün 1–9: normal.
  - **Gün 10 → 30 (izolasyon kaynaklı yavaş düşüş, doğrusal):** uyku toplam −1.1 sa (haftada ~0.4 sa;
    son hafta ortalaması ~6.7–6.9 sa), ruh hali 4.5 → ~3.3 (tam sayıya yuvarlanınca çoğunlukla 3), egzersiz
    150 → ~110 dk.
  - Tek bir gün kırmızı (warning) olacak bir sıçrama yok; tablo "sürünen" bir trend.
- **Bu durum hangi verilerden çıkarılır?**
  - `sleepHours` 6–7 bandı → caution; `mood` 3–4 bandı → caution; `exerciseMinutes` 60–120 → caution.
  - **Bilinçli tasarım:** son hafta uyku ortalaması 6.5'in **üstünde** tutuldu. Mevcut eşiklerde
    "3 gün üst üste < 6.5 sa" sustained kuralı **warning** verir (caution değil); ortalama 6.5'in altına
    inseydi Selin warning olurdu ve dört seviye ayrışmazdı. Durum bu yüzden tek bir sustained kuraldan değil,
    üç metriğin birlikte caution bandına inmesinden gelir.
- **İlgili tehlike:** İzolasyon ve kapalı alan (`isolation`): uyku ve ruh hali yavaşça bozulur.

## crew-4 · Lucas Moreau (Görev Uzmanı) → ADVISORY

- **Kim:** Görev uzmanı, 47, E. Baseline: KB 113/75, nabız 69, şeker 89, ısı 36.6, uyku 7.8 sa, ruh hali
  4.4, SpO₂ 97, solunum 15, egzersiz 145 dk.
- **Hikâye (zaman çizelgesi):**
  - Gün 1–20: normal.
  - **Gün 21–30:** sistolik baseline'ın +9 mmHg üstüne oturur (113 → ~122). Popülasyon için hâlâ normal
    (nominal bant 90–130), ama **bu kişi için** belirgin bir kayma.
  - **Gün 24–27:** egzersiz hedefin altında (~%60, ~80–90 dk); 28. gün dinlenme; 29–30 normal. Son 7
    günün 4'ünde egzersiz < 120 dk.
- **Bu durum hangi verilerden çıkarılır?** Hiçbir değer eşik bandını aşmıyor; advisory, **kişisel
  baseline'a göre sapma** (son 10 gün ortalaması − ilk 20 gün ortalaması ≈ +9) ve egzersiz uyumunun
  düşmesinden çıkar. Sistolik 7 günlük +%10 trend kuralı tetiklenmez (kayma yavaş ve küçük).
  Motor bugün `advisory` üretmiyor (ADR-031); veri beklenen durumu sağlar, kural Mühendis 3'te.
- **İlgili tehlike:** Yerçekimi alanı (`gravity`): mikro-g'de kardiyovasküler uyum ve egzersiz
  karşı-önleminin (countermeasure) aksaması.

## Mühendis 3 için

"Beklenen durum tablosu" değerlendirme motoru testlerinde örnek veri seti olarak kullanılabilir:
`generateHistory({ seed: 2026, scenario: 'mixed_mission', environment: ENVIRONMENTS.iss, days: 30, ... })`.
Motor bir astronot için tablodan farklı durum üretirse bildir. Ya veri ayarlanır ya da kuralda
tartışılacak bir şey vardır. Dikkat edilecekler:

- `advisory` için kişisel baseline kuralı henüz yok (ADR-031); Lucas bu kuralın test verisi.
- `mood` tam sayı (1–5). "3 günde −%25" trend kuralı 4 → 3 geçişinde tetiklenir; gürültülü veride
  nominal kişilerde de ara sıra tetiklenebilir. Kuralın tam sayı ölçekte nasıl çalışacağına bak.
- Uyku sustained kuralı (3 gün < 6.5) **warning** veriyor; Selin bu yüzden 6.5'in üstünde tutuldu.

## Görselleştirme için (Emir / visualization)

Bu senaryonun ekranlarda nasıl gösterileceği tamamen görselleştirme ekibine bırakılmıştır; Mühendis 1
yalnız veriyi ve bu dokümanı sağlar. Öneriler (zorunlu değil):

- Ekip görünümünde dört durum yan yana (renk + ikon + metin).
- Kenji: nabız/uyku grafiğinde 26–27. günlerdeki öncü işaretler, ateşten önce görünür olsun.
- Selin: uyku ve ruh hali trend çizgisi (10. günden itibaren eğim).
- Lucas: sistolik grafiğinde kişisel baseline çizgisi ve son 10 günün ondan ayrışması; popülasyon bandı
  arka planda nominal.

## Mürettebat neden 4 kişi?

- **Faz 0 seçimi;** değişmedi (ADR-038).
- NASA'nın **Evolvable Mars Campaign** (2014–2016) çalışmasında Mars mürettebatı **4**, **DRA 5.0**'da
  (2009) **6** kişi (`nasa-nesc-mars-crew-size`).
- 4 kişi ekranda okunaklı (tablette tek satır/ızgara) ve dört durum seviyesine birebir oturuyor.
- Mürettebat ekleme/çıkarma arayüzü yok: mürettebat görev başında bir kez belirlenir. Bu "sonra" kapsamı.
