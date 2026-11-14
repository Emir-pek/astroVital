# Base UI geçiş talimatı (Radix → Base UI)

> **Claude Code için talimat.** Ekip kararı (14.11.2026): arayüzün davranış katmanı Radix'ten **Base UI**'a (`@base-ui/react`) taşınacak. Gerekçe: ana senaryo eldivenli tablet. Base UI'ın dokunmatik çalışması daha aktif, kaydırarak kapanan bir Drawer'ı var ve shadcn'in varsayılanı. Bu belgeyi baştan sona oku, önce kısa bir plan çıkar, onay al, sonra uygula.

## 0. Kurallar

- Yeni dalda çalış: `feat/ui-base-ui`. Başlamadan çalışma ağacı temiz olsun.
- **`core/ui` bileşenlerinin dışa açık prop'ları değişmeyecek.** `RedAlertDialog`, `Sheet` ve `Segmented`'i kullanan kod hiç değişmeden çalışmalı. Değişiklik sadece bileşenlerin içinde olacak.
- Mevcut davranış testleri **korunur ve geçmeye devam eder**. Bir test sadece Radix'in iç detayına bağlıysa düzeltilir (örn. "Radix sets pointer-events:none" yorumu). Davranış beklentisi gevşetilmez.
- Bir API'den emin değilsen tahmin etme; `https://base-ui.com/react/components/<bileşen>.md` sayfasını oku. Aşağıdaki API notları 14.11.2026'da resmî dokümandan alındı.
- Kod, yorum ve commit mesajları İngilizce.

## 1. Kurulum

```bash
npm i @base-ui/react
```
- `radix-ui` paketini **en son adımda** kaldır (§5). Geçiş bitene kadar ikisi birlikte durabilir.
- Paket adı `@base-ui/react`. Eski `@base-ui-components/react` adını **kullanma**.

## 2. Bileşen eşlemesi

| `core/ui` bileşeni | Şu an (Radix) | Yeni (Base UI) | Import |
|---|---|---|---|
| `RedAlertDialog` | `AlertDialog` (Root/Portal/Content/Title/Description) | `AlertDialog` (Root/Portal/Backdrop/Viewport/Popup/Title/Description) | `@base-ui/react/alert-dialog` |
| `Sheet` (Öğren paneli) | `Dialog` + CSS animasyonu | **`Drawer`**, `swipeDirection="right"` | `@base-ui/react/drawer` |
| `Segmented` | `ToggleGroup` (tekli, `role=radio`) | **`RadioGroup` + `Radio`** (aşağıdaki nota bak) | `@base-ui/react/radio-group`, `@base-ui/react/radio` |
| İleride: uyku kaydırıcısı | — | `Slider` | `@base-ui/react/slider` |
| İleride: seçiciler | — | `Select` | `@base-ui/react/select` |
| `Toast`, `Modal` | Kendi kodumuz | **Değişmez** | — |

### 2.1 `RedAlertDialog`
Korunacak davranışlar (testleri var): ESC ve dışarı tıklama kapatmaz; her uyarının kendi "Gördüm" butonu var; 3 Hz yanıp sönme, "Durdur" ile durma ve yeni uyarıda yeniden başlama; tüm butonlar `min-h-touch`.

- Açıklık kontrollü: `open={items.length > 0}`.
- Kapatmayı engelleme: `onOpenChange(open, eventDetails)` içinde `eventDetails.reason` değeri `'escape-key'` ya da `'outside-press'` ise `eventDetails.cancel()` çağır. Kapanma sadece `items` boşalınca olur.
- **Bulgu B8'i burada düzelt:** `Popup`'a `initialFocus` ver; ilk uyarının "Ne yapmalıyım?" butonunun ref'i. (Varsayılan davranış ilk tabbable elemana ya da dokunmayla açılınca popup'ın kendisine odaklanmak.)
- Tam ekran stil `Popup` üzerine (`fixed inset-0 ... bg-warning-fill`). `Backdrop` kullanılabilir ama popup zaten ekranı kaplıyor.
- Stil kancaları: `data-open`, `data-closed`, `data-starting-style`, `data-ending-style`.

### 2.2 `Sheet` → `Drawer`
Korunacak: 480 px genişlik (`max-w-full`), sağdan açılma, 104 px kapat butonu, başlık, `onOpenChange(false)` ile kapanma, reduced-motion'da animasyon yok.

