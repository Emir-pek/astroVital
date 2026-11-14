# AstroVital UI — Plan 1: Temel (Öncelik 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tasarım belgesinin §12 "Öncelik 1" kapsamını uygulamak: dört seviyeli durum sözleşmesi, token'lar + fontlar, `src/core/ui` temel bileşenleri, yeni kabuk (5 öğeli menü, üst bar), Durum ekranı (uyarı şeridi, değer kartları), 2D astronot figürü + bölge durumları ve kırmızı tam ekran uyarı.

**Architecture:** `src/core/ui` saf, çeviri almayan sunum bileşenleri (Radix primitifleri + Tailwind token sınıfları). Durumdan görüntüye eşleme ve uyarı kuyruğu `src/modules/visualization/services` altında saf fonksiyonlar; onay/erteleme durumu modül-yerel persist Zustand store'unda. `src/app` yalnız birleştirir: kabuk, rotalar, sayfalar.

**Tech Stack:** React 19, TypeScript 6 (strict), Vite 8, Tailwind 4 (`@theme`), Radix (`radix-ui` paketi), Framer Motion 14, Zustand 5, i18next, Vitest 5 + Testing Library, Lucide.

**Spec:** `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` (bundan sonra "spec"). Önce onu oku.

**Kapsam dışı (Plan 2 / Plan 3):**

- Öğren panelinin mini trendi ve organ illüstrasyonu
- Ölçüm ekranları (Keypad, Slider, ruh hali ölçeği)
- Geçmiş grafikleri (ReferenceArea bantları)
- Ekip uyum skoru, Rutin ekranı
- Ortam arka plan illüstrasyonları, sunum modu
- Legacy token alias'larının silinmesi

Bu planda bu sayfalar mevcut modül bileşenleriyle **geçici** olarak doldurulur.

**Kullanıcı kararı (2026-11-14):** "Repodakiler eski, her şeyi md'ye göre yenile." Bu nedenle `src/core/types`, `src/app`, `src/core/ui` ve diğer modüllerdeki mekanik değişiklikler bu planın kapsamında. Sahiplik ve ADR güncellemesi Task 12'de.

## Global Constraints

- **Durum renkleri:** warning = kırmızı, caution = sarı, advisory = mavi, nominal = nane yeşili. Renk süs için kullanılmaz (spec §3, §5.1).
- **Üçlü ipucu:** her durum **renk + ikon + metin** ile gösterilir; renk tek başına ipucu olamaz.
- **Ters video:** renkli zemin + açık yazı **yalnız** kırmızı tam ekran uyarıda.
- **Dokunma alanı:** her hedef ≥ **104 × 104 px** (`--spacing-touch`), hedefler arası ≥ **16 px** (`--spacing-touch-gap`).
- **Metin boyutları:** gövde 18 px, etiket **en az 16 px**, kart değeri 40 px, sayfa başlığı 28 px, ana durum cümlesi 24 px. Yeni bileşenlerde `text-xs`/`text-sm` yok.
- **Fontlar:** metin Atkinson Hyperlegible Next, sayılar JetBrains Mono + `tabular-nums`; `@fontsource` ile yerel, CDN yok.
- **Büyük harf:** akronim dışı TAMAMI BÜYÜK HARF metin yok (`uppercase` sınıfı yok).
- **Kontrast:** tüm metin/zemin token çiftleri ≥ **6:1**.
- **Yanıp sönme:** yalnız kırmızı uyarı ikonunda, **3 Hz, %50 görev oranı**, durdurulabilir. `prefers-reduced-motion` açıkken yanıp sönme yerine sabit kalın çerçeve.
- **Hareket:** geçiş 250–400 ms `easeOut`; zıplama/yay/sallanma yok; animasyon yalnız `opacity`/`transform`.
- **Renk paleti:** arayüzde turuncu yok (yalnız figür kıyafet detayı `#E8A66B`), mavi/camgöbeği süs yok; tek aksan lavanta `#C3B5FF`.
- **Ton:** sevimli/çocuksu görünüm yok — emoji, yüz ifadesi, büyük kafa oranı, konfeti, parıltı yok.
- **Gizlilik:** Team sayfasında hiçbir tıbbi değer veya tıbbi durum gösterilmez; ekranda yalnız seçili astronotun verisi.
- **Durum kaynağı:** UI durumu kendisi hesaplamaz; `Assessment.status` (Modül 3) + bayatlık bilgisi kullanılır.
- **Dil:** kod, yorum, commit mesajı İngilizce. Tüm UI metinleri i18n anahtarıyla, **hem** `en.json` **hem** `tr.json`. `core/ui` bileşenleri `t()` çağırmaz.
- **Kod kuralları:** `any` yasak; `import type`; modül sınırları ESLint ile zorlanır (`@modules/<ad>` dışında derin import yok).
- **Ağ:** istek yok (offline-first).
- **Task sonu:** `npm run lint && npm run typecheck && npm test` yeşil, sonra commit. Force push yok.

## Review Focus

1. **Aynı anda birden fazla kırmızı:** tek tam ekran pencere, her satırın kendi "Gördüm" butonu var, pencere hepsi onaylanınca kapanır (spec §9.1). Test: Task 6 `RedAlertDialog` ve Task 11 `AlertLayerView`.
2. **Astronot değiştirme:** şerit ve kırmızı pencere yalnız seçili astronotun değerlendirmelerini gösterir; başka birinin değeri asla görünmez. Test: Task 11 `AlertLayerView` (karışık `crewId` listesi).
3. **Verisi olmayan bölge veya kart "normal" görünmez:** mevcut `buildRegions` boş bölgeye `nominal` veriyor; görüntü `none` (kesik kontur) olmalı. Bayat veri asla nane yeşili değildir. Test: Task 7 `regionDisplayStatus` ve `buildVitalCards`.
4. **ESC ve dışarı tıklama kırmızı uyarıyı kapatmaz.** Test: Task 6.
5. **Dikey tutuş ve azaltılmış hareket:** dikeyde "Tableti yatay çevirin"; reduced-motion açıkken yanıp sönme yerine kalın çerçeve, nefes yok. Test: Task 10 (`PortraitNotice`), Task 3 (CSS kuralları); figür nefesi Task 12'de görsel olarak kontrol edilir.

---

## Dosya haritası

| Dosya | Sorumluluk |
|---|---|
| `src/core/types/assessment.ts` | `Status` = 4 seviye |
| `src/core/utils/status.ts` | `STATUS_ORDER`, `worstStatus` (4 seviye) |
| `src/core/utils/contrast.ts` | `contrastRatio`, `parseColorTokens` (saf) |
| `src/core/utils/staleness.ts` | `maxValidityMs`, `isStale` (saf) |
| `src/core/ui/tokens.css` | Tüm ham token'lar + keyframe'ler |
| `src/index.css` | Tailwind `@theme` eşlemesi + legacy alias'lar + `@utility card-surface` |
| `src/core/ui/statusStyle.ts` | `DisplayStatus`, `STATUS_STYLE`, `STATUS_COLOR_VAR` |
| `src/core/ui/{Button,Card,StatusBadge}.tsx` | Yeniden yazım |
| `src/core/ui/arcMath.ts`, `ArcGauge.tsx`, `ValueCard.tsx` | Yay gösterge + değer kartı |
| `src/core/ui/{AlertStrip,RedAlertDialog,Sheet,Segmented}.tsx` | Uyarı ve etkileşim primitifleri |
| `src/modules/visualization/services/vitalCards.ts` | Kart görünüm modeli |
| `src/modules/visualization/services/regionStatus.ts` | Bölge görüntü durumu |
| `src/modules/visualization/services/alertQueue.ts` | Uyarı kuyruğu (saf) |
| `src/modules/visualization/store/useAlertAckStore.ts` | Onay/erteleme (persist) |
| `src/modules/visualization/components/figure/{AstronautFigure.tsx,hitAreas.ts}` | SVG figür + tıklama alanları |
| `src/modules/visualization/components/{BodyMap,RegionChips,VitalsPanel,RegionDetailPanel,RegionSheet,AlertLayer}.tsx` | Ekran bileşenleri |
| `src/app/layout/*`, `src/app/router.tsx`, `src/app/pages/*` | Kabuk ve sayfalar |

---

