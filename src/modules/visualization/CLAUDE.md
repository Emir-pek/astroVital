# CLAUDE.md — @modules/visualization (Vücut Haritası, Grafikler, Dashboard)

**Sahip:** Mühendis 4 · **Branch:** `feat/visualization` · **Görev listesi:** `docs/modules/visualization.md`

## Amaç

Sağlık durumunu net, animasyonlu, etkileşimli göstermek: tıklanabilir SVG insan figürü,
bölge detay paneli, zaman serisi grafikleri (Recharts), vital kartları, mürettebat özeti.

## Sahip olunan dosyalar

`src/modules/visualization/**` · içerik: `src/core/ui/tokens.css` (merge onayı Mühendis 1) ·
`visualization.*` i18n anahtarları.

## Public API (`index.ts` — tek giriş noktası)

`BodyMap`, `RegionDetailPanel`, `MetricTrendChart`, `VitalsGrid`, `CrewOverview`,
`filterByRange`, `TREND_RANGES`, `TrendRange`.

## Bağımlılık

`@core/*` + `@modules/assessment` (yalnız index'ten: `useCrewHealth`, `useAllCrewHealth`,
`RecommendationList`). `@modules/intake|routine` ve `@app/*` **yasak**.

## Kurallar

- Durumu **kendin hesaplama** — `useCrewHealth().regions/assessments` tek doğruluk kaynağı.
- Figür ve ikonlar kendi çizimin (telifli asset yok, harici CDN yok).
- Erişilebilirlik: klavye gezinmesi, `aria-label`, renk + ikon + metin, `prefers-reduced-motion`.
- Animasyon hızları `--av-pulse-*` token'larından; renkler token sınıflarından.
- Saf yardımcılar `services/` altında ve testli.

## Dokunulmaması gerekenler

`src/core/**` (tokens.css hariç, onaylı), diğer modüller, `src/app/**`.
