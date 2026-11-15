"""MMASH user_X folder -> 24 h minute-of-day template + metadata."""
from pathlib import Path

import numpy as np
import pandas as pd

from ..constants import MIN_PER_DAY


def _abs_minute(day, time_str):
    t = pd.to_timedelta(time_str)
    return (day - 1) * MIN_PER_DAY + t.dt.total_seconds() / 60.0


def _hm_to_min(s):
    h, m = map(int, str(s).split(":"))
    return h * 60 + m


def _circular_fill(x):
    """Fill gaps in a minute-of-day array with circular interpolation."""
    x = np.asarray(x, float)
    idx = np.arange(len(x)); ok = ~np.isnan(x)
    if ok.sum() == 0:
        return x
    xp = np.concatenate([idx[ok] - len(x), idx[ok], idx[ok] + len(x)])
    fp = np.tile(x[ok], 3)
    return np.interp(idx, xp, fp)


def load_template(user_dir: Path):
    user_dir = Path(user_dir)
    ag = pd.read_csv(user_dir / "Actigraph.csv", index_col=0)
    rr = pd.read_csv(user_dir / "RR.csv", index_col=0)
    sl = pd.read_csv(user_dir / "sleep.csv", index_col=0)
    info = pd.read_csv(user_dir / "user_info.csv", index_col=0).iloc[0].to_dict()

    # Actigraph: per-minute heart rate and steps
    ag["m"] = np.floor(_abs_minute(ag["day"], ag["time"])).astype(int)
    ag.loc[(ag.HR < 30) | (ag.HR > 220), "HR"] = np.nan          # artefact
    agm = ag.groupby("m").agg(hr=("HR", "mean"), steps=("Steps", "sum"),
                              vm=("Vector Magnitude", "mean"))

    # RR: clean -> 5-min RMSSD (ms)
    rr["m"] = _abs_minute(rr["day"], rr["time"])
    ibi = rr["ibi_s"].values
    ok = (ibi > 0.3) & (ibi < 2.0)
    rel = np.abs(np.diff(ibi, prepend=ibi[0])) / np.maximum(ibi, 1e-6)
    ok &= rel < 0.2                                                 # ectopic / artefact filter
    r = rr[ok].copy()
    r["win"] = (r["m"] // 5).astype(int)
    r["d2"] = np.diff(r["ibi_s"].values, prepend=np.nan) ** 2
    g = r.groupby("win").agg(n=("ibi_s", "size"), ms=("d2", "mean"))
    g = g[g.n >= 50]
    rmssd_win = np.sqrt(g["ms"]) * 1000.0
    lo, hi = rmssd_win.quantile([0.02, 0.98])                      # clip artefact windows
    rmssd_win = rmssd_win.clip(lo, hi)
    n_bad = int((~ok).sum())

    # Fold into a minute-of-day template (overlapping hours are averaged)
    tmpl = pd.DataFrame(index=range(MIN_PER_DAY))
    agm["mod"] = agm.index % MIN_PER_DAY
    tmpl["hr"] = agm.groupby("mod")["hr"].mean()
    tmpl["steps"] = agm.groupby("mod")["steps"].mean()
    rm = pd.Series(rmssd_win.values, index=(rmssd_win.index * 5) % MIN_PER_DAY)
    rm = rm.groupby(level=0).mean()
    tmpl["rmssd"] = np.nan
    for start, v in rm.items():
        tmpl.loc[start:start + 4, "rmssd"] = v
    coverage = {c: float(tmpl[c].notna().mean()) for c in ["hr", "steps", "rmssd"]}
    for c in ["hr", "rmssd"]:
        tmpl[c] = _circular_fill(tmpl[c])
    tmpl["steps"] = tmpl["steps"].fillna(0)

    s = sl.iloc[0]
    onset = _hm_to_min(s["Onset Time"]); wake = _hm_to_min(s["Out Bed Time"])
    meta = {
        "user": user_dir.name, "info": info,
        "sleep_onset_min": onset, "wake_min": wake,
        "sleep_window_min": (wake - onset) % MIN_PER_DAY,
        "tst_min": float(s["Total Sleep Time (TST)"]),
        "efficiency": float(s["Efficiency"]) / 100.0,
        "rr_rejected_beats": n_bad, "rr_total_beats": int(len(rr)),
        "coverage_before_fill": coverage,
    }
    return tmpl, meta
