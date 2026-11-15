"""
CLI: MMASH user_X folders -> synthetic crew data.

Usage (from tools/anomaly-detection/):
  python scripts/generate_mission.py --users data/raw/mmash/user_3 data/raw/mmash/user_5 data/raw/mmash/user_7 \
      --days 14 --cognition --sleep-event-crew CM2 --out data/synthetic
  # or: python -m astrohealth.synth.cli ...
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from ..constants import MIN_PER_DAY
from .crew import generate_member
from .environment import generate_environment
from .mmash import load_template
from .params import PARAMS

TS_COLS = ["crew_id", "timestamp", "met_min", "mission_day", "asleep", "hr", "rmssd", "steps",
           "light_lux", "co2_mmhg", "dose_cum_msv", "personal_event", "cabin_event", "event_label"]


def build_parser():
    ap = argparse.ArgumentParser(description="MMASH -> multi-day synthetic mission data")
    ap.add_argument("--users", nargs="+", required=True, help="MMASH user_X klasörleri (sırayla CM1, CM2, ...)")
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--profile", choices=["iss", "mars_transit"], default="mars_transit")
    ap.add_argument("--cognition", action="store_true", help="PVT benzeri bilişsel test kanalı ekle")
    ap.add_argument("--sleep-event-crew", nargs="*", default=["CM2"],
                    help="Kısa uyku olayının uygulanacağı üyeler (ör. CM2). Boş bırakılırsa kimseye uygulanmaz.")
    ap.add_argument("--start", default="2026-11-15 07:00", help="Görev başlangıç zamanı (gösterim için)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data/synthetic")
    return ap


def main(argv=None):
    a = build_parser().parse_args(argv)

    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(a.seed)
    env, cabin_events = generate_environment((a.days + 2) * MIN_PER_DAY, a.profile, rng, PARAMS)

    all_ts, all_daily, all_ev, all_pvt, metas = [], [], [pd.DataFrame(cabin_events)], [], []
    for i, u in enumerate(a.users, 1):
        crew = f"CM{i}"
        tmpl, meta = load_template(Path(u))
        ts, daily, ev, pvt = generate_member(tmpl, meta, a.days, a.cognition,
                                             crew in (a.sleep_event_crew or []), env, rng, PARAMS)
        ts = ts.merge(env, on="met_min", how="left")                       # shared environment channels
        ts["event_label"] = np.where(ts["personal_event"] != "none", ts["personal_event"], ts["cabin_event"])
        ts.insert(1, "timestamp", pd.Timestamp(a.start) + pd.to_timedelta(ts["met_min"], unit="min"))
        for df in (ts, daily, ev, pvt):
            if len(df):
                df.insert(0, "crew_id", crew)
        all_ts.append(ts); all_daily.append(daily); all_ev.append(ev); all_pvt.append(pvt)
        meta["crew_id"] = crew; metas.append(meta)

    pd.concat(all_ts)[TS_COLS].to_csv(out / "mission_timeseries.csv", index=False)
    env.insert(1, "timestamp", pd.Timestamp(a.start) + pd.to_timedelta(env["met_min"], unit="min"))
    env[env.met_min < pd.concat(all_ts)["met_min"].max() + 1].to_csv(out / "cabin_environment.csv", index=False)
    pd.concat(all_daily).to_csv(out / "daily_summary.csv", index=False)
    pd.concat([e for e in all_ev if len(e)]).to_csv(out / "events_ground_truth.csv", index=False)
    if a.cognition:
        pd.concat(all_pvt).to_csv(out / "cognition_pvt.csv", index=False)
    with open(out / "run_config.json", "w") as f:
        json.dump({"args": vars(a), "params": PARAMS, "templates": metas}, f, indent=2, default=str)
    print(f"Yazıldı -> {out.resolve()}")


if __name__ == "__main__":
    main()
