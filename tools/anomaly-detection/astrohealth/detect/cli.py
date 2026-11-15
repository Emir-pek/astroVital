"""
CLI: data folder -> alerts.csv, scores.csv, (optional) evaluation.json

Usage (from tools/anomaly-detection/):
  python scripts/detect_anomalies.py --data data/synthetic --out results --evaluate
  # or: python -m astrohealth.detect.cli ...
"""
import argparse
import json
from pathlib import Path

import pandas as pd

from .evaluate import evaluate
from .pipeline import run
from .thresholds import THRESH


def build_parser():
    ap = argparse.ArgumentParser(description="Explainable anomaly detector")
    ap.add_argument("--data", required=True, help="generate_mission.py çıktı klasörü")
    ap.add_argument("--out", default="results")
    ap.add_argument("--delay-min", type=int, default=12, help="Dünya ile tek yönlü iletişim gecikmesi (dk), Mars için 4–24")
    ap.add_argument("--start", default=None, help="Gösterim saati için görev başlangıcı (varsayılan: veriden)")
    ap.add_argument("--evaluate", action="store_true", help="events_ground_truth.csv ile başarıyı ölç")
    return ap


def main(argv=None):
    a = build_parser().parse_args(argv)

    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    alerts, scores = run(a.data, THRESH, a.delay_min)
    ts0 = pd.read_csv(Path(a.data) / "mission_timeseries.csv", nrows=1)
    start = pd.Timestamp(a.start) if a.start else pd.Timestamp(ts0["timestamp"].iloc[0]) - pd.Timedelta(minutes=int(ts0["met_min"].iloc[0]))
    if len(alerts):
        alerts.insert(0, "timestamp", start + pd.to_timedelta(alerts["met_min"], unit="m"))
    alerts.to_csv(out / "alerts.csv", index=False)
    scores.round(3).to_csv(out / "scores.csv", index=False)
    print(f"{len(alerts)} uyarı -> {(out / 'alerts.csv').resolve()}")
    if a.evaluate:
        res = evaluate(alerts, scores, a.data)
        with open(out / "evaluation.json", "w") as f:
            json.dump(res, f, indent=2, ensure_ascii=False)
        print(json.dumps(res["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
