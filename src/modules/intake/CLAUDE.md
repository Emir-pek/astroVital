# CLAUDE.md — @modules/intake (Veri Toplama)

**Sahip:** Mühendis 2 · **Branch:** `feat/intake` · **Görev listesi:** `docs/modules/intake.md`

## Amaç

Sağlık verisini klavye, tıklama, kamera (rPPG) ve ultrason ile toplamak; doğrulamak (Zod);
kanonik birimde ve doğru `source` etiketiyle store'a yazmak.

## Sahip olunan dosyalar

`src/modules/intake/**` · `en.json`/`tr.json` içinde `intake.*` anahtarları.

## Public API (`index.ts` — tek giriş noktası)

`MeasurementForm`, `MoodPicker`, `CameraHeartRate`, `UltrasoundUpload`, `QuickLogPanel`,
`useAddMeasurement`, `validateValue`. İmza değişikliği = sözleşme değişikliği (`docs/CONTRACTS.md`).

## Bağımlılık

Yalnız `@core/*`. `@modules/assessment|visualization|routine` ve `@app/*` **yasak** (ESLint).

## Kurallar

- Store'a yalnız `useAddMeasurement` ile yaz. Değer **kanonik** birimde (°C, mg/dL) — dönüşüm `@core/utils/units`.
- Sağlıklı/sağlıksız kararı verme (assessment'ın işi); yalnız makullük doğrula.
- Saf mantık `services/` altında (ör. `validation.ts`, P1: `rppg.ts`) ve testli.
- Butonlar eldiven dostu (`Button size="lg"`, ≥56 px); her alan etiketli (a11y).
- Kamera görüntüsü cihazdan çıkmaz; ultrason görüntüsü IndexedDB'de (`attachmentId`).

## Dokunulmaması gerekenler

`src/core/**` (değişiklik için Mühendis 1'e yaz), diğer modüller, `src/app/**`.
