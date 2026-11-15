"""Nightly feature extraction from the raw per-minute series."""
import pandas as pd


def night_features(ts):
    """Per person per night: the in-bed window = minutes with light_lux == 0."""
    s = ts[ts["light_lux"] == 0]
    g = s.groupby(["crew_id", "mission_day"])
    f = pd.DataFrame({
        "tst_min": g["asleep"].sum(),
        "window_min": g.size(),
        "hr_sleep": s[s.asleep == 1].groupby(["crew_id", "mission_day"])["hr"].mean(),
        "rmssd_sleep": s[s.asleep == 1].groupby(["crew_id", "mission_day"])["rmssd"].mean(),
        "eval_met_min": g["met_min"].max() + 1,          # wake-up time: evaluated once the night is over
    }).reset_index()
    return f