### Task 1: Baseline ve yeni bağımlılıklar

**Files:**
- Modify: `package.json`, `package-lock.json`, `docs/SETUP_CHECK.md` (§5 tablo)

**Interfaces:**
- Produces: `radix-ui` (`import { AlertDialog, Dialog, ToggleGroup, Select, DropdownMenu } from 'radix-ui'`), `@fontsource/atkinson-hyperlegible-next`, `@fontsource/jetbrains-mono`.

- [ ] **Step 1:** `npm ci`. Beklenen: hatasız kurulum (`node_modules` şu an yok).
- [ ] **Step 2:** `npm run verify`. Beklenen: baseline yeşil. Kırmızıysa dur ve raporla; plan kırmızı baseline üzerine kurulmaz.
- [ ] **Step 3:** `npm install radix-ui@^1.8.1 @fontsource/atkinson-hyperlegible-next@^5.3.0 @fontsource/jetbrains-mono@^5.3.0`
- [ ] **Step 4:** `docs/SETUP_CHECK.md` §5 tablosuna, `<!-- DEPS:END -->` öncesine üç runtime satırı ekle.
  - Aralık `package.json`'daki değerle **birebir** aynı olmalı.
  - Amaçlar: "Erişilebilir UI primitifleri (AlertDialog, Dialog, ToggleGroup, Select, DropdownMenu)", "Metin fontu (yerel, offline)", "Sayı fontu (yerel, offline)".
  - Ekleyen: "UI Plan 1 / 2026-11-14".
- [ ] **Step 5:** `npx vitest run src/test/setup-check.test.ts`. Beklenen: PASS.
- [ ] **Step 6:** Commit: `build(deps): add radix-ui and local fonts for UI redesign`

---

### Task 2: Durum sözleşmesi dört seviyeye

Spec §3 ve §5.1: nominal / advisory / caution / warning. Eşleme: `green→nominal`, `yellow→caution`, `red→warning`. `advisory` yeni; motor şimdilik üretmez.

**Files:**
- Modify:
  - `src/core/types/assessment.ts:11-12`, `src/core/utils/status.ts`, `src/core/config/thresholds.config.ts`
  - `src/core/ui/statusStyle.ts`, `src/core/ui/toastContext.ts`, `src/core/ui/Toast.tsx`
  - `src/core/i18n/{en,tr}.json` (`status.*`)
  - `src/modules/assessment/engine/{assessMeasurement,assessCrew}.ts`, `src/modules/assessment/components/{AlertCenter,LearnPanel}.tsx`
  - `src/modules/visualization/components/CrewOverview.tsx`, `src/app/pages/SettingsPage.tsx`
  - `docs/CONTRACTS.md` (otomatik), `docs/THRESHOLDS.md` (lejant)
- Test: `src/core/utils/__tests__/utils.test.ts`, `src/core/config/__tests__/config.test.ts`, `src/core/i18n/__tests__/keys.test.ts`, `src/modules/assessment/__tests__/engine.stub.test.ts`

**Interfaces:**
- Produces: `type Status = 'nominal' | 'advisory' | 'caution' | 'warning'`
- Produces: `STATUS_ORDER = { nominal: 0, advisory: 1, caution: 2, warning: 3 }`; `worstStatus([])` → `'nominal'`
- Produces: i18n `status.{nominal,advisory,caution,warning}` ve `status.meaning.{...}`

- [ ] **Step 1: Failing test.** `utils.test.ts` içindeki status testini şu hale getir:

```ts
expect(worstStatus([])).toBe('nominal');
expect(worstStatus(['nominal', 'advisory', 'warning', 'caution'])).toBe('warning');
expect(worstStatus(['advisory', 'nominal'])).toBe('advisory');
expect(worstStatus(['caution', 'advisory'])).toBe('caution');
```

`keys.test.ts:65` listesini `['nominal', 'advisory', 'caution', 'warning']` yap.

- [ ] **Step 2:** `npx vitest run src/core/utils src/core/i18n`. Beklenen: FAIL.
- [ ] **Step 3: Tip ve sıra.** `Status` tipini ve `STATUS_ORDER`'ı değiştir. `worstStatus` başlangıç değeri `'nominal'` olsun.
- [ ] **Step 4: Mekanik yeniden adlandırma.** Yalnız Files listesindeki `src` dosyalarında:

```bash
sed -i "s/'green'/'nominal'/g; s/'yellow'/'caution'/g; s/'red'/'warning'/g" <dosyalar>
```

Ardından nesne anahtarlarını elle düzelt (`statusStyle.ts`, `Toast.tsx` `TONE`, `status.ts` içindeki `green:`/`yellow:`/`red:`). `LearnPanel.tsx:12` dizisi `['nominal', 'advisory', 'caution', 'warning']` olsun.

- [ ] **Step 5: i18n.** `en.json` ve `tr.json` içindeki `status` nesnesini yeniden adlandır: green→nominal, yellow→caution, red→warning. Mevcut metinler, `meaning` dahil, korunur.
  - EN etiketleri: "Nominal", "Advisory", "Caution", "Warning".
  - TR etiketleri: "Normal", "Bilgi", "Dikkat", "Uyarı".
  - Yeni `meaning.advisory`: EN "Worth knowing. No action needed right now." / TR "Bilmekte fayda var. Şu an bir şey yapman gerekmiyor."
- [ ] **Step 6: Tarama.** `grep -rnE "'(green|yellow|red)'|\b(green|yellow|red):|status\.(green|yellow|red)" src` → çıktı boş olmalı.
- [ ] **Step 7:** `npm run docs:contracts`; `docs/THRESHOLDS.md` lejantını yeni adlarla güncelle (yeşil=nominal, sarı=caution, kırmızı=warning, mavi=advisory).
- [ ] **Step 8:** `npm run lint && npm run typecheck && npm test`. Beklenen: PASS (`CrewOverview` testi "Nominal" metnini hâlâ bulur).
- [ ] **Step 9:** Commit: `refactor(core)!: four-level status per NASA-STD-3001 App. F`

---

### Task 3: Token'lar, fontlar, kontrast testi

**Files:**
- Create: `src/core/utils/contrast.ts`, `src/core/utils/__tests__/contrast.test.ts`, `src/core/ui/__tests__/tokens.contrast.test.ts`
- Modify:
  - `src/core/utils/index.ts` (export)
  - `src/core/ui/tokens.css` (tamamen yeniden yaz), `src/index.css`, `src/main.tsx`
  - `src/modules/routine/components/MetClock.tsx` (`text-env` → `text-text-2`, `text-sm` → `text-body`)

**Interfaces:**
- Produces: `contrastRatio(a: string, b: string): number` (WCAG 2.x, `#RRGGBB`).
- Produces: `parseColorTokens(css: string): { root: Record<string, string>; env: Record<string, Record<string, string>> }`. Anahtarlar `--av-` öneksiz (`'text-3'`); yalnız hex değerler alınır.
- Produces — Tailwind sınıfları:
  - renk: `bg-bg bg-surface bg-raised text-text text-text-2 text-text-3 text-accent text-nominal text-advisory text-caution text-warning bg-warning-fill text-on-warning-fill border-line`
  - şekil: `rounded-card rounded-button`, `shadow-soft`
  - yazı: `text-body text-label text-value text-title text-headline`
  - dokunma: `min-h-touch min-w-touch size-touch gap-touch-gap`
  - yardımcılar: `card-surface` utility, `.av-blink` / `.av-blink-frame` sınıfları

- [ ] **Step 1: Failing test** `contrast.test.ts`:

```ts
expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
expect(contrastRatio('#F4F6FB', '#0E1530')).toBeCloseTo(16.6, 1);
expect(contrastRatio('#0E1530', '#F4F6FB')).toBeCloseTo(16.6, 1); // symmetric
expect(parseColorTokens(":root{--av-bg:#0E1530;--av-x:1px} [data-env='mars_base']{--av-bg:#14142C}"))
  .toEqual({ root: { bg: '#0E1530' }, env: { mars_base: { bg: '#14142C' } } });
```

