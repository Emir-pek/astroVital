# PROJECT_BRIEF — Challenge, çalışma ilkeleri, ek kaynaklar

> claude.ai proje talimatının ve `KAYNAKLAR.md`'nin repodaki karşılığı. Böylece yerel Claude Code,
> bulut thread'leri ve dört mühendisin Claude'u aynı bilgiyi okur. Teknik kurallar `CLAUDE.md`'de;
> koda girecek kaynaklar `docs/SOURCES.md`'de (kaynak kimliği ile).

## 1. Challenge

**NASA Space Apps Challenge 2026 — "Create Health Monitoring Software for Astronauts on Space
Missions"** (14–15 Kasım 2026, 48 saat).
Sayfa: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

Amaç: astronotların sağlık göstergelerini toplayan, kendi sağlık durumlarını değerlendirip harekete
geçmelerini sağlayan görsel bir yazılım.

- **5 tehlike (NASA HRP):** uzay radyasyonu, izolasyon ve kapalı alan, Dünya'dan uzaklık, değişen
  yerçekimi alanları, düşmanca kapalı ortam.
- **Olası sorunlar:** bağışıklık değişiklikleri, kemik kaybı, kardiyovasküler olaylar, yetersiz
  beslenme, davranışsal sağlık.
- **Örnek göstergeler:** tansiyon, nabız, kan şekeri, vücut sıcaklığı, günlük uyku, ruh hali. Girdi:
  klavye, tıklama, kamera vb.
- **Öneriler (zorunlu değil):** tıklanabilir insan figürü, renk kodlama, zamanla değişen grafikler,
  oyunlaştırma, periyodik ölçüm hatırlatmaları, farklı ortamlar (araç, istasyon, rover, Ay/Mars
  üssü), ölçümler ve riskler için basit açıklamalar.
- **Cevaplanması gereken sorular:** Uzayda hangi ölçümler yapılabilir? Neden muayene gerekir?
  Tehlikeler göstergeleri nasıl etkiler? Ne zaman mürettebat / yerdeki flight surgeon devreye
  girmeli? Kritik durumu önlemek için ne yapılabilir?

## 2. Teslim ve jüri

- Proje sayfası ve bağlantılı tüm materyaller **İngilizce**.
- Demo: **≤ 30 sn video** (İngilizce altyazı) **veya ≤ 7 slayt** (başlık dahil); harici, herkese açık
  link. Sınır aşılırsa Global Judging'e girilmez. Ayrıntı: `docs/DEMO_SCRIPT.md`, skill
  `space-apps-submission`.
- Jüri kriterleri: **Impact, Creativity, Validity, Relevance, Presentation**.
- Uzay ajansı verisinin/kaynağının nasıl kullanıldığı açıkça gösterilir.
- **Yapay zekâ kullanımı** açıkça belirtilir; AI üretimi görsel/videoda filigran → `AI.md`.
- Kod herkese açık GitHub reposunda.

## 3. Çalışma ilkeleri

1. **MVP önce:** 48 saat. Önce uçtan uca çalışan akış, sonra cila. Kapsam önerilerini "MVP / sonra"
   diye etiketle.
2. **Uydurma sayı yok:** Eşik, normal aralık ve uzaya özgü etkiler yalnız güvenilir kaynaktan
   (NASA HRP, NASA-STD-3001, CSA, ESA, hakemli makale); her eşiğin yanında kaynak kimliği.
3. **Uzay ≠ Dünya:** Dünya klinik aralıkları uzayda farklı yorumlanabilir (sıvı kayması, ortostatik
   intolerans, SANS, kemik kaybına bağlı idrar kalsiyumu / böbrek taşı). Mümkünse kişinin kendi
   baseline'ından sapmaya bak.
4. **Tıbbi cihaz değil:** Karar destek / eğitim prototipi; arayüzde ve demoda belirtilir. Veriler
   sentetik veya kamuya açık; gerçek kişisel sağlık verisi yok.
5. **Eyleme dönük uyarı:** Her uyarı _Ne oldu → Neden önemli → Şimdi ne yap → Ne zaman yer
   ekibine/flight surgeon'a haber ver_ sırasıyla. Durum her zaman renk + ikon + metin.
