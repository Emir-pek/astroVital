# CLAUDE.md — src/app (uygulama kabuğu)

**Sahip:** görünüm visualization ekibinde (ADR-028); provider'lar Mühendis 1. Görev listesi: `docs/modules/core-routine.md`.

## Amaç

Modülleri **birleştirmek**: router (`router.tsx`, hash router), layout (`AppShell`, `Sidebar`,
`TopBar` — MET saati, ortam seçici, "simüle veri" etiketi, Acil, dil, astronot menüsü; `Disclaimer`;
`PortraitNotice`; `AlertLayer` yuvası), provider'lar (i18n, toast,
tema/dil senkronu, ilk açılışta demo verisi) ve sayfalar (`pages/`).

## Kurallar

- Sayfalar iş kuralı içermez; yalnız modüllerin public API'sini (`@modules/<ad>`) yerleştirir.
- Her sayfa `PageHeader` (h1) kullanır; feragat (`Disclaimer`) layout'ta, her sayfada görünür.
- Yeni rota → `router.tsx` + `docs/CONTRACTS.md § Rotalar` + `src/app/__tests__/routes.test.tsx`.
- Rota tablosu (`routes`) export edilir; testler `createMemoryRouter(routes)` ile çalışır.

## Dokunma

Modüllerin iç dosyaları (derin import ESLint hatası verir).