- [ ] **Step 2:** `npx vitest run src/core/utils/__tests__/contrast.test.ts`. Beklenen: FAIL.
- [ ] **Step 3:** `src/core/utils/contrast.ts` dosyasını yaz (relative luminance, `(L1+0.05)/(L2+0.05)`); `index.ts`'den export et.
- [ ] **Step 4:** Testi tekrar çalıştır. Beklenen: PASS.
- [ ] **Step 5: tokens.css.** Dosyayı şu değerlerle yeniden yaz. Değerler spec §5.1–5.5'ten; değiştirme.

```css
:root {
  color-scheme: dark;
  --av-bg: #0E1530; --av-surface: #172042; --av-raised: #212C55; --av-line: #2A3561;
  --av-text: #F4F6FB; --av-text-2: #B9C1DC; --av-text-3: #ADB6D6;
  --av-accent: #C3B5FF;
  --av-status-nominal: #7FE0B8; --av-status-advisory: #7DBDFF;
  --av-status-caution: #FFD35C; --av-status-warning: #FF8F99;
  --av-status-warning-fill: #A51D2D; --av-on-warning-fill: #FFFFFF;
  --av-suit-accent: #E8A66B; /* figure suit details ONLY */
  --av-font-sans: 'Atkinson Hyperlegible Next', system-ui, sans-serif;
  --av-font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --av-radius-card: 24px; --av-radius-button: 20px;
  --av-shadow-soft: 0 12px 32px rgba(0, 0, 0, 0.35);
  --av-touch-min: 104px; --av-touch-gap: 16px;
  --av-duration: 300ms; --av-breath: 4.5s;
}
[data-env='iss'], [data-env='spacecraft'] { --av-bg: #0E1530; }
[data-env='lunar_base'], [data-env='rover'] { --av-bg: #11152C; }
[data-env='mars_base'] { --av-bg: #14142C; }
@keyframes av-blink { 0%, 49.99% { opacity: 1; } 50%, 100% { opacity: 0.15; } }
.av-blink { animation: av-blink 333ms steps(1, end) infinite; } /* 3 Hz, 50 % duty */
@media (prefers-reduced-motion: reduce) {
  .av-blink { animation: none; }
  .av-blink-frame { outline: 6px solid currentColor; outline-offset: 4px; }
}
```

Eski `--av-pulse-*`, `--av-env-tint`, `--av-focus`, `--av-accent-strong` silinir.

- [ ] **Step 6: index.css.**
  - `@theme inline` bloğunu Step 5'teki her değişkene bağla. Örnekler: `--color-raised: var(--av-raised)`, `--color-text-2`, `--color-nominal: var(--av-status-nominal)`, `--color-warning-fill`, `--color-on-warning-fill`, `--color-line`, `--radius-card`, `--radius-button`, `--shadow-soft`, `--spacing-touch: var(--av-touch-min)`, `--spacing-touch-gap: var(--av-touch-gap)`, `--text-body: 18px`, `--text-label: 16px`, `--text-value: 40px`, `--text-title: 28px`, `--text-headline: 24px`.
  - Altına legacy alias'ları ekle (Plan 3'te silinecek; `/* LEGACY — do not use in new code */` yorumuyla): `surface-2→raised`, `border→line`, `muted→text-2`, `ok→status-nominal`, `warn→status-caution`, `crit→status-warning`, `accent-strong→accent`, `focus→accent`, `env→text-2`.
  - `@utility card-surface { background: linear-gradient(180deg, color-mix(in srgb, var(--av-surface), white 4%), var(--av-surface)); }`
  - Base: `body { @apply bg-bg font-sans text-body text-text antialiased; }`; radial env gradient'i sil; `:focus-visible { outline: 3px solid var(--av-accent); outline-offset: 3px; }`; `.font-mono { font-variant-numeric: tabular-nums slashed-zero; }`.
- [ ] **Step 7: Fontlar.** `src/main.tsx` başına ekle: `@fontsource/atkinson-hyperlegible-next/400.css`, `/700.css`, `@fontsource/jetbrains-mono/400.css`, `/600.css`.
- [ ] **Step 8: Failing test** `tokens.contrast.test.ts`.
  - `tokens.css`'i `import.meta.glob('/src/core/ui/tokens.css', { query: '?raw', import: 'default', eager: true })` ile oku (`setup-check.test.ts`'deki desen).
  - `parseColorTokens` ile ayrıştır.
  - `it.each` ile şu çiftlerin her biri için `contrastRatio >= 6`:
    - `text` / `bg`, `text` / `surface`, `text` / `raised`
    - `text-2` / `raised`, `text-3` / `raised`, `accent` / `raised`
    - `status-nominal` / `raised`, `status-advisory` / `raised`, `status-caution` / `raised`, `status-warning` / `raised`
    - `on-warning-fill` / `status-warning-fill`
    - `bg` / `accent` (birincil buton yazısı)
    - her `env` bloğundaki `bg` için `text-3` / env-`bg`
- [ ] **Step 9:** `npm test`. Beklenen: PASS (ölçülen en düşük değer 6.20, warning/raised). Bir çift < 6 çıkarsa spec'i değiştirme; dur ve raporla.
- [ ] **Step 10:** `npm run lint && npm run typecheck`, sonra commit: `feat(ui): design tokens, local fonts and contrast guard`

---

### Task 4: `core/ui` temel: durum stili, Button, Card, StatusBadge

**Files:**
- Modify: `src/core/ui/statusStyle.ts`, `Button.tsx`, `Card.tsx`, `StatusBadge.tsx`, `index.ts`
- Test: `src/core/ui/__tests__/basics.test.tsx`

**Interfaces:**
- Produces: `type DisplayStatus = Status | 'stale' | 'none'`.
- Produces: `STATUS_STYLE: Record<DisplayStatus, { icon: LucideIcon; textClass: string }>`:

| Durum | İkon | Sınıf |
|---|---|---|
| nominal | `CircleCheck` | `text-nominal` |
| advisory | `Info` | `text-advisory` |
| caution | `TriangleAlert` | `text-caution` |
| warning | `OctagonAlert` | `text-warning` |
| stale | `Clock` | `text-text-3` |
| none | `CircleDashed` | `text-text-3` |

- Produces: `STATUS_COLOR_VAR: Record<DisplayStatus, string>` (`'var(--av-status-nominal)'`…; stale/none → `'var(--av-text-3)'`), SVG dolguları için.
- Produces: `StatusBadge({ status: DisplayStatus; label: string; size?: 'sm' | 'md'; className? })`; kökte `data-status={status}`.
- Produces: `Button`. Props imzası değişmez; `size` geriye uyumluluk için kalır ve **her iki boyut da** `min-h-touch min-w-touch` olur. Varyantlar:
  - primary: `bg-accent text-bg`
  - secondary: `bg-raised text-text`
  - ghost: `text-text hover:bg-raised`
  - danger: `bg-warning-fill text-on-warning-fill` (yalnız kırmızı uyarı içinde)
- Produces: `Card`. Props değişmez; `card-surface rounded-card shadow-soft p-6`, kenarlık yok, başlık `text-headline font-semibold`.
- `index.ts`: `DisplayStatus` ve `STATUS_COLOR_VAR` export edilir.

- [ ] **Step 1: Failing tests** (`renderWithProviders`):

```tsx
it.each(['nominal', 'advisory', 'caution', 'warning', 'stale', 'none'] as const)(
  'StatusBadge %s carries colour + icon + text', (s) => {
    renderWithProviders(<StatusBadge status={s} label={`L-${s}`} />);
    const el = screen.getByText(`L-${s}`).closest('[data-status]');
    expect(el).toHaveAttribute('data-status', s);
    expect(el?.querySelector('svg')).not.toBeNull();
    expect(el?.className).toMatch(/text-(nominal|advisory|caution|warning|text-3)/);
  });
it.each(['md', 'lg'] as const)('Button %s is glove-sized', (size) => {
  renderWithProviders(<Button size={size}>Go</Button>);
  expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('min-h-touch', 'min-w-touch');
});
```

- [ ] **Step 2:** `npx vitest run src/core/ui`. Beklenen: FAIL.
- [ ] **Step 3:** Interfaces'i uygula. Badge: `sm` → `text-label`, `md` → `text-body`; `rounded-full`, `bg-raised`.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test`. Beklenen: PASS. Mevcut çağıranlar derlenmeli; `STATUS_STYLE[x].className` kullanan yerleri `.textClass`'a çevir.
- [ ] **Step 5:** Commit: `feat(ui): glove-sized Button, soft Card, DisplayStatus badge`