6. **Kullanıcı uzman değil:** Kısa, sade, stres altında okunabilir; büyük dokunma hedefleri.
7. **Gecikme ve bağımsızlık:** Mars'ta tek yön iletişim gecikmesi dakikalar sürer (ADR-024);
   uygulama yerle bağlantı olmadan çalışır (offline-first).

## 4. Ek kaynaklar (KAYNAKLAR.md)

Koddaki eşik ve öneriler **yalnız** `docs/SOURCES.md` kimlikleriyle bağlanır. Aşağıdakiler araştırma
ve sunum için; koda girecekse önce `docs/SOURCES.md` + `sources.config.ts`'e eklenir.

**Kurallar ve rehberler**

- Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging & Awards Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide
- Participant FAQs: https://www.spaceappschallenge.org/resources/participant-faqs/
- Terms & Conditions: https://www.spaceappschallenge.org/legal/

**Challenge'ın resmî kaynakları**

- 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- Ongoing HRP Research in Space: https://www.nasa.gov/hrp/ongoing-hrp-research/
- CSA — Monitoring Radiation for Astronaut Health:
  https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA — Why Do We Conduct Science Experiments in Space?:
  https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

**Standartlar (Validity için)**

- NASA-STD-3001 Vol. 1 Rev C — Crew Health:
  https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf
- OCHMO Technical Briefs: https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/
  — Bone Loss (TB-030), Exercise (TB-031), Habitable Atmosphere (TB-003); ayrıca Radiation, Sleep,
  Nutrition, Behavioral Health, Cardiovascular, SANS.
- The Human Body in Space (UI açıklama metinleri için): https://www.nasa.gov/hrp/bodyinspace

**Uzayda ölçüm**

- CSA Bio-Monitor / Astroskin: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp
- Astroskin ile otonom mürettebat izleme (NTRS): https://ntrs.nasa.gov/citations/20190001996
- Astroskin davranışsal öz-izleme (NTRS): https://ntrs.nasa.gov/citations/20150021842
- CSA Space medicine: https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/

**Veri setleri**

- NASA OSDR: https://osdr.nasa.gov/ · NASA Life Sciences Portal: https://nlsp.nasa.gov/explore/lsdahome
- NASA Open Data Portal: https://data.nasa.gov/
- NOAA SWPC uzay hava durumu: https://www.swpc.noaa.gov/ · NASA DONKI: https://api.nasa.gov/
  (uygulama offline-first; canlı veri çekmez, gerekirse veri gömülür — ADR'lere bak)
- Bireysel astronot vital verisi kamuya açık değil → sentetik veri + yayınlara dayalı eşikler.

**Diğer ajanslar**

- ESA: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration
- JAXA: https://humans-in-space.jaxa.jp/en/

**Akademik**

- Patel et al., 2020 — "Red risks for a journey to the red planet" (npj Microgravity):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7645687
- NASA Twins Study (Garrett-Bakelman et al., Science 2019); SOMA / Inspiration4 (Nature, 2024).

**Aynı challenge'a yapılmış açık kaynak projeler (fikir kopyalamadan, eksiklerini görmek için)**

- AURORA: https://github.com/fabriciojunio/aurora-astronaut-health
- AstroDocX: https://github.com/A-42-018/AstroDocX
- Crew Health Monitor: https://github.com/AdityaK0804/Crew-Health-Monitor
- VITALS: https://github.com/noor-hossain13/vitals-astronaut-health-monitor
- AUREON: https://github.com/adityabiswas108/AUREON

## 5. Ayrışma fikirleri (Creativity)

- Kişisel baseline'a göre sapma + "Dünya kuralı / uzay kuralı" karşılaştırması.
- Tehlike → organ → gösterge → aksiyon zinciri vücut haritasında.
- Ortama göre değişen öncelikler (ISS / Ay / Mars: radyasyon, gecikme, yerçekimi).
- İletişim gecikmesi simülasyonu: "flight surgeon'a gönder" → cevap dakikalar sonra.
- Oyunlaştırma: ölçüm/egzersiz/uyku serileri, mürettebat ortak hedefleri.
- Kamera ile nabız (rPPG) — riskli, MVP sonrası.
