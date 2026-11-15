"""Evaluation: the answer key (events_ground_truth.csv) is read ONLY here."""
from pathlib import Path

import pandas as pd


def evaluate(alerts, scores, data_dir, effect_window_h=24):
    ev = pd.read_csv(Path(data_dir) / "events_ground_truth.csv")
    res = {"events": [], "false_alarms": []}
    used = set()
    for _, e in ev.iterrows():
        if e["scope"] == "cabin":
            m = alerts[(alerts.scope == "cabin") & (alerts.met_min >= e.start_met_min) & (alerts.met_min <= e.end_met_min)
                       & (alerts.level != "BİLGİ")]
            ref = e.start_met_min
        else:
            hi = e.end_met_min + effect_window_h * 60
            m = alerts[(alerts.crew_id == e.crew_id) & (alerts.scope == "individual")
                       & (alerts.met_min >= e.start_met_min) & (alerts.met_min <= hi)]
            ref = e.end_met_min                       # cannot be measured before the night ends: latency counts from wake-up
        used |= set(m.index)
        res["events"].append({"type": e["type"], "crew_id": e["crew_id"], "detected": bool(len(m)),
                              "latency_min": int(m.met_min.min() - ref) if len(m) else None,
                              "n_alerts": int(len(m)),
                              "cabin_alert_lists_priority": (bool(alerts[(alerts.scope == "cabin") & alerts.index.isin(m.index)]
                                                                  ["priority_crew"].str.len().gt(0).any())
                                                             if e["scope"] == "cabin" else None)})
    # "back to normal" after a cabin event and the crew-wide PVT note during high CO2 are not false alarms
    for i, a in alerts.iterrows():
        if i in used or a["level"] == "BİLGİ":
            continue
        if a["scope"] == "cabin" and ((ev.scope == "cabin") & (a.met_min >= ev.start_met_min) & (a.met_min <= ev.end_met_min + 60)).any():
            continue
        res["false_alarms"].append({"met_min": int(a.met_min), "crew_id": a.crew_id, "title": a.title})
    scored_person_days = int(scores[scores.bad_z.notna() & (scores.signal == "tst_min")].shape[0])
    res["summary"] = {"events_detected": f"{sum(x['detected'] for x in res['events'])}/{len(res['events'])}",
                      "false_alarms": len(res["false_alarms"]), "scored_person_nights": scored_person_days}
    return res