---

### Task 5: `ArcGauge` ve `ValueCard`

Spec §7.1 (değer kartı, ince yay gösterge, sarı/kırmızı eşik bantları), §3 ▲/▼, §7.6 bayat görünüm.

**Files:**
- Create: `src/core/ui/arcMath.ts`, `ArcGauge.tsx`, `ValueCard.tsx`
- Modify: `src/core/ui/index.ts`
- Test: `src/core/ui/__tests__/arcMath.test.ts`, `src/core/ui/__tests__/ValueCard.test.tsx`

**Interfaces:**
- Produces: `valueToAngle(value: number, min: number, max: number): number` — derece; min→180, max→0, sınır dışı değer kırpılır.
- Produces: `arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string` (SVG `d`).
- Produces: `interface GaugeBand { from: number; to: number; status: Exclude<Status, 'nominal'> }`.
- Produces: `ArcGauge({ value, min, max, bands, label }: { value: number; min: number; max: number; bands: GaugeBand[]; label: string })`.
  - `viewBox="0 0 120 68"`, yarım daire, `r=52`; iz `--av-line` 6 px.
  - Bantlar durum renginde %35 opaklık; değer noktası `--av-text` r=5.
  - `role="img" aria-label={label}`.
- Produces: `ValueCard(props: ValueCardProps)`:

```ts
interface ValueCardProps {
  label: string; value: string; unit: string;
  status: DisplayStatus; statusLabel: string;
  direction?: 'up' | 'down' | null; directionLabel?: string;
  measuredText: string;
  gauge?: { value: number; min: number; max: number; bands: GaugeBand[]; label: string };
}
```

ValueCard davranışı:

- Değer `font-mono text-value`.
- Ok `▲`/`▼` yalnız `caution`/`warning`'de, durum renginde, `aria-label={directionLabel}`.
- `stale` iken değer ve gösterge sarmalayıcısı `opacity-50` ve `Clock` ikonu görünür. `measuredText` tam opak `text-text-2` kalır (kontrast korunur).
- Kökte `data-status`.

- [ ] **Step 1: Failing tests:**

```ts
expect(valueToAngle(0, 0, 100)).toBe(180);
expect(valueToAngle(100, 0, 100)).toBe(0);
expect(valueToAngle(50, 0, 100)).toBe(90);
expect(valueToAngle(-5, 0, 100)).toBe(180);
expect(valueToAngle(500, 0, 100)).toBe(0);
```

```tsx
it('shows ▲ only for caution/warning', ...);
// caution + up → '▲' present; nominal + up → '▲' absent
it('stale card is never nominal and tells to re-measure', () => {
  renderWithProviders(<ValueCard label="Heart rate" value="72" unit="bpm" status="stale"
    statusLabel="Stale" measuredText="Last measured 14 h ago · measure again" />);
  const card = screen.getByText('Heart rate').closest('[data-status]');
  expect(card).toHaveAttribute('data-status', 'stale');
  expect(screen.getByText(/measure again/)).toBeVisible();
});
it('renders gauge with accessible label', ...); // getByRole('img', { name: 'Heart rate gauge' })
```

- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Step 3:** Bileşenleri uygula, `index.ts`'e ekle.
- [ ] **Step 4:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(ui): ArcGauge and ValueCard`

---

### Task 6: `AlertStrip`, `RedAlertDialog`, `Sheet`, `Segmented`

**Files:**
- Create: `src/core/ui/{AlertStrip,RedAlertDialog,Sheet,Segmented}.tsx`
- Modify: `src/core/ui/index.ts`
- Test: `src/core/ui/__tests__/alerts.test.tsx`, `src/core/ui/__tests__/Sheet.test.tsx`

**Interfaces:**

```ts
interface AlertStripItem { id: string; status: Exclude<Status, 'nominal'>; title: string; detail?: string }
interface AlertStripProps {
  label: string; items: AlertStripItem[]; emptyText: string;
  whatToDoLabel: string; onWhatToDo: (id: string) => void;
  snoozeLabel: string; onSnooze: (id: string) => void;
  moreLabel: string; // already translated, e.g. "2 more"
}
interface RedAlertItem {
  id: string; title: string; valueText: string; description: string;
  steps: string[]; escalationText: string;
}
interface RedAlertDialogProps {
  items: RedAlertItem[]; heading: string;
  whatToDoLabel: string; acknowledgeLabel: string; stopBlinkingLabel: string;
  onAcknowledge: (id: string) => void;
}
interface SheetProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  title: string; closeLabel: string; children: ReactNode;
}
interface SegmentedProps<T extends string> {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}
```

Davranış kararları:

- **`AlertStrip`:**
  - `<section aria-label={label}>`, zemin `bg-raised`, ters video yok.
  - `items` boşsa tek satır: nominal ikon + `emptyText`.
  - Değilse `items[0]` tam satır: ikon, `title`, `detail`, "Ne yapmalı?" butonu ve (warning değilse) "Ertele" butonu.
  - `items.length > 1` ise `moreLabel` butonu kalan satırları açıp kapatır.
  - Sıra **verildiği gibi** korunur; sıralama `alertQueue`'nun işi.
- **`RedAlertDialog`:**
  - Radix `AlertDialog.Root open={items.length > 0}`. `Content` tam ekran (`fixed inset-0`), `bg-warning-fill text-on-warning-fill`, `onEscapeKeyDown={(e) => e.preventDefault()}`. AlertDialog dışarı tıklamayla zaten kapanmaz.
  - Başlık `heading`.
  - Her satır: `OctagonAlert` ikonu (`av-blink av-blink-frame`, yanıp sönme açıkken), `title`, `valueText` (mono), `description`.
  - Satır butonları: "Ne yapmalıyım?" `steps` + `escalationText` listesini **satır içinde** açar (iç içe modal yok); "Gördüm" → `onAcknowledge(id)`.
  - Üstte tek "Yanıp sönmeyi durdur" butonu yerel `blinking` state'ini `false` yapar.
  - Butonlar `Button variant="secondary"` (kırmızı zemin üzerinde `bg-raised`).
- **`Sheet`:** Radix `Dialog`, sağdan `w-[480px] h-full bg-surface`; `data-[state=open]` ile 300 ms `translate-x` + `opacity` geçişi; kapat butonu `size-touch`.
- **`Segmented`:** Radix `ToggleGroup type="single"`; boş değer (`''`) yok sayılır; her öğe `min-h-touch min-w-touch`.

- [ ] **Step 1: Failing tests:**

```tsx
it('red dialog lists every warning with its own acknowledge button', ...);
// 2 items → getAllByRole('button', { name: 'I saw it' }) has length 2; click first → onAcknowledge('a')
it('ESC does not close the red dialog', ...);
// await user.keyboard('{Escape}'); expect(screen.getByRole('alertdialog')).toBeInTheDocument()
it('"What should I do?" reveals steps inline', ...);
it('stop blinking removes av-blink', ...);
it('closed when items is empty', ...); // queryByRole('alertdialog') === null
it('strip shows emptyText when no items', ...);
it('warning row has no snooze, caution row has snooze', ...);
it('strip keeps given order and expands the rest', ...);
it('every strip / dialog button is glove-sized', ...); // toHaveClass('min-h-touch')
it('Sheet close button calls onOpenChange(false)', ...);
it('Segmented calls onChange with the clicked value', ...);
```

- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Step 3:** Bileşenleri uygula ve export et.
- [ ] **Step 4:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(ui): alert strip, red full-screen alert, sheet, segmented control`

---

### Task 7: Bayatlık, vital kart modeli, bölge görüntü durumu

**Files:**
- Create: `src/core/utils/staleness.ts` (+ `index.ts` export), `src/modules/visualization/services/vitalCards.ts`, `src/modules/visualization/services/regionStatus.ts`
- Test: `src/core/utils/__tests__/staleness.test.ts`, `src/modules/visualization/__tests__/vitalCards.test.ts`, `src/modules/visualization/__tests__/regionStatus.test.ts`

**Interfaces:**

