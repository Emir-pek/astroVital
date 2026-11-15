"""Individual alerts: overnight recovery (at wake-up) and reaction test (at test time, with cabin-vs-person attribution)."""
from .thresholds import SIGNALS


def night_alerts(scores):
    """Night assessment: sleep is the primary signal; without a sleep flag at least 2 supporting signals are required."""
    alerts = []
    night = scores[scores.signal != "pvt_rt"]
    for (cid, day), g in night.groupby(["crew_id", "mission_day"]):
        g = g.set_index("signal")
        if g["bad_z"].isna().all():
            continue
        sleep_flag = bool(g.loc["tst_min", "flagged"])
        support = [s for s in ["hr_sleep", "rmssd_sleep"] if bool(g.loc[s, "flagged"])]
        if not sleep_flag and len(support) < 2:
            continue
        level = "UYARI" if sleep_flag and support else "DİKKAT"
        parts_txt = []
        for s in ["tst_min"] + support if sleep_flag else support:
            r = g.loc[s]; sg = SIGNALS[s]
            parts_txt.append(f"{sg['ad']} {r['value']:.0f} {sg['birim']} (kişisel normali {r['center']:.0f} {sg['birim']}, "
                             f"{'−' if r['value'] < r['center'] else '+'}{abs(r['value'] - r['center']):.0f})")
        alerts.append({"met_min": int(g["eval_met_min"].iloc[0]), "crew_id": cid, "scope": "individual", "level": level,
                       "title": f"{cid}: gece toparlanması normalin altında",
                       "explanation": "; ".join(parts_txt) + ".",
                       "action": "Bugünkü kritik görevleri (EVA, hassas operasyon) gözden geçir; "
                                 "dinlenme fırsatı ver; gün içindeki reaksiyon testini takip et."})
    return alerts


def pvt_alerts(scores, prior_alerts, T):
    """Reaction-test alerts. prior_alerts: earlier alerts, used for the 'sleep alert in the last 24 h' check.
    Returns only the NEW alerts."""
    new = []
    ps = scores[(scores.signal == "pvt_rt") & scores.bad_z.notna()].copy()
    ps["slot"] = ps["mission_day"].astype(str) + "-" + ps["session"].astype(str)
    for slot, g in ps.groupby("slot"):
        co2_high = g["co2_at_eval"].max() >= T["co2_warn_mmhg"]
        crew_med = g["bad_z"].median()
        n_elev = int((g["bad_z"] >= T["z_support"]).sum())
        for _, r in g.iterrows():
            recent = [a for a in prior_alerts + new if a["crew_id"] == r["crew_id"] and a["scope"] == "individual"
                      and "gece" in a["title"] and 0 <= r["eval_met_min"] - a["met_min"] <= 24 * 60]
            thr = T["z_support"] if recent else T["z_pvt_standalone"]
            if r["bad_z"] < thr:
                continue
            if co2_high and n_elev >= 2 and (r["bad_z"] - crew_med) < T["pvt_excess_vs_crew"]:
                continue                                  # caused by the environment; explained in the cabin alert
            new.append({"met_min": int(r["eval_met_min"]), "crew_id": r["crew_id"], "scope": "individual",
                        "level": "UYARI" if recent else "DİKKAT",
                        "title": f"{r['crew_id']}: reaksiyon süresi normalin üstünde",
                        "explanation": f"{int(r['session'])}. test {r['value']:.0f} ms (kişisel normali {r['center']:.0f} ms, "
                                       f"+{r['value'] - r['center']:.0f})" + (" ; son 24 saatte uyku uyarısı da var" if recent else "") + ".",
                        "action": "Hassas görevleri ertele veya çift kontrol uygula; kısa dinlenme sonrası testi tekrarla."})
        if co2_high and n_elev >= 2:
            new.append({"met_min": int(g["eval_met_min"].max()), "crew_id": "ALL", "scope": "cabin", "level": "DİKKAT",
                        "title": "Mürettebat genelinde reaksiyon süresi arttı",
                        "explanation": f"CO₂ yüksekken {n_elev}/{len(g)} kişide reaksiyon süresi normalin üstünde; "
                                       "artış kişilere değil ortama bağlandı.",
                        "action": "CO₂ düşene kadar hassas operasyonları ertele."})
    return new
