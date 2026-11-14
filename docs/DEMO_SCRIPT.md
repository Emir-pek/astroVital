# DEMO_SCRIPT — Jüri Demosu (3 dakika)

> Hedef kriterler: **Etki, Yaratıcılık, Geçerlilik, İlgililik, Sunum.** Demo dili İngilizce;
> TR geçişini bir kez göster. Hazırlık: Settings → seed `2026`, 30 gün; tarayıcı tam ekran,
> sunum modu (P2) açık.

| Süre      | Ekran                                                | Söylenecek (özet)                                                                                                                                                                    | Kriter                |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 0:00–0:20 | Dashboard (ISS, `nominal`)                           | "Mars'a giden bir astronot, Dünya'daki doktora 20 dakika uzakta. AstroVital, astronotun kendi sağlığını **sade dille** takip etmesini sağlar — tamamen çevrimdışı." Feragati göster. | Etki, İlgililik       |
| 0:20–0:50 | `/log`                                               | Ruh halini büyük emoji butonlarıyla (eldivenle) gir; klavyeyle nabız gir, makul olmayan değerde uyarıyı göster; kamera ile nabız (deneysel, güven skoru).                            | Yaratıcılık           |
| 0:50–1:30 | `/crew/crew-1`                                       | Vücut haritası: kalbe tıkla → işlevi, uzaydaki riski, ilgili ölçümler. Grafikte yeşil/sarı/kırmızı bantlar, 30 günlük trend.                                                         | Sunum                 |
| 1:30–2:10 | Settings → `fever_dehydration` + Ay üssü → `/alerts` | Kenji'de ateş: kırmızı, "CMO'ya bildir", "yeniden ölç", **neden önemli** açıklaması. Ortamı **Mars**'a çevir → aynı durum "otonom protokol + asenkron rapor (gecikme 4–24 dk)".      | Geçerlilik, İlgililik |
| 2:10–2:35 | `/learn`                                             | "Astronotun her şeyi bildiğini varsaymıyoruz": her ölçüm için _Nedir? / Uzayda nasıl ölçülür? / Renkler ne demek?_ + 5 NASA tehlikesi. Kaynak bağlantıları.                          | Geçerlilik            |
| 2:35–2:50 | `/mission`                                           | XP **uyuma** verilir, "iyi değere" değil → sahte veri teşviki yok. Seri, ekip skoru.                                                                                                 | Yaratıcılık, Etki     |
| 2:50–3:00 | Dil EN→TR, kapanış                                   | "Her eşik bir NASA/CSA kaynağına bağlı; açık kaynak, offline, her ortama uyarlanır."                                                                                                 | Sunum                 |

## Yedek planlar

- Kamera izni/ışık sorunu → "manuel girişe düşüş" akışını göster (bu da bir özellik).
- Canlı bozulursa: önceden kaydedilmiş 3 dk video.
- Veri karışırsa: Settings → "Tüm veriyi sıfırla" → "Demo verisini yükle" (seed deterministik).

## Prova kontrol listesi

- [ ] `npm run build && npm run preview` ile **production** build'de prova
- [ ] İnternet kapalıyken açılıyor mu? (offline iddiası)
- [ ] Zamanlama ≤ 3:00 (iki prova)
- [ ] Her ekranda feragat görünür