```ts
// core/utils/staleness.ts
export const REPEAT_INTERVAL_MS: Record<ReminderTemplate['repeat'], number>; // twice_daily 12 h, daily 24 h, weekly 7 d
export const VALIDITY_FACTOR = 1.5;
export const UNSCHEDULED_VALIDITY_MS: number; // 48 h
export function maxValidityMs(metric: MetricId, env: EnvironmentProfile): number;
export function isStale(measuredAtIso: string, metric: MetricId, env: EnvironmentProfile, now: Date): boolean;

// visualization/services/vitalCards.ts
export type VitalCardId = MetricId | 'bloodPressure';
export const PRIMARY_CARDS: readonly VitalCardId[]; // ['heartRate','bloodPressure','spo2','bodyTemp','sleepHours','mood']
export interface VitalCardModel {
  id: VitalCardId; metrics: MetricId[]; labelKey: string;
  values: number[]; unit: string; step: number;
  status: DisplayStatus; direction: 'up' | 'down' | null;
  measuredAt: string | null;
  gauge: { value: number; min: number; max: number; bands: GaugeBand[] } | null;
}
export function outOfRangeDirection(metric: MetricId, value: number): 'up' | 'down' | null;
export function gaugeBands(metric: MetricId): GaugeBand[];
export function buildVitalCards(input: {
  latest: Partial<Record<MetricId, Measurement>>; assessments: Assessment[];
  env: EnvironmentProfile; now: Date;
}): VitalCardModel[];

// visualization/services/regionStatus.ts
export function regionDisplayStatus(region: RegionHealth, isMetricStale: (m: MetricId) => boolean): DisplayStatus;
```

Kurallar:

- **`maxValidityMs`:** `env.reminderSchedule` içinde metriğe ait en kısa tekrar aralığı × `VALIDITY_FACTOR`. `diastolicBP`, `SCHEDULE_ALIAS` ile `systolicBP`'nin takvimini kullanır. Takvimde yoksa `UNSCHEDULED_VALIDITY_MS`. `isStale` = `now - t > maxValidityMs`.
- **Kart durumu**, öncelik sırasıyla:
  1. ölçüm yok → `'none'`
  2. bayat → `'stale'` (bayatlık her durumu ezer; spec §7.6: bayat asla nominal gösterilmez)
  3. değerlendirme var → kartın metriklerindeki en kötü `Assessment.status`
  4. değerlendirme yok → `'none'`
- **`bloodPressure` kartı:**
  - `metrics: ['systolicBP','diastolicBP']`, `values: [sys, dia]`, `labelKey: 'visualization.vitals.bloodPressure'`
  - `measuredAt`: systolic'in zamanı
  - `direction`: en kötü durumlu metrikten; `gauge`: systolic'ten
- **Ek kartlar:** `PRIMARY_CARDS` dışındaki metrikler (sys/dia hariç), durumları `nominal`/`none` değilse `METRIC_IDS` sırasıyla sona eklenir. Böylece hiçbir sorun gizlenmez.
- **`outOfRangeDirection`:** `THRESHOLDS[metric].bands` içindeki `nominal` bandına göre `value >= max` → `'up'`, `value < min` → `'down'`, aksi `null`. Ortam modifier'ları yok sayılır; ok yalnız non-nominal durumda gösterildiği için kabul edildi.
- **`gaugeBands`:** nominal olmayan bantlar, `METRICS[metric].min/max` aralığına kırpılmış. `basis: 'cumulativeSum'` (radyasyon) → `gauge: null`.
- **`regionDisplayStatus`:** `assessments` boş → `'none'`; hepsi bayat → `'stale'`; aksi bayat olmayanların `worstStatus`'u.

- [ ] **Step 1: Failing tests** (`ENVIRONMENTS` + `now = new Date('2026-11-14T12:00:00Z')`):

```ts
expect(maxValidityMs('heartRate', ENVIRONMENTS.iss)).toBe(36 * MS_PER_HOUR);
expect(maxValidityMs('spo2', ENVIRONMENTS.rover)).toBe(18 * MS_PER_HOUR);
expect(maxValidityMs('bloodGlucose', ENVIRONMENTS.iss)).toBe(252 * MS_PER_HOUR);
expect(maxValidityMs('respRate', ENVIRONMENTS.iss)).toBe(48 * MS_PER_HOUR);
expect(maxValidityMs('diastolicBP', ENVIRONMENTS.iss)).toBe(maxValidityMs('systolicBP', ENVIRONMENTS.iss));
expect(isStale('2026-11-13T00:00:00Z', 'heartRate', ENVIRONMENTS.iss, now)).toBe(false); // exactly 36 h
expect(isStale('2026-11-12T23:59:00Z', 'heartRate', ENVIRONMENTS.iss, now)).toBe(true);
```

  - `vitalCards.test.ts`:
    - boş girdi → 6 kart, hepsi `status: 'none'`, `values: []`
    - stale + caution değerlendirme → `'stale'`
    - `bloodPressure`: sys caution + dia nominal → `'caution'`, `values [142, 88]`
    - `respRate` caution → 7. kart olarak eklenir; `respRate` nominal → eklenmez
    - `outOfRangeDirection('heartRate', 130)` → `'up'`
    - `gaugeBands('spo2')` her bant `[min, max]` içinde
  - `regionStatus.test.ts`:
    - boş → `'none'`
    - tümü bayat → `'stale'`
    - caution + bayat warning → `'caution'`
- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL. İlk assert, `reminderSchedule`'ın ortak şablonları içerdiğini de doğrular; içermiyorsa dur ve raporla.
- [ ] **Step 3:** Interfaces'i uygula; `DisplayStatus` ve `GaugeBand`'i `@core/ui`'dan `import type` ile al.
- [ ] **Step 4:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(visualization): staleness, vital card model, region display status`

---

### Task 8: Uyarı kuyruğu ve onay/erteleme store'u

Spec §4.3, §7.1, §7.2, §9.1, F.6.4.10.

**Files:**
- Create: `src/modules/visualization/services/alertQueue.ts`, `src/modules/visualization/store/useAlertAckStore.ts`
- Test: `src/modules/visualization/__tests__/alertQueue.test.ts`

**Interfaces:**

```ts
export const SNOOZE_MS = 2 * MS_PER_HOUR;
export interface AlertAckState { acknowledged: Record<string, string>; snoozedUntil: Record<string, string> }
export const alertKey = (a: Assessment): string => `${a.crewId}:${a.metric}:${a.measurementId ?? 'latest'}`;
export function buildAlertQueue(
  assessments: Assessment[], state: AlertAckState, now: Date,
): { blocking: Assessment[]; strip: Assessment[] };

// store — zustand persist, name 'astrovital:alerts', version 1
interface AlertAckStore extends AlertAckState {
  acknowledge: (key: string, now: Date) => void; // acknowledged[key] = now ISO
  snooze: (key: string, now: Date) => void;      // snoozedUntil[key] = now + SNOOZE_MS (ISO)
  reset: () => void;
}
export const useAlertAckStore; // create<AlertAckStore>()(persist(...))
```

Kurallar:

- **`blocking`:** onaylanmamış `warning`'ler.
- **`strip`:** önce onaylı `warning`'ler, sonra ertelenmemiş `caution`'lar, sonra ertelenmemiş `advisory`'ler. Grup içinde girdi sırası korunur; `nominal` hiç girmez.
- **Erteleme:** ertelenmiş = `Date.parse(snoozedUntil[key]) > now`. `buildAlertQueue`, `warning` için ertelemeyi **yok sayar** (kırmızı ertelenemez).
- **Anahtar:** `measurementId` anahtarın parçası; yeni kırmızı ölçüm yeni bir uyarıdır.

- [ ] **Step 1: Failing tests:**
  - sıra: `[advisory, caution, warning(acked), warning]` → `blocking=[warning]`, `strip=[warning(acked), caution, advisory]`
  - erteleme: `snooze` sonrası `now + 1 h` → caution `strip`'te yok; `now + 2 h + 1 ms` → geri gelir
  - bir warning için yazılmış `snoozedUntil` etkisiz → `blocking`'de kalır
  - store: `acknowledge('k', now)` → `acknowledged.k === now.toISOString()`; `reset()` her şeyi boşaltır
- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Step 3:** Uygula. Store, `useHealthStore`'daki `persist` desenini izler.
- [ ] **Step 4:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(visualization): alert queue with acknowledge and 2 h snooze`

