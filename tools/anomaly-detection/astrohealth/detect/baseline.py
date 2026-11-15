"""Personal normal: rolling robust (median + MAD) baseline and z-score."""
import numpy as np
import pandas as pd

from .thresholds import SIGNALS


def robust_baseline(values, floor):
    v = np.asarray(values, float)
    center = float(np.median(v))
    mad = float(np.median(np.abs(v - center))) * 1.4826
    return center, max(mad, floor)


def score_series(df, key_cols, value_col, signal, T):
    """df: crew_id, day, value, eval_met_min (+ key). Scores with a rolling window, excluding flagged days."""
    out = []
    d0 = T["adaptation_days"] + 1
    for keys, grp in df.groupby(key_cols):
        grp = grp.sort_values("mission_day")
        clean = []                                        # (day, value) days counted as normal
        for _, r in grp.iterrows():
            day, v = int(r["mission_day"]), float(r[value_col])
            if day < d0:
                continue
            base = [x for (dd, x) in clean if day - T["baseline_max_days"] <= dd < day]
            rec = {"crew_id": r["crew_id"], "mission_day": day, "signal": signal, "value": v,
                   "eval_met_min": int(r["eval_met_min"]), "n_base": len(base)}
            if "session" in r:
                rec["session"] = int(r["session"])
            if len(base) >= T["baseline_min_days"]:
                c, s = robust_baseline(base, T["floor"][signal])
                z = (v - c) / s
                bad_z = z * SIGNALS[signal]["dir"]        # positive = deviation in the bad direction
                thr = T["z_primary"] if signal == "tst_min" else T["z_support"]
                rec.update(center=c, scale=s, z=z, bad_z=bad_z, flagged=bad_z >= thr)
            else:
                rec.update(center=np.nan, scale=np.nan, z=np.nan, bad_z=np.nan, flagged=False)
            out.append(rec)
            if not rec["flagged"]:
                clean.append((day, v))                    # keep abnormal days out of the baseline
    return pd.DataFrame(out)
