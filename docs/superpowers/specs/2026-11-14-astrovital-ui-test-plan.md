# AstroVital — UI Test Planı ve İnceleme Bulguları

> **Claude Code için:** Bu belge, `docs/superpowers/specs/2026-11-14-astrovital-ui-design.md` tasarımının test edilme şeklidir. §2'deki bulgular düzeltilecek işlerdir; §3–§6 yazılacak/çalıştırılacak testlerdir. Test ID'lerini (U-, F-, I-, E-, T-) commit mesajlarında ve test adlarında kullan.
>
> İnceleme tarihi: 14.11.2026, commit `a7e3869` itibarıyla. İnceleme salt-okunurdu; repoda hiçbir dosya değiştirilmedi.

---

## 1. Mevcut durum (ölçüldü)

| Kontrol | Sonuç |
|---|---|
| `vitest run` | **22 dosya, 148 test — hepsi geçti** |
| `tsc -b --noEmit` | Hatasız |
| `eslint . --max-warnings=0` | Hatasız |
| Token kontrastı | Tüm tanımlı çiftler ≥ 6:1 (test ile korunuyor) |

Not: Testler Windows'ta kurulmuş `node_modules` ile Linux'ta çalışmadığı için repo, `node_modules` hariç ayrı bir klasöre kopyalanıp `npm ci` ile temiz kurulumda çalıştırıldı. Bu, `package-lock.json`'un temiz kurulumda da çalıştığını gösterir.

## 2. İnceleme bulguları (düzeltilecekler)

Önem sırasına göre. **Y** = demo/standart riski, **O** = orta, **D** = düşük.

| # | Önem | Nerede | Bulgu | Önerilen düzeltme |
|---|---|---|---|---|
| B1 | Y | `modules/intake/components/MoodPicker.tsx` | Emoji yüzler kullanılıyor (😫…😄). Tasarım §7.4 ve §2 anti-hedef: **emoji yok**. | 5 adımlı, etiketli, sade çizgi ikonlu ölçek (Lucide); her buton ≥ 104 px. |
| B2 | Y | `docs/DEMO_SCRIPT.md` 0:20–0:50 | "Ruh halini büyük emoji butonlarıyla" diyor; tasarımla çelişiyor. | Senaryoyu yeni ruh hali ölçeğine göre güncelle. |
| B3 | Y | `CrewMemberPage.tsx` (3 yer), `MeasurementForm.tsx` | Yerel `<select>` / girişler `min-h-10` (40 px). 104 px kuralını ihlal ediyor. | Plan 2'de yeniden yapılırken `core/ui` bileşenleriyle (Segmented / büyük tuş takımı) değiştir. Base UI `Select` kullanılacaksa onu `Drawer`/`Dialog` içine koymaktan kaçın (iç içe açılır pencereler dokunmatikte en riskli kombinasyon); kaçınılmazsa tablette T-04 ile dene. |
| B4 | O | `ArcGauge.tsx` + `arcMath.valueToAngle` | Aralık dışı değer sessizce uca kırpılıyor. NASA-STD-3001 F.4.3.1.5: "skala dışı" belirtilmeli. | Kırpıldığında uçta ◀/▶ işareti + `aria-label`'a "skala dışı" ekle. Test: U-07. |
| B5 | O | `Button.tsx` | `disabled:opacity-50` metin kontrastını 6:1'in altına düşürür. | Devre dışı butondan kaçın; gerekirse ayrı token (`text-3` + kesik çerçeve) kullan, opaklık kullanma. |
| B6 | O | `AlertStrip.tsx` | Yeni uyarı ekran okuyucuya duyurulmuyor (`aria-live` yok). | Sarı/mavi için `aria-live="polite"` bölge. Kırmızı zaten `alertdialog`. |
| B7 | O | `index.css` | "LEGACY" renk takma adları (`--color-ok/warn/crit/muted/surface-2/border`) hâlâ 25 dosyada kullanılıyor. | Plan 3'te kaldırılacağı yazıyor; kaldırılınca U-09 testi eklensin (eski sınıf kalmadığını tarar). |
| B8 | D | `RedAlertDialog.tsx` | Açılışta odak ilk butona, "Yanıp sönmeyi durdur"a gidiyor. | Odağı ilk uyarının "Ne yapmalıyım?" butonuna ver (`onOpenAutoFocus`). |
| B9 | D | Testler genel | Boyut testleri sadece `min-h-touch` **sınıfını** kontrol ediyor; jsdom gerçek pikseli ölçemez. | Gerçek ölçüm E-02 (tarayıcı testi) ile yapılsın. |