---

### Task 9: Astronot figürü, `BodyMap`, `RegionChips`

Spec §8, §5.4, §5.5, §7.1 (bölge çipleri).

**Files:**
- Create: `src/modules/visualization/components/figure/hitAreas.ts`, `components/figure/AstronautFigure.tsx`, `components/RegionChips.tsx`
- Modify (rewrite): `src/modules/visualization/components/BodyMap.tsx`, `src/core/i18n/{en,tr}.json`
- Test: `src/modules/visualization/__tests__/BodyMap.test.tsx`, `src/modules/visualization/__tests__/hitAreas.test.ts`

**Interfaces:**

```ts
export const STAGE = { width: 584, height: 520 } as const;
export const HIT_SIZE = 104;
export const HIT_AREAS: Record<BodyRegionId, { left: number; top: number }>; // px inside STAGE
export interface RegionView { id: BodyRegionId; status: DisplayStatus; label: string; statusLabel: string }
export function AstronautFigure(props: {
  regions: Record<BodyRegionId, DisplayStatus>; selected: BodyRegionId | null;
}): JSX.Element;
export function BodyMapView(props: {
  regions: RegionView[]; selectedRegion: BodyRegionId | null;
  onRegionSelect: (id: BodyRegionId) => void; ariaLabelFor: (r: RegionView) => string;
}): JSX.Element;
export function RegionChips(props: {
  regions: RegionView[]; selectedRegion: BodyRegionId | null; onRegionSelect: (id: BodyRegionId) => void;
}): JSX.Element;
export function BodyMap(props: {
  crewId: string; selectedRegion: BodyRegionId | null; onRegionSelect: (id: BodyRegionId) => void;
}): JSX.Element; // hooks + BodyMapView + RegionChips
```

**`HIT_AREAS` değerleri.** Satır üstleri 0/120/240/360 (aralık 16), tüm kutular 104 × 104:

| Bölge | left | top | Anatomik karşılık |
|---|---|---|---|
| brain | 180 | 0 | kask üstü (sol yarı) |
| eyes | 300 | 0 | vizör (sağ yarı) |
| immune | 60 | 120 | boyun + koltuk altı (sol) |
| lungs | 180 | 120 | göğüs sol-orta |
| heart | 300 | 120 | göğüs (astronotun solu = izleyicinin sağı) |
| muscles | 420 | 120 | üst kol (sağ) |
| blood | 60 | 240 | kol/ön kol damarları (sol) |
| kidneys | 240 | 240 | bel |
| whole_body | 420 | 240 | silüet halesi (sağ) |
| bones | 180 | 360 | uyluk/kaval (sol bacak) |

**Figür çizimi (`AstronautFigure`):**

- **Sahne ve oranlar:**
  - `viewBox="0 0 584 520"`. Figür y 20→500 (480 px), baş yüksekliği 64 px (≈7.5 baş boyu), merkez x=292.
  - Omuz y≈100 (genişlik ≈150), bel y≈260, diz y≈400.
  - Önden, hafif ¾ dönüş: uzak omuz ~8 px daha dar, gövde 4 px kaydırılmış.
