# CLAUDE.md — @modules/visualization (Vücut Haritası, Grafikler, Dashboard)

**Sahip:** Mühendis 4 · **Branch:** `feat/visualization` · **Görev listesi:** `docs/modules/visualization.md`

## Amaç

Sağlık durumunu net, animasyonlu, etkileşimli göstermek: tıklanabilir SVG insan figürü,
bölge detay paneli, zaman serisi grafikleri (Recharts), vital kartları, mürettebat özeti.

## Sahip olunan dosyalar

`src/modules/visualization/**` · içerik: `src/core/ui/tokens.css` (merge onayı Mühendis 1) ·
`visualization.*` i18n anahtarları.

## Public API (`index.ts` — tek giriş noktası)

`BodyMap`, `RegionSheet`, `RegionDetailPanel`, `VitalsPanel`, `AlertLayer`, `AlertPanel`, `AlertSummary`, `MetricTrendChart`,
`CrewOverview`, `filterByRange`, `TREND_RANGES`, `TrendRange`.

## Bağımlılık

`@core/*` + `@modules/assessment` (yalnız index'ten: `useCrewHealth`, `useAllCrewHealth`,
`RecommendationList`). `@modules/intake|routine` ve `@app/*` **yasak**.

## Kurallar

- Durumu **kendin hesaplama** — `useCrewHealth().regions/assessments` tek doğruluk kaynağı.
- Figür ve ikonlar kendi çizimin (telifli asset yok, harici CDN yok).
- Erişilebilirlik: klavye gezinmesi, `aria-label`, renk + ikon + metin, `prefers-reduced-motion`.
- Hareket (ADR-036): nefes **yalnız tüm vücut halesinde** (nominalken 4,5 sn); iç bölgeler nefes almaz,
  nominal/eski/veri yok iç bölge figürde hiçbir şey çizmez; advisory/caution/warning sabit, siluete
  kırpılmış işaret. Yanıp sönme yalnız kırmızı uyarı ikonunda. Renkler token'lardan (`STATUS_COLOR_VAR`, `--av-suit-*`).
- Bölge seçimi figürün yanındaki görünür etiketlerle (`RegionLabel`); görünmez tıklama alanı yok.
  Yerleşim saf fonksiyon `computeBodyMapLayout` (`components/figure/layout.ts`), testli. Figür çizimi (SuitArt,
  `geometry.ts`) değişirse `REGION_ANCHORS`, `REGION_SHAPES`, `FIGURE_VIEWBOX` birlikte güncellenir; `figureGeometry.test.ts`
  ve `bodyMapLayout.test.ts` yeşil kalmalı. Damar (kan) işareti dolgulu şerittir, çizgi değil (kılavuz çizgileriyle karışmasın).
- Kutular üç rolden biri (ADR-037): üst düzey kap `Card`/`BOX.panel`, panel içi kutu veya liste öğesi `Tile`,
  rozet `rounded-pill`. Stok `rounded-*`/`text-sm`/`shadow-*` yok (`boxSystem.test.ts`). Bölge paneli Durum'da
  sağ sütunun kutusuna oturur (`RegionSheet` `bounds`), modal değildir; üst bar asla örtülmez.
- Eski veri asla "normal" görünmez (`isStale`, `regionDisplayStatus`, `buildVitalCards`).
- Ekip görünümünde tıbbi değer/durum yok; ekranda yalnız seçili astronotun verisi (`AlertLayer`).
- Tasarım: `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` · ADR-027/028/029.
- Saf yardımcılar `services/` altında ve testli.

## Dokunulmaması gerekenler

`src/core/**` (tokens.css hariç, onaylı), diğer modüller, `src/app/**`.
