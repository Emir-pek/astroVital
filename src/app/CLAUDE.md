# CLAUDE.md — src/app (uygulama kabuğu)

**Sahip:** görünüm visualization ekibinde (ADR-028); provider'lar Mühendis 1. Görev listesi: `docs/modules/core-routine.md`.

## Amaç

Modülleri **birleştirmek**: router (`router.tsx`, hash router), layout (`AppShell`, `Sidebar`,
`TopBar` — MET saati, ortam seçici, "simüle veri" etiketi, Acil, dil, astronot menüsü; `Disclaimer`;
`PortraitNotice`; `AlertLayer` yuvası), provider'lar (i18n, toast,
tema/dil senkronu, ilk açılışta demo verisi) ve sayfalar (`pages/`).

## Kurallar

- Sayfalar iş kuralı içermez; yalnız modüllerin public API'sini (`@modules/<ad>`) yerleştirir.
- Her sayfa `PageHeader` (h1) kullanır; başlık satırının sağında sorun yokken `AlertSummary` durum hattı
  durur. Kabuk bir ekran boyudur (ADR-036): belge kaymaz, `main` kendi içinde kayar; feragat (`Disclaimer`)
  tam genişlikte sabit alt satırda, her sayfada kaydırmadan görünür.
  Uyarı şeridi kabukta kendi satırındadır; Durum sayfasında (`/`) kabuk şeridi göstermez (`AlertLayer strip={false}`),
  sayfa onu sağ sütunda değer rayının üstüne koyar (`AlertPanel`) ki figür ve etiketler uyarıda da kaydırmadan görünsün.
- Sayfa kutuları kitin rolleriyle (ADR-037): bölümler `Card` (Panel), panel içi kutular `Tile`, aralar
  `gap-section`. `PageHeader` iki satırlık ızgara: başlık + durum hattı / alt başlık + eylemler.
- Yeni rota → `router.tsx` + `docs/CONTRACTS.md § Rotalar` + `src/app/__tests__/routes.test.tsx`.
- Rota tablosu (`routes`) export edilir; testler `createMemoryRouter(routes)` ile çalışır.

## Dokunma

Modüllerin iç dosyaları (derin import ESLint hatası verir).