- **Skafandr:**
  - Mat beyaz/açık gri, linear gradient `#EEF1F7 → #C9CFDC`; hacimler yumuşak radial gradient ile.
  - Vizör `#1A2140 → #0B1026`, tek yumuşak yansıma; yüz/ifade yok.
  - Tek yumuşak zemin gölgesi (blur'lu elips).
  - Kıyafet detayı (göğüs paneli şeridi, kol bandı) `var(--av-suit-accent)` ile, küçük ve soluk.
- **Işık lekeleri.** Her bölge `<g data-region data-status>`. Tek paylaşılan filtre: `<filter id="av-glow"><feGaussianBlur stdDeviation="10"/></filter>`.

| Bölge | Şekil ve konum |
|---|---|
| brain | (292,38) r22 |
| eyes | elips (292,62) 26×8 |
| heart | (308,160) r18 |
| lungs | elipsler (272,165) ve (314,165), 22×34 |
| blood | kol ve bacaklar boyunca ince yollar, stroke 3, blur 3 |
| bones | uyluk/kaval çizgileri |
| muscles | üst kollar (232,175)/(352,175) + uyluk elipsleri |
| immune | (292,96), (248,140), (336,140) r8 |
| kidneys | (278,250), (306,250) r10 |
| whole_body | silüet konturu, stroke 6, blur 8 |

- **Durum → görünüm:** dolgu `STATUS_COLOR_VAR[status]`.
  - nominal: `motion` ile 4.5 sn nefes (opacity 0.85↔1, scale ≤ 1.02, `repeatType: 'mirror'`, `ease: 'easeInOut'`); `useReducedMotion()` true ise kapalı
  - caution/warning: sabit, nefes yok
  - stale: `--av-text-3`, opacity 0.35, glow filtresi yok
  - none: dolgu yok, `stroke-dasharray="6 6"` kontur
  - seçili bölge: `--av-accent` 3 px kontur

**Diğer bileşenler:**

- **`BodyMapView` overlay:** figürün üstünde `HIT_AREAS`'a göre mutlak konumlu, görünmez `<button className="size-touch absolute">` butonları. Her biri `data-region`, `data-status`, `aria-pressed`, `aria-label={ariaLabelFor(r)}` taşır.
- **`RegionChips`:** sahnenin altında 2 satır × 5 çip, `min-h-touch min-w-touch gap-touch-gap`, ikon + bölge adı.
- **`BodyMap` (container):**
  - `useCrewHealth`, `useLatestByMetric` ve `useActiveEnvironment` ile `regionDisplayStatus(region, m => latest[m] ? isStale(latest[m].timestamp, m, env, now) : true)` hesaplar.
  - Etiket `t(BODY_REGIONS[id].labelKey)`; durum etiketi `t('status.<s>')`.
  - Yeni anahtarlar: `visualization.status.stale` "Stale data" / "Eski veri", `visualization.status.none` "No data" / "Veri yok".

- [ ] **Step 1: Failing tests:**
  - `hitAreas.test.ts`: her kutu `STAGE` içinde; her çift için yatay **veya** dikey boşluk ≥ 16 (testte `gapBetween(a, b)` yardımcısı).
  - `BodyMap.test.tsx` (`BodyMapView`, sahte `RegionView[]`):
    - 10 bölge butonu; her biri `size-touch`, `data-region`, `data-status`
    - `aria-label` "Heart: Nominal"
    - tıklama → `onRegionSelect('heart')`; seçili bölge → `aria-pressed="true"`
    - `none` bölgenin figür grubu `data-status="none"` ve `stroke-dasharray` taşır
    - `RegionChips`: 10 buton, tıklama `onRegionSelect` çağırır
- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Step 3:** Uygula; eski stub'ı sil, yeni `BodyMap` imzasını export et.
- [ ] **Step 4:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Step 5:** `npm run dev`, figürü 1180 × 820'de aç, ekran görüntüsü al ve spec §8'e karşı kendin kontrol et: yetişkin oranı, yüz yok, sevimli değil, turuncu yalnız küçük detay.
- [ ] **Step 6:** Commit: `feat(visualization): 2D astronaut figure with region glows and chips`

---

### Task 10: Kabuk — menü, üst bar, rotalar, sayfalar

Spec §6, §9.1 (dikey tutuş, astronot seçici, Acil).

**Files:**
- Modify (rewrite): `src/app/layout/{AppShell,Sidebar,TopBar,Disclaimer}.tsx`, `src/app/router.tsx`, `src/app/pages/PageHeader.tsx`, `src/app/__tests__/routes.test.tsx`, `src/modules/visualization/components/CrewOverview.tsx` (+ testi)
- Create: `src/app/layout/{EnvironmentPicker,CrewPicker,LanguageToggle,PortraitNotice}.tsx`, `src/app/pages/{StatusPage,MeasurePage,HistoryPage,TeamPage,RoutinePage,EmergencyPage}.tsx`
- Delete: `src/app/pages/{DashboardPage,CrewMemberPage,AlertsPage,LearnPage,MissionPage,LogMeasurementPage}.tsx`
- Modify: `src/core/i18n/{en,tr}.json`

**Interfaces — rotalar:**

| Yol | Sayfa | h1 EN | h1 TR |
|---|---|---|---|
| `/` | StatusPage | Status | Durum |
| `/measure` | MeasurePage | Measure | Ölçüm |
| `/history` | HistoryPage | History | Geçmiş |
| `/team` | TeamPage | Team | Ekip |
| `/routine` | RoutinePage | Routine | Rutin |
| `/emergency` | EmergencyPage | Emergency procedure | Acil durum prosedürü |
| `/settings` | SettingsPage (menüde yok) | Settings | Ayarlar |
| `*` | NotFoundPage | Page not found | (mevcut) |

**Sidebar:**

- Genişlik `w-[132px]`; üstte `app.name`.
- 5 `NavLink`, sıra ve ikonlar: Status (`Activity`), Measure (`ClipboardPlus`), History (`ChartLine`), Team (`Users`), Routine (`CalendarCheck`).
- Her biri `min-h-touch flex-col gap-1 rounded-button text-label`; aralık `gap-touch-gap`; aktif öğe `bg-raised text-accent`.

**TopBar** (`sticky top-0 backdrop-blur bg-bg/80`), soldan sağa:

1. `MetClock`
2. `EnvironmentPicker`: Radix `Select`; tetikleyici `topbar.environmentValue` = "Environment: {{env}}"; 5 öğe, her biri `min-h-touch`
3. Simüle veri etiketi: `FlaskConical` + `topbar.simulated`; etkileşimsiz
4. Acil butonu: `Button variant="secondary"`, `OctagonAlert` `text-warning` + `topbar.emergency` → `navigate('/emergency')`. Kırmızı dolgu değil, çünkü kırmızı süs değildir.
5. `LanguageToggle`: `Segmented` EN/TR → `updateSettings({ language })`
6. `CrewPicker`: Radix `DropdownMenu`. Tetikleyicide seçili astronotun adı; `RadioGroup` ile 4 kişi → `setSelectedCrew`; ayırıcı; "Demo settings" öğesi → `/settings`.

**Düzen ve küçük bileşenler:**

- **AppShell:** `Sidebar` | (`TopBar`, `main` içinde `Outlet`, alt satırda `Disclaimer`). AlertLayer yuvası Task 11'de eklenir.
  - Sayfa geçişi `motion.div key={pathname}`: `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, 300 ms `easeOut`; reduced-motion'da `initial={false}`.
- **Disclaimer:** `role="note"`, `text-label text-text-3`, `ShieldAlert` ikonu `text-text-3`. Sarı değil, çünkü sarı yalnız caution içindir.
- **PortraitNotice:** `fixed inset-0 z-[100] hidden portrait:flex bg-bg`; `RotateCw` ikonu + `app.rotateDevice` = "Turn the tablet to landscape" / "Tableti yatay çevirin".
- **PageHeader:** h1 `text-title font-semibold`; alt başlık `text-body text-text-2`.

**Sayfa içerikleri:**

- **Geçici içerikler** (Plan 2'de yeniden yapılacak):

| Sayfa | İçerik |
|---|---|
| Measure | `QuickLogPanel` + `MeasurementForm` (selectedCrewId) |
| History | `Segmented` (`TREND_RANGES`) + `MetricTrendChart` heartRate |
| Team | `CrewOverview` |
| Routine | `ReminderCenter scope="today"` + `MissionBoard` |
| Status | yalnız `PageHeader` (Task 11'de dolar) |

- **EmergencyPage:**
  - Sıralı 4 adım: `self_care → crew_medical_officer → flight_surgeon → emergency`. Her adım `escalation.<e>` başlığı + `pages.emergency.steps.<e>` açıklaması (EN/TR yaz).
  - `env.medicalCapability === 'autonomous'` ise üstte `pages.emergency.autonomous` notu: "Earth help is hours away — the crew leads care." / "Dünya'dan yardım saatler uzakta — bakımı ekip yürütür."
- **CrewOverview (gizlilik, spec §7.7):**
  - `StatusBadge` ve `/crew/:id` linkleri kaldırılır. Yalnız avatar baş harfleri, isim ve rol listelenir; uyum yüzdesi ve check-in Plan 2'de.
  - Testi güncelle: link yok, "Nominal" metni yok.

**i18n:**

- Eklenecek anahtarlar: `nav.{status,measure,history,team,routine}`, `topbar.{simulated,emergency,environmentValue,crewPicker,demoSettings}`, `app.rotateDevice`, `pages.{status,measure,history,team,routine,emergency}.{title,subtitle}`, `pages.emergency.steps.*`, `pages.emergency.autonomous`.
- Silinen sayfaların `pages.*` ve `nav.*` anahtarlarını kaldır.

- [ ] **Step 1: Failing test** `routes.test.tsx`: tabloyu yukarıdaki 8 rota ve h1'lerle değiştir; disclaimer kontrolü kalır. Eklenecek testler:
  - `it('sidebar has exactly 5 glove-sized items')`: `within(nav).getAllByRole('link')` sayısı 5, her biri `min-h-touch`
  - `it('emergency button opens the procedure')`: butona tıkla → h1 "Emergency procedure"
  - `it('crew picker switches the signed-in astronaut')`: menüden "Kenji Arata" seç → `useHealthStore.getState().selectedCrewId === 'crew-2'`
  - `it('portrait notice exists with rotate text')`: `getByText('Turn the tablet to landscape')`
  - TR testi: h1 "Durum"
- [ ] **Step 2:** `npx vitest run src/app`. Beklenen: FAIL.
- [ ] **Step 3:** Uygula. Radix menüleri jsdom'da pointer olayları ister: testlerde `userEvent` kullan; gerekirse `src/test/setup.ts`'e `hasPointerCapture` / `releasePointerCapture` / `scrollIntoView` polyfill ekle.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test`. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(app): glove-friendly shell with 5-item nav, top bar and emergency procedure`

---

### Task 11: Durum ekranı, bölge paneli, uyarı katmanı

Spec §7.1, §7.2, §7.3 (sıra), §7.6.

**Files:**
- Create: `src/modules/visualization/components/{VitalsPanel,RegionSheet,AlertLayer}.tsx`
- Modify (rewrite): `src/modules/visualization/components/RegionDetailPanel.tsx`, `src/modules/visualization/index.ts`, `src/app/pages/StatusPage.tsx`, `src/app/layout/AppShell.tsx`
- Delete: `src/modules/visualization/components/VitalsGrid.tsx`
- Modify: `src/core/i18n/{en,tr}.json` (`visualization.*`)
- Test: `src/modules/visualization/__tests__/{VitalsPanel,RegionDetailPanel,AlertLayer}.test.tsx`

**Interfaces:**

```ts
export function VitalsPanel(props: { crewId: string }): JSX.Element; // buildVitalCards → ValueCard list
export function RegionDetailPanel(props: { crewId: string; region: BodyRegionId }): JSX.Element;
export function RegionSheet(props: { crewId: string; region: BodyRegionId | null; onClose: () => void }): JSX.Element;
export function AlertLayerView(props: {
  crewId: string; assessments: Assessment[]; lastMeasuredAt: string | null; now: Date;
}): JSX.Element;
export function AlertLayer(props: { crewId: string }): JSX.Element; // useCrewHealth + AlertLayerView
```

`index.ts` public API: `BodyMap`, `RegionSheet`, `RegionDetailPanel`, `VitalsPanel`, `AlertLayer`, `CrewOverview`, `MetricTrendChart`, `filterByRange`, `TREND_RANGES`, `TrendRange`. `VitalsGrid` kaldırılır.

**`VitalsPanel`:** tek sütun `ValueCard` listesi, `gap-touch-gap`. Her kart için:

| Prop | Değer |
|---|---|
| `value` | `values.map(v => formatNumber(v, step, lang)).join('/')`; boşsa "—" |
| `statusLabel` | `status.<s>` veya `visualization.status.<stale\|none>` |
| `directionLabel` | `visualization.vitals.above` "above normal" / "normalin üstünde"; `visualization.vitals.below` "below normal" / "normalin altında" |
| `measuredText` | stale → `visualization.vitals.staleText` "Last measured {{when}} · measure again" / "Son ölçüm {{when}} · yeniden ölç"; normal → `common.lastMeasured`; veri yok → `common.noData` |
| `gauge.label` | `visualization.vitals.gauge` "{{metric}} gauge" / "{{metric}} göstergesi" |

**`RegionDetailPanel`:** bölümler **bu sırada**, her biri h3 başlıkla:

1. `whatToDo` "What should I do?": bölgedeki tüm `recommendations` → `RecommendationList`; yoksa `nothingToDo` "Nothing to do right now. Keep your routine."
2. `currentValues` "Current values": metrik etiketi + mono değer + `StatusBadge` (mini trend Plan 2'de).
3. `whyItMatters` "Why it matters": her `assessment.explanationKey`; açıklama yoksa bölüm gizli.
4. `function` + `spaceRisk` (mevcut anahtarlar).
5. `sourceAndAge` "Source and data age": `sourceIds.join(', ')` + en yeni ölçümün `formatRelative`'i.

**`RegionSheet`:** `Sheet`; başlık bölge adı, `closeLabel` `common.close`.

**`AlertLayerView`:**

- **Kuyruk:** `assessments.filter(a => a.crewId === crewId)` (gizlilik, Review Focus 2) → `buildAlertQueue(…, useAlertAckStore state, now)`.
- **`blocking` → `RedAlertDialog` item'ları:**
  - `title`: metrik etiketi; `valueText`: değer + birim
  - `description`: `t(summaryKey, { metric, ...messageParams })`
  - `steps`: `recommendations.flatMap(r => r.stepsKeys).map(t)`; `escalationText`: `t('escalation.<e>')`
  - `onAcknowledge` → `acknowledge(key, now)`
- **`strip` → `AlertStrip`:**
  - `onSnooze` → `snooze(key, now)`
  - `onWhatToDo` → yerel state ile `Sheet` açılır: o değerlendirmenin `RecommendationList`'i + eskalasyon + özet
  - `emptyText`: `lastMeasuredAt` varsa `visualization.alerts.allNominal` "All indicators nominal · last measurement {{when}}" / "Tüm göstergeler normal · son ölçüm {{when}}"; yoksa `visualization.alerts.noData`
- **Metinler** (`visualization.alerts.*`):

| Anahtar | EN | TR |
|---|---|---|
| `redHeading` | Warning — act now | Uyarı — hemen harekete geç |
| `whatToDo` | What should I do? | Ne yapmalıyım? |
| `acknowledge` | I saw it | Gördüm |
| `stopBlinking` | Stop blinking | Yanıp sönmeyi durdur |
| `snooze` | Snooze 2 h | 2 sa ertele |
| `more` | {{count}} more | {{count}} uyarı daha |

**Sayfa ve kabuk:**

- **`StatusPage`:** `grid grid-cols-[584px_1fr] gap-6`; sol `Card` içinde `BodyMap`, sağda `VitalsPanel`. Yerel `selectedRegion` state → `RegionSheet`. Sayfa dikey kayabilir.
- **`AppShell`:** `TopBar` altına `selectedCrewId && <AlertLayer crewId={selectedCrewId} />`.

- [ ] **Step 1: Failing tests:**
  - `AlertLayer.test.tsx` (`AlertLayerView` + sahte `Assessment` fabrikası; her testten önce `useAlertAckStore.getState().reset()`):
    - iki warning → iki "I saw it"; ikisine de tıkla → `alertdialog` kaybolur; şeritte onaylı warning ilk satırda, "1 more" butonu var
    - `crewId='crew-1'` iken `crew-2`'nin warning'i **görünmez**
    - caution + advisory → şeritte caution ilk; "Snooze 2 h" → caution kaybolur, advisory kalır
    - boş liste → "All indicators nominal"
  - `RegionDetailPanel.test.tsx`: açıklama yokken h3 sırası `['What should I do?', 'Current values', 'What it does', 'How space affects it', 'Source and data age']` ("Why it matters" yok)
  - `VitalsPanel.test.tsx`:
    - demo verisiyle (`loadDemoData({ seed: 1, days: 30, now })`) 6 kart; "Heart rate" kartında mono değer var
    - boş store'da kartlar "No data"
- [ ] **Step 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Step 3:** Uygula. `routes.test.tsx`'teki `/` testi değişmeden geçmeli.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test`. Beklenen: PASS.
- [ ] **Step 5:** Commit: `feat(visualization): status screen with alert layer, vitals and region sheet`

---

### Task 12: Belgeler, sahiplik, doğrulama, görsel kontrol

**Files:**
- Modify: `docs/CONTRACTS.md` (§ Rotalar, § `@modules/visualization`), `docs/DECISIONS.md` (ADR-027, ADR-028), `CLAUDE.md` (kök), `src/modules/visualization/CLAUDE.md`, `src/app/CLAUDE.md`, `src/core/CLAUDE.md` (ui bölümü varsa), `docs/modules/visualization.md`

İçerik kararları:

- **ADR-027:** `Status` dört seviye (NASA-STD-3001 Ek F, F.6.4.1–3); `green/yellow/red` eşlemesi; `advisory` henüz motor tarafından üretilmiyor (Mühendis 3'e görev).
- **ADR-028:**
  - Arayüzün tamamı visualization ekibinde: `src/core/ui`, `src/app`, intake ve routine ekranlarının **görünümü** (spec §4.4, kullanıcı kararı 2026-11-14).
  - Radix (`radix-ui`) + `@fontsource` seçimi; dokunma alanı 104 px.
  - Legacy token alias'ları geçici (Plan 3'te silinecek).
- **Kök `CLAUDE.md`:**
  - `text-ok/warn/crit` → `text-nominal/advisory/caution/warning`.
  - "Butonlar eldiven dostu (size="lg")" → "Tüm dokunma hedefleri ≥104 px (`min-h-touch`); `Button` bunu otomatik sağlar".
  - Git bölümünde `feat/visualization` sahipliği.
- **`CONTRACTS.md`:** rota tablosu = Task 10'daki tablo; visualization API = Task 11'deki liste.
- **`docs/modules/visualization.md`:** başa spec ve plan bağlantısı; eski P0 maddeleri "Plan 1 ile karşılandı" olarak işaretlenir.

- [ ] **Step 1:** Belgeleri güncelle.
- [ ] **Step 2:** `npm run verify`. Beklenen: lint, typecheck, test ve build yeşil.
- [ ] **Step 3:** `npm run dev`; Chrome'da 1180 × 820 pencerede `/`, `/emergency` ve dikey (820 × 1180) görünümün ekran görüntüsünü al.
- [ ] **Step 4:** Spec §5–§8 kontrol listesi:
  - renkler yalnız durum için
  - yazılar ≥ 16 px, butonlar ≥ 104 px
  - büyük harf başlık yok
  - figür sevimli değil
  - nefes yavaş ve hafif; DevTools → Rendering → reduced-motion emülasyonunda nefes yok

  Sapmaları düzelt, gerekirse küçük commit at.
- [ ] **Step 5: Kırmızı uyarının görsel kontrolü.** Motor stub olduğu için uygulamada kırmızı oluşmaz.
  - Yerelde `assessMeasurement`'ı geçici olarak `heartRate >= 130 → warning` döndürecek şekilde değiştir.
  - `/measure`'dan 130 bpm gir, tam ekran uyarının ve şeridin ekran görüntüsünü al.
  - Değişikliği **geri al** (`git checkout -- src/modules/assessment/engine/assessMeasurement.ts`) ve commit'leme.
- [ ] **Step 6:** Commit: `docs: UI ownership, four-level status and new routes (ADR-027, ADR-028)`

---

## Sonraki planlar (bu planın parçası değil)

- **Plan 2 (Öncelik 2):**
  - Öğren paneli: mini trend, organ illüstrasyonu
  - Ölçüm ekranları: `Keypad`, `Slider`, emojisiz ruh hali ölçeği, deneysel kamera/ultrason kabuğu
  - Geçmiş: Recharts, `ReferenceArea` / `ReferenceLine`
  - Ekip: uyum %, son check-in, ekip skoru
  - Rutin: görevler, seri, insignia rozetleri
- **Plan 3 (Öncelik 3):** ortam arka plan illüstrasyonları, bayat veri cilası, şematik organlar, sunum modu, legacy token alias'larının ve eski `core/ui` stillerinin temizlenmesi.
