# CLAUDE.md — tools/anomaly-detection (çevrimdışı Python aracı)

**Sahip:** Emre (veri seti + anomali tespiti). Branch: `feat/anomaly-detection`. Karar: ADR-039.
Kurulum ve komutlar: bu klasördeki `README.md`.

## Amaç

- Ürün: **teşhis değil, karar destek.** Kişiye özel normal değer + açıklanabilir anomali tespiti + Dünya
  iletişim gecikmesini (Mars, tek yön 4–24 dk) hesaba katan uyarı ve önceliklendirme.
- Bu klasör uygulamanın **dışında**: bundle'a girmez, CI çalıştırmaz, uygulama çalışma anında çağırmaz.
  Uygulama yalnız çıktıyı (`results/alerts.csv`) kullanabilir. `src/` altındaki ESLint/katman kuralları
  burada geçerli değil; yine de kod/yorum İngilizce, `docs/` Türkçe.

## Veri kararları (kesin)

- Gerçek sürekli astronot verisi açık değil (OSDR kontrollü erişim, LSDA resmi talep → kullanılmıyor).
- **MMASH** (PhysioNet, açık, ODbL): 22 genç erkek, kişi başı 24 saat (RR, aktigrafi, uyku; PVT yok).
  Şablon olarak kullanılıyor. Ham veri `data/raw/` altında, **git'e girmez**.
- Hibrit kuralı: veri seti ancak MMASH'in somut bir eksiğini kapatıyorsa eklenir; **kayıtlar değil
  parametreler** birleştirilir. Fitbit (Kaggle) yalnızca günler arası değişkenlik için, henüz işlenmedi.
  WESAD yalnızca doğrulama için, opsiyonel. SWELL / K-EmoCon / Sleep-EDF / ayrı stres modülü yok.
- MVP sinyalleri: uyku, aktivite, ışık, nabız, HRV (RMSSD), kabin CO₂, radyasyon dozu, (opsiyonel) PVT.
- Radyasyonun etkisini vital bulgulardan tespit etmeye çalışma; doz ayrı kanal.

## Üretici — astrohealth/synth (v4)

- 24 saatlik şablon → günler 24 saate sabit (uyanış görev saatiyle 07:00 ±60 dk) → günlük değişkenlik,
  uzay etkisi (ilk 3 gün kademeli), uyku borcu → kabin ortamı (CO₂, doz) **tüm mürettebatta ortak**.
- Demo olayları (`PARAMS["event_day"] = 8`): CM2'de 7.→8. gece 4.5 saat yatak (bireysel); 8. gün
  12:00–18:00 kabin CO₂ 6 mmHg (kabin).
- `params.py` içindeki PLACEHOLDER sayılar kaynakla doğrulanmadı. **Demo güzel görünsün diye büyütme;**
  literatürle kalibre et.
- Zaman: `met_min` herkes için ortak anahtar. `mission_day` kişisel tablolarda kişinin uyanma–uyku döngüsü.
- Cevap anahtarı sütunları (`event_label`, `personal_event`, `cabin_event`, `events_ground_truth.csv`)
  dedektöre **girdi olarak verilmez** (`detect/pipeline.py: load_inputs`, yalnız `detect/evaluate.py` okur).
- Doğru sürüm kontrolü: `astrohealth/synth/crew.py` içinde `next_wake` geçmeli; her kişide 20.160 satır.

## Dedektör — astrohealth/detect (v1)

- Kabin: CO₂ ≥ 4.0 mmHg 15 dk → DİKKAT, ≥ 5.0 → UYARI, eşik altına dönünce BİLGİ (eşikler PLACEHOLDER).
- Bireysel: kayan kişisel normal (ilk 3 gün hariç, son 7 gün, en az 3 gün, bayraklı günler normale
  katılmaz). Medyan + max(1.48·MAD, alt sınır). Alt sınırlar: uyku 25 dk, nabız 2 bpm, RMSSD 4 ms, PVT 15 ms.
- Uyku z ≤ −2.5 ana sinyal. PVT tek başına z ≥ 3; son 24 saatte uyku uyarısı varsa z ≥ 2. CO₂ yüksekken
  ≥2 kişide PVT artışı → ortama bağlanır.
- Kabin uyarısı son 24 saatte bireysel uyarısı olanları "öncelikli" listeler; metinde Dünya yanıt süresi
  (`--delay-min`).
- Sonuçlar: demo verisinde 2/2 olay, 0 yanlış alarm. Seed 11–30 doğrulaması: %100 yakalama, 0.019 yanlış
  alarm/kişi-gün. ~1 saat+ eksik uyku güvenilir yakalanıyor; 25 dk eksik yakalanmıyor (normal değişkenlik).
- Bilinen sınır: CM2'yi ayıran tek güçlü sinyal uyku; nabız/HRV/PVT etkileri küçük (PLACEHOLDER katsayılar).

## Kurallar

- Refaktör sonrası doğrulama: aynı komutlarla üretilen `data/synthetic/*` ve `results/*` dosyaları
  **birebir aynı** kalmalı (davranış değişmiyorsa). Davranış değişiyorsa çıktıları yeniden üret ve
  CHANGELOG'a yaz.
- Eşikleri ayar seed'lerinde belirle, ayrı seed'lerde doğrula.
- Birkaç günlük baseline'da SD tesadüfen çok küçük çıkar (CM1 nabız SD 0.25 → z = 16). Alt sınır şart.
- Bağımlılık eklemeden önce ekibe sor; `requirements.txt` + `docs/SETUP_CHECK.md` § 1.6 güncellenir.

## Açık işler

1. Uygulamaya bağlama: `alerts.csv` → uygulamanın `Status` seviyeleri (ADR-031) ve ekranları.
   Assessment (Mühendis 3) ve visualization (Mühendis 4) ile konuş; `src/core/types` değişirse Mühendis 1 onayı.
2. Sunum: kişiye özel normal tablosu, demo zaman çizelgesi, değerlendirme sayıları, sınırlar.
3. Vakit kalırsa: uyku borcu → PVT/HRV katsayılarını literatürle kalibre et; Fitbit'ten günler arası değişkenlik.
