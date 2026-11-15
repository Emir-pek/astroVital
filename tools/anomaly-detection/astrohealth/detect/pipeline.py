"""End-to-end detector flow: data folder -> (alerts DataFrame, scores DataFrame)."""
from pathlib import Path

import numpy as np
import pandas as pd

from .baseline import score_series
from .cabin import cabin_alerts
from .features import night_features
from .individual import night_alerts, pvt_alerts
from .priority import add_priority
from .thresholds import ANSWER_COLS


def load_inputs(data_dir):
    """Read inputs; answer-key columns are NEVER given to the detector."""
    data_dir = Path(data_dir)
    ts = pd.read_csv(data_dir / "mission_timeseries.csv").drop(columns=ANSWER_COLS, errors="ignore")
    crew = sorted(ts["crew_id"].unique())
    cab = ts[ts.crew_id == crew[0]][["met_min", "co2_mmhg"]]
    pvt_path = data_dir / "cognition_pvt.csv"
    pvt = pd.read_csv(pvt_path) if pvt_path.exists() else pd.DataFrame()
    return ts, cab, pvt


def compute_scores(ts, cab, pvt, T):
    nf = night_features(ts)
    parts = [score_series(nf, ["crew_id"], sig, sig, T) for sig in ["tst_min", "hr_sleep", "rmssd_sleep"]]
    if len(pvt):
        p = pvt.rename(columns={"pvt_mean_rt_ms": "pvt_rt", "met_min": "eval_met_min"})
        parts.append(score_series(p, ["crew_id", "session"], "pvt_rt", "pvt_rt", T))
    scores = pd.concat(parts, ignore_index=True)
    co2_at = cab.set_index("met_min")["co2_mmhg"]
    scores["co2_at_eval"] = scores["eval_met_min"].map(lambda m: co2_at.get(min(m, co2_at.index.max()), np.nan))
    return scores


def run(data_dir, T, delay_min):
    ts, cab, pvt = load_inputs(data_dir)
    scores = compute_scores(ts, cab, pvt, T)

    alerts = cabin_alerts(cab, T, delay_min)
    alerts += night_alerts(scores)
    if len(pvt):
        alerts += pvt_alerts(scores, alerts, T)
    alerts = add_priority(alerts)
    return pd.DataFrame(alerts), scores