## 3. Birim testleri (Vitest) — tek bileşen/fonksiyon, izole

Var olanlar korunur. Eklenecekler:

| ID | Konu | Test | Geçme ölçütü |
|---|---|---|---|
| U-01 | `alertQueue` (sıralama) | kırmızı > sarı > mavi; aynı seviyede en yeni önce; ertelenmiş olanlar listede yok | Sıra birebir |
| U-02 | Erteleme süresi | sarı/mavi 2 saat ertelenir, 2 sa + 1 ms'de geri gelir; kırmızı ertelenemez | Sahte saat (`vi.useFakeTimers`) ile |
| U-03 | Eski veri | geçerlilik süresi aşılan ölçüm `stale` döner; asla `nominal` dönmez | Her metrik ve her ortam için |
| U-04 | `StatusBadge` | 6 durumun her biri farklı ikon + metin taşır | İkon bileşenleri birbirinden farklı |
| U-05 | `ValueCard` | ▲/▼ sadece caution/warning'de; stale'de saat ikonu ve soluk değer | — |
| U-06 | `arcMath` | 0 / %50 / %100 açıları; `max <= min` güvenli | — |
| U-07 | `ArcGauge` skala dışı (B4) | min altı/max üstü değerde işaret + aria metni | — |
| U-08 | i18n anahtarları | EN ve TR anahtar kümeleri eşit; kodda geçen her `t('...')` anahtarı sözlükte var | Eksik anahtar = test kırılır |
| U-09 | Eski renk sınıfları (B7) | `src/` içinde `text-ok`, `bg-surface-2` vb. kalmadı | Plan 3 sonrası |
| U-10 | `MoodPicker` (B1) | 5 seçenek, emoji yok, `role=radio`, her biri `min-h-touch` | — |
| U-11 | Token kontrastı | Ortam temalarında (Ay/Mars zemini) `text`, `text-2` ve 4 durum rengi de ≥ 6:1 | Şu an sadece `text-3` kontrol ediliyor |
| U-12 | Bağımlılık koruması | `src/` içinde `radix` import'u kalmadı (Base UI geçişi sonrası) | 0 eşleşme |

## 4. Fonksiyonel testler (Vitest + Testing Library) — kullanıcı eylemi → beklenen davranış

Bir bileşen ya da ekran, gerçek kullanıcı etkileşimiyle (`userEvent`) test edilir.

| ID | Senaryo | Adımlar | Beklenen |
|---|---|---|---|
| F-01 | Kırmızı uyarı onayı | 2 kırmızı uyarı göster → birini "Gördüm" | Sadece onaylanan `onAcknowledge`'a gider; diğeri ekranda kalır |
| F-02 | Kırmızı kapatılamaz | ESC, dışarı tıklama, geri tuşu | Pencere açık kalır (ESC ve dışarı tıklama mevcut testte var; geri/route değişimi eklenecek) |
| F-03 | Yanıp sönme | Açılışta yanıp söner → "Durdur" → durur → yeni uyarı gelince yeniden başlar | Mevcut testte var ✓ |
| F-04 | Odak (B8) | Pencere açılınca odak ilk "Ne yapmalıyım?" butonunda; Tab ile dışarı çıkılamaz | — |
| F-05 | Uyarı şeridi | sarı uyarıda "Ertele" → şeritten kalkar; boşsa "Tüm göstergeler normal · son ölçüm X önce" | — |
| F-06 | Öğren paneli | Bölge çipine dokun → panel açılır → sıra: Ne yapmalıyım → değer → neden → nedir → kaynak | Başlık sırası birebir |
| F-07 | Ölçüm girişi | Büyük tuş takımıyla 38.4 gir → kaydet → onay | Değer depoya yazılır, imleç/odak kaybolmaz |
| F-08 | Geçersiz giriş | Fiziksel olarak imkânsız değer (ör. nabız 900) | Hata mesajı yanında, kayıt yapılmaz |
| F-09 | Dil değişimi | EN → TR | Görünen tüm metin TR; düzen taşmıyor (en uzun TR metinleriyle) |
| F-10 | Ortam değişimi | ISS → Mars | Zemin tonu değişir, durum renkleri **değişmez**; eskalasyon metni "otonom protokol"e döner |
| F-11 | Hareket azaltma | `prefers-reduced-motion: reduce` | Nefes animasyonu yok, yanıp sönme yerine kalın çerçeve |
| F-12 | Ekip gizliliği | Ekip sayfasını aç | Hiçbir tıbbi değer ya da tıbbi durum yok; sadece rutin uyumu, check-in, skor |