```tsx
<Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="right">
  <Drawer.Portal>
    <Drawer.Backdrop className="..." />
    <Drawer.Viewport className="fixed inset-0 flex justify-end">
      <Drawer.Popup className="h-full w-[480px] max-w-full ...">
        <Drawer.Content>
          <Drawer.Title>…</Drawer.Title>
          <Drawer.Close aria-label={closeLabel} className="size-touch …" />
          {children}
        </Drawer.Content>
      </Drawer.Popup>
    </Drawer.Viewport>
  </Drawer.Portal>
</Drawer.Root>
```
- Konumlandırma bizim CSS'imizden gelir; Viewport ve Popup sağ kenara yaslanmalı.
- Kaydırma hareketi: Popup `transform: translateX(var(--drawer-swipe-movement-x))`. `[data-swiping]` iken `transition: none`. Açılış ve kapanış `data-starting-style` / `data-ending-style` ile `translateX(100%)`.
- Backdrop opaklığı `--drawer-swipe-progress` ile bağlansın.
- Panel içinde yatay kaydırılan bir alan olursa (ileride grafik) ona `data-base-ui-swipe-ignore="x"` ver.
- `tokens.css` içindeki `av-sheet-in/out` animasyonları kaldırılıp bu yapıya taşınır; reduced-motion kuralı korunur.

### 2.3 `Segmented` → `RadioGroup`
Mevcut test `role="radio"` bekliyor ve bu kontrol semantik olarak "tek seçim". Base UI'ın `ToggleGroup`'u değerini dizi (`string[]`) olarak tutuyor ve dokümanda `role="radio"` verdiği yazmıyor. Bu yüzden **`RadioGroup` + `Radio` kullan.** Önce `https://base-ui.com/react/components/radio.md` sayfasından API'yi doğrula. Seçili stil `data-checked` ile verilir (`border-4 border-accent font-semibold`).
- Prop'lar aynı kalır: `label`, `value`, `options`, `onChange`. Mevcut "boş değeri yok say" testi geçmeye devam etmeli.

### 2.4 Veri attribute'ları (stil sınıflarında)
| Radix | Base UI |
|---|---|
| `data-[state=open]` | `data-open` |
| `data-[state=closed]` | `data-closed` |
| `data-[state=on]` (toggle) | `data-checked` (radio) |
| Animasyon için `data-state` | `data-starting-style` / `data-ending-style` |

## 3. Yasaklar (tasarım belgesi §9 aynen geçerli)

- Stilli UI kiti yok. Base UI sadece davranış katmanı; görünüm tamamen `tokens.css`.
- `Select`'i bir `Drawer`/`Dialog` içine koymaktan kaçın. Kaçınılmazsa tablette (T-04) mutlaka dene.
- Aynı görünen ve davranan öğeler tek bileşen olarak kalır.

## 4. Testler

Mevcut 148 testin tamamı geçmeli. Eklenecekler:
- **RedAlertDialog:** açılışta odak ilk "Ne yapmalıyım?" butonunda (B8 / F-04). ESC ve dışarı basma `cancel()` ile engelleniyor.
- **Sheet/Drawer:** kapat butonu `onOpenChange(false)` çağırıyor; `Drawer.Root`'ta `swipeDirection="right"` var (snapshot değil, attribute/prop kontrolü). Kaydırma hareketi jsdom'da test edilemez; bu iş E-03 ve tablet testine kalır.
- **Segmented:** `role=radio`, `min-h-touch`, seçili öğe `aria-checked=true`.
- **Bağımlılık koruması:** `src/` içinde `radix` geçen import kalmadığını tarayan bir test (U-12).

## 5. Temizlik

1. `grep -rn "radix" src package.json` sonucu boş olmalı (yorumlar dahil).
2. `npm uninstall radix-ui`
3. `npm run verify` (lint, tip, test, build) temiz geçmeli.

## 6. Belge güncellemeleri

- `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` §9: "Radix" geçen her yeri Base UI olarak güncelle. Tablo: AlertDialog → `AlertDialog`, Öğren paneli → `Drawer` (sağdan, kaydırarak kapanır), kaydırıcı → `Slider`, seçici → `Select`, segmentli seçici → `RadioGroup`. Paket adı `@base-ui/react` olarak yazılsın.
- `docs/DECISIONS.md`: yeni karar kaydı. "Radix → Base UI, 14.11.2026. Gerekçe: eldivenli tablet ana senaryo; dokunmatik iyileştirmeleri ve kaydırarak kapanan Drawer; shadcn varsayılanı. Bedel: 3 bileşen yeniden yazıldı."
- Test planı B3 maddesindeki "Radix Select" uyarısı Base UI'a göre güncellenir (genel kural olarak kalır: Select'i panel içine koyma).

## 7. Bitti tanımı

- [ ] Prop imzaları değişmedi; çağıran kodda değişiklik yok.
- [ ] `npm run verify` temiz; yeni testler eklendi.
- [ ] `radix-ui` kaldırıldı, `src/` içinde Radix izi yok.
- [ ] Tablette kısa doğrulama: kırmızı uyarı açılıyor ve ESC/dışarı dokunuşla kapanmıyor; Öğren paneli sağa kaydırınca kapanıyor; segmentli seçici eldivenle seçiliyor (T-02, T-03, T-04 + kaydırarak kapatma).
