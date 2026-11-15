"""Cabin alerts: absolute CO2 threshold + persistence (no personal baseline needed)."""


def cabin_alerts(cab, T, delay_min):
    alerts = []
    co2 = cab.set_index("met_min")["co2_mmhg"].sort_index()
    for level, thr in [("DİKKAT", T["co2_warn_mmhg"]), ("UYARI", T["co2_crit_mmhg"])]:
        above = (co2 >= thr).astype(int)
        run = above.groupby((above != above.shift()).cumsum()).cumsum() * above
        in_episode = False; below_run = 0
        for m, v in co2.items():
            if not in_episode and run.loc[m] == T["co2_sustain_min"]:
                in_episode = True; below_run = 0
                win = co2.loc[m - T["co2_sustain_min"] + 1:m]
                alerts.append({"met_min": int(m), "crew_id": "ALL", "scope": "cabin", "level": level,
                               "title": f"Kabin CO₂ {thr:.1f} mmHg üzerinde",
                               "explanation": f"CO₂ son {T['co2_sustain_min']} dk boyunca {thr:.1f} mmHg eşiğinin üzerinde "
                                              f"(ortalama {win.mean():.2f}, en yüksek {win.max():.2f} mmHg).",
                               "action": "Yaşam desteği / CO₂ temizleme sistemini kontrol et. "
                                         f"Dünya'dan yanıt en erken ~{2 * delay_min} dk sonra; ilk müdahaleyi mürettebat yapmalı."})
            elif in_episode:
                below_run = below_run + 1 if v < thr else 0
                if below_run == T["co2_sustain_min"]:
                    in_episode = False
                    if level == "DİKKAT":
                        alerts.append({"met_min": int(m), "crew_id": "ALL", "scope": "cabin", "level": "BİLGİ",
                                       "title": "Kabin CO₂ normale döndü",
                                       "explanation": f"CO₂ {T['co2_sustain_min']} dk boyunca {thr:.1f} mmHg altında.",
                                       "action": "Kayıt al; mürettebatın sonraki testlerini izle."})
    return alerts