## 5. Entegrasyon testleri — modüller birlikte, gerçek depo + değerlendirme motoru

`renderWithProviders` + gerçek `useHealthStore` + gerçek `assessment` motoru + `core/simulation` senaryoları. Sahte (mock) kullanılmaz; sadece saat sabitlenir.

| ID | Akış | Adımlar | Beklenen |
|---|---|---|---|
| I-01 | Ölçüm → durum → figür → şerit | Normal senaryo yükle → ateş 38.4 gir | Değerlendirme `warning` → kırmızı tam ekran açılır → onay → şeritte kırmızı satır → figürde ilgili bölge `data-status="warning"` → ValueCard ▲ |
| I-02 | Ateş ve sıvı kaybı senaryosu | `fever_dehydration` yükle | Doğru bölgeler doğru durumda; Öğren panelinde öneri listesi motorun önerisiyle aynı |
| I-03 | Güneş fırtınası | Senaryoyu yükle | Radyasyon `cumulativeSum` ile hesaplanır; "radyasyon sığınağı" önerisi görünür |
| I-04 | Eski veri zinciri | Saati 30 saat ileri al | Kartlar stale, figür bölgesi gri, şeritte "yeniden ölç", hiçbir yerde yeşil "normal" yok |
| I-05 | Rutin ödülü | Gecikmiş bir ölçümü gir | Rutin uyumu ve puan artar; **değer iyi olduğu için** puan değişmez |
| I-06 | Astronot değişimi | Kişi A → Kişi B | Ekranda sadece B'nin verisi; A'nın kırmızı uyarısı B'de görünmez |
| I-07 | Kalıcılık | Uyarıyı onayla → sayfayı yenile | Onay ve ölçümler korunur (Zustand persist) |
| I-08 | Rotalar | Tüm menü öğeleri | Her sayfa hatasız açılır, menü seçimi doğru (mevcut `routes.test` genişletilir) |

## 6. Uçtan uca (E2E) tarayıcı testleri — **öneri: Playwright + WebKit**

jsdom gerçek yerleşimi ve dokunmayı ölçemez. iPad Safari, WebKit motorunu kullandığı için Playwright'ın WebKit tarayıcısı + iPad cihaz profili (yatay, 1180×820, `hasTouch: true`) en yakın otomatik ortam.

> Karar gerektirir: `@playwright/test` yeni bir dev-bağımlılık ve tarayıcı indirmesi demek. Ekibe duyurulup eklenmeli. Eklenmezse E-testleri §7'deki elle tablet testlerine taşınır.

| ID | Test | Geçme ölçütü |
|---|---|---|
| E-01 | Production build açılışı (`npm run build && npm run preview`) | Konsolda hata yok |
| E-02 | **Gerçek dokunma alanı ölçümü:** tüm `button`, `[role=radio]`, `[role=tab]`, bölge tıklama alanları için `boundingBox()` | Her biri ≥ 104×104 px, komşular arası ≥ 16 px |
| E-03 | Dokunma ile kırmızı akış (`tap`) | I-01'in tarayıcıdaki karşılığı geçer |
| E-04 | Çevrimdışı | `context.setOffline(true)` sonrası yenile | Uygulama ve fontlar yüklenir (dış istek yok) |
| E-05 | Ekran görüntüsü (görsel regresyon) | Durum ekranı nominal / sarı / kırmızı / stale; Öğren paneli; Ölçüm | Onaylanmış referansla fark < eşik |
| E-06 | Erişilebilirlik taraması (`@axe-core/playwright`) | Ciddi/kritik ihlal 0 |
| E-07 | Performans | Durum ekranında 10 sn kayıt, 6× CPU yavaşlatma | Ortalama ≥ 50 FPS, uzun görev (> 50 ms) yok denecek kadar az |

## 7. Kullanıcı testleri — gerçek tablet, eldivenle

