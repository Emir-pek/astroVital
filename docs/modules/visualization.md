# Mühendis 4 — Görselleştirme & Dashboard

**Branch:** `feat/visualization` · **Sahip:** Mühendis 4 (_TBD_)

> **Güncel kaynak (14.11.2026):** tasarım `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md`,
> uygulama planı `docs/superpowers/plans/2026-11-14-astrovital-ui-p1-foundation.md`, test planı
> `docs/superpowers/specs/2026-11-14-astrovital-ui-test-plan.md`. Aşağıdaki P0 maddeleri Plan 1 ile
> karşılandı; Öğren paneli trendi, Ölçüm/Geçmiş/Ekip/Rutin ekranları Plan 2'de.

## Amaç

Sağlık durumunu **net, animasyonlu ve etkileşimli** göstermek: tıklanabilir insan figürü,
zaman serisi grafikleri, canlı vital kartları, mürettebat özeti.

## Sahip olunan klasörler

`src/modules/visualization/**`, içerik olarak `src/core/ui/tokens.css` (merge onayı Mühendis 1),
`en.json`/`tr.json` içinde `visualization.*` anahtarları.

## Public API (`@modules/visualization`)

`<BodyMap crewId onRegionSelect selectedRegion?/>`, `<RegionDetailPanel crewId region/>`,
`<MetricTrendChart crewId metric range/>`, `<VitalsGrid crewId/>`, `<CrewOverview/>`,
`filterByRange`, `TREND_RANGES`, `TrendRange`.

## Bağımlılıklar

`@core/*` + `@modules/assessment` (`useCrewHealth`, `useAllCrewHealth`, `RecommendationList`).

## Görevler

### P0 (Faz 1)

- [ ] **SVG insan figürü** (kendin çiz, telifli asset yok): ön görünüm; bölgeler `brain`, `eyes`,
      `heart`, `lungs`, `blood` (damar ağı/metabolizma), `bones` (iskelet katmanı), `muscles`,
      `immune` (lenf düğümleri), `kidneys`, `whole_body` (dış hale — radyasyon)
- [ ] Hover vurgusu; seçili bölge belirgin; durum renginde **nabız animasyonu**
      (`--av-pulse-green/yellow/red` — kırmızıda daha hızlı), `prefers-reduced-motion` saygısı
- [ ] Tıklayınca `onRegionSelect` → `<RegionDetailPanel/>` (Framer Motion ile kayarak açılır):
      işlev + uzaydaki risk + ilgili metrikler (değer, durum, trend) + öneriler
- [ ] Erişilebilirlik: her bölge `role="button"`, `tabIndex=0`, `aria-label="Kalp: Dikkat"`,
      Enter/Space seçer, ok tuşları bölgeler arası gezer; renk + ikon + metin
- [ ] "Veri yok" bölgeleri (ör. gözler) için nötr görünüm + "ultrason ile takip" ipucu

### P1 (Faz 2)

- [ ] `<MetricTrendChart/>` (Recharts): 24 sa / 7 gün / 30 gün / tüm görev; arka planda
      yeşil/sarı/kırmızı `ReferenceArea` (THRESHOLDS + aktif ortam düzeltmesi — hesaplamayı
      assessment'tan bir yardımcıyla iste, kendin kopyalama); anomali noktaları işaretli;
      kaynak ikonu (kamera/klavye); yeni ölçümde canlı güncelleme
- [ ] `<VitalsGrid/>`: canlı değer kartları, sparkline, birim tercihi (`toDisplay`), değişim animasyonu
- [ ] `<CrewOverview/>`: 4 astronot kartı, genel durum, son ölçüm zamanı, eskalasyon çipi

### P2 (Faz 3)

- [ ] Ortama göre görsel tema (ISS mavi, Ay gri, Mars turuncu arka plan/doku) — `tokens.css`
- [ ] Mikro-animasyonlar (sayfa geçişi, kart girişleri)
- [ ] Responsive + tablet görünümü (yan panel → alt sayfa)
- [ ] **Sunum modu:** büyük font, otomatik bölge/mürettebat geçişi (jüri demosu)

## Kabul kriterleri

- Vücut haritası yalnız klavyeyle tamamen kullanılabilir.
- Renk körlüğü simülasyonunda (deuteranopia) durumlar ikon + metinle ayırt edilir.
- `fever_dehydration` yüklenince crew-2'nin bağışıklık/tüm vücut/kalp bölgeleri renk değiştirir
  (Mühendis 3 motoru hazır olduğunda).
- Grafik 30 günlük ~60 noktada akıcı (60 fps hover).

## Test beklentileri

- `BodyMap`: 10 bölge render, tıklama `onRegionSelect` çağırır, klavye gezinmesi, aria-label'lar.
- `filterByRange` ve eşik alanı hesaplayan saf yardımcılar için birim testleri.
- Recharts için jsdom'da `ResponsiveContainer` yerine sabit boyut (test ortamı uyarılarını önle).

## Entegrasyon noktaları

- **Assessment:** `CrewHealthSummary.regions` ve `assessments` tek veri kaynağı — durumu kendin hesaplama.
- **App:** `/crew/:id` sayfası bileşenleri birleştirir; `CrewOverview` `/crew/:id`'ye link verir.
- **Mühendis 1:** tema token'ları ve `data-env` attribute'u.

## Yapma listesi

- ❌ Eşik/durum hesaplamayı görselleştirmede tekrar yazma (assessment'tan al).
- ❌ Telifli insan figürü / ikon seti; harici CDN görsel.
- ❌ Sadece renkle durum anlatma.
- ❌ `@modules/intake` / `routine` import etme.
