# Mühendis 2 — Veri Toplama (Intake)

**Branch:** `feat/intake` · **Sahip:** Mühendis 2 (_TBD_)

## Amaç

Sağlık verisinin **her yoldan** (klavye, tıklama, kamera, ultrason) güvenle ve hızla girilmesi.
Her giriş doğrulanır, kanonik birimde saklanır ve `source` ile etiketlenir.

## Sahip olunan klasörler

`src/modules/intake/**` (+ `en.json`/`tr.json` içinde `intake.*` anahtarları).

## Public API (`@modules/intake`)

`<MeasurementForm crewId defaultMetric? onSaved?/>`, `<MoodPicker value? onChange/>`,
`<CameraHeartRate crewId?/>`, `<UltrasoundUpload crewId?/>`, `<QuickLogPanel crewId/>`,
`useAddMeasurement()`, `validateValue(metric, value)`.

## Bağımlılıklar

Yalnız `@core/*` (store, config, ui, utils/units, types). Başka modül import edilemez.

## Görevler

### P0 (Faz 1)

- [x] Basit klavye formu + Zod doğrulama (Faz 0 stub)
- [x] `MoodPicker` (1–5, emoji + metin)
- [ ] Birim gösterimi ve dönüşüm: kullanıcı ayarına göre °F / mmol/L girişi → `toCanonical`
- [ ] Tansiyon çifti: sistolik + diastolik tek formda, aynı `groupId`; sistolik > diastolik kontrolü
- [ ] "Makul ama olağandışı" yumuşak uyarı (ör. nabız 45 veya 140: "emin misiniz? yeniden ölçün") — kaydı engellemez
- [ ] Tıklama tabanlı hızlı giriş: uyku saati kaydırıcısı (0.25 sa adım), egzersiz +/- 5 dk,
      büyük dokunmatik butonlar (≥56 px, eldiven), "dünküyle aynı" tek dokunuş
- [ ] Çoklu mürettebat seçimi (CMO tüm ekibin ölçümünü girebilir) — avatar butonları
- [ ] Her girişte doğru `source` (`keyboard` / `click` / `camera` / `ultrasound`)
- [ ] Kaydedilince toast (`useToast`) + routine'in algılaması için doğru `metric`/`timestamp`

### P1 (Faz 2)

- [ ] **Kamera rPPG:** `getUserMedia` → parmak ucu (flaş yoksa yüz) → kare başına yeşil kanal
      ortalaması → ~0.7–3.5 Hz bant geçiren filtre → tepe tespiti → bpm + **güven skoru**
      (sinyal/gürültü, tepe düzenliliği). Güven < eşik → manuel girişe düşüş. `confidence` alanını doldur.
      Kaynak: `verkruysse-2008-rppg`. Saf sinyal işleme `services/rppg.ts`'te, test edilebilir.
- [ ] **Ultrason:** görüntü yükleme, organ etiketi (kalp, mesane, göz/optik sinir kılıfı — SANS),
      canvas üzerinde kaliper (iki nokta, piksel → mm kalibrasyonu), nota bağlama;
      görüntüler IndexedDB'de (`attachmentId`), boyut limiti (ör. 2 MB, yoksa küçült)
- [ ] Kamera izni reddi / desteklenmeyen tarayıcı için açıklayıcı boş durum

### P2 (Faz 3)

- [ ] Cihaz ekranı fotoğrafından OCR (tesseract.js, opsiyonel, lazy-load) → `source: 'camera'`, `confidence`
- [ ] Klavye kısayolları (ör. `H` nabız, `M` ruh hali) / sesli giriş (Web Speech, varsa)
- [ ] "Ölçüm nasıl yapılır" adım adım rehber — `METRICS[id].measurementHowToKey` ve assessment'ın
      içerik anahtarlarını kullan (assessment'tan bileşen import etme; anahtarlar core config'te)

## Kabul kriterleri

- Geçersiz değer **asla** store'a girmez; hata mesajı hangi aralığın beklendiğini söyler.
- Birim tercihinden bağımsız olarak store'daki değer kanonik (°C, mg/dL).
- Tüm girişler klavyeyle yapılabilir; butonlar ≥56 px.
- Kamera akışı başarısız olsa bile kullanıcı 1 tıkla manuel forma geçer.

## Test beklentileri

- `validation.ts`: her metrik için sınır değer testleri (min, max, min−ε, NaN).
- Form: hata yolu, başarı yolu, birim dönüşümü, KB çifti `groupId`.
- `rppg.ts`: sentetik sinüs sinyalinden (ör. 72 bpm + gürültü) ±3 bpm doğrulukla tahmin.

## Entegrasyon noktaları

- Store: yalnız `useAddMeasurement` üzerinden yaz (timestamp/environment varsayılanları orada).
- Routine (Mühendis 1): girilen ölçüm hatırlatmayı "done" yapar → `metric` doğru olmalı.
- Assessment (Mühendis 3): değerlendirme otomatik tetiklenir; intake değerlendirme **yapmaz**.

## Yapma listesi

- ❌ `@modules/assessment` / `visualization` / `routine` import etme (ESLint hatası).
- ❌ Değerin sağlıklı olup olmadığına intake'te karar verme (bu assessment'ın işi) — sadece makullük.
- ❌ Görüntüyü base64 olarak localStorage'a koyma (kota).
- ❌ Kamera görüntüsünü herhangi bir yere gönderme (gizlilik + offline).