**Kim:** En az 3 kişi; tercihen uygulamayı yazmamış ekip dışı kişiler (en az 1).
**Cihaz:** Gerçek tablet, yatay, parlaklık %50, masada sabit + elde tutarak.
**Eldiven:** Kalın kış/kayak eldiveni (dokunmatik uyumlu) — astronot eldivenine en yakın sıkıntı. Her görev önce eldivenli yapılır.
**Kurulum:** Production build, internet kapalı, deterministik demo verisi (seed 2026).
**Kayıt:** Ekran kaydı + gözlemci notu. Katılımcıya yardım edilmez; "sesli düşün" istenir.

| ID | Görev (katılımcıya söylenen) | Ölçülen | Başarı ölçütü |
|---|---|---|---|
| T-01 | "Uygulamaya bak ve bugün sağlığın nasıl, söyle." | Doğru cevaba kadar süre | ≤ 5 sn, doğru |
| T-02 | (Kırmızı ateş uyarısı tetiklenir) "Ne yapman gerekiyor?" | Adımları bulma süresi, yanlış dokunuş | ≤ 15 sn, 0 yanlış dokunuş |
| T-03 | "Uyarıyı gördüğünü onayla." | Başarı | İlk denemede |
| T-04 | "Kalbinle ilgili bilgiye bak." | Süre, yanlış bölgeye dokunma | ≤ 10 sn, ≤ 1 hata |
| T-05 | "Vücut ısını 37.2 olarak gir." (eldivenle) | Süre, yanlış tuş | ≤ 20 sn, ≤ 1 düzeltme |
| T-06 | "Bugün kendini nasıl hissediyorsun, işaretle." | Süre | ≤ 5 sn |
| T-07 | "Uyku uyarısını sonra hatırlat." | Erteleme bulunuyor mu | İlk denemede |
| T-08 | "Son 7 günün uyku grafiğini aç." | Süre | ≤ 15 sn |
| T-09 | "Bir arkadaşının durumuna bak." | Tıbbi bilgi görmeden doğru sayfa | Tıbbi değer görünmemeli |
| T-10 | Tableti dikey çevir | Mesaj | "Yatay çevirin" görünüyor |
| T-11 | (Öğren paneli açıkken) "Bu paneli kapat." | Kapatma yolu (buton ya da sağa kaydırma), süre | ≤ 3 sn; eldivenle kaydırma kaza sonucu tetiklenmiyor |

**Görev sonrası (her katılımcı, 2 dk):**
- 3 sıfat: "Bu arayüzü üç kelimeyle anlat." → "tatlı / çocuksu / oyuncak" geçerse **anti-hedef kırmızı bayrağı** (tasarım §2).
- 1–5 ölçek: "Bir sorun olduğunu hemen fark ettim." / "Eldivenle rahat kullandım." / "Profesyonel görünüyor."
- Hedef: her maddede ortalama ≥ 4.

**Gözlem kontrol listesi:** yanlış dokunuşların yeri (hangi buton küçük/yakın) · parlama/okunabilirlik · animasyon takılması · kırmızı tam ekranın ürkütücülüğü (yeterince ciddi, ama panik yaratmıyor mu) · TR metin taşmaları.

## 8. Ne zaman, kim çalıştırır

| Ne | Ne zaman | Kim |
|---|---|---|
| Birim + fonksiyonel (`npm test`) | Her commit öncesi (`npm run verify`) | Claude Code / geliştiren kişi |
| Entegrasyon | Her modül birleştirmesinden önce (günde 2 kez) | Birleştirmeyi yapan |
| E2E (eklenirse) | 20–32. saat entegrasyon penceresinde ve demo öncesi | Arayüz sorumlusu |
| Tablet kullanıcı testi — tur 1 | Öncelik 1 biter bitmez (T-01–T-04, T-10) | Arayüz sorumlusu + 1 katılımcı |
| Tablet kullanıcı testi — tur 2 | 32–44. saat cila penceresi (tüm T-*) | 3 katılımcı |
| Demo provası = kabul testi | 44–48. saat (`DEMO_SCRIPT.md` kontrol listesi) | Tüm ekip |

## 9. Tanım: "Bitti"

Bir ekran ancak şunlar sağlanınca bitmiş sayılır:
1. İlgili U/F/I testleri yazıldı ve geçiyor; `npm run verify` temiz.
2. E-02 boyut ölçümünden geçti (ya da tablette elle doğrulandı).
3. En az bir eldivenli tablet denemesinde ilgili T görevi başarıyla tamamlandı.
4. §2'deki ilgili bulgular kapatıldı.
