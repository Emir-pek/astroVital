"""Prioritisation: attach crew with an individual alert in the last 24 h to cabin alerts."""


def add_priority(alerts):
    alerts = sorted(alerts, key=lambda a: a["met_min"])
    for a in alerts:
        if a["scope"] == "cabin" and a["level"] != "BİLGİ":
            pri = sorted({b["crew_id"] for b in alerts if b["scope"] == "individual"
                          and 0 <= a["met_min"] - b["met_min"] <= 24 * 60})
            a["priority_crew"] = ",".join(pri)
            if pri:
                a["action"] += f" Öncelikli izlenecek: {', '.join(pri)} (son 24 saatte bireysel uyarı)."
        else:
            a.setdefault("priority_crew", "")
    return alerts
