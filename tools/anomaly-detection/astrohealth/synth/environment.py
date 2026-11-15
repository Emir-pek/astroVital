"""Cabin environment: channels SHARED by the whole crew (CO2, radiation dose) + the cabin demo event."""
import numpy as np
import pandas as pd

from ..constants import MIN_PER_DAY
from .signal_utils import ar1


def generate_environment(total_min, profile, rng, P):
    """Cabin environment, common to all crew members (CO2, radiation dose)."""
    m = np.arange(total_min)
    clock = m % MIN_PER_DAY                                   # mission clock (day start = --start)
    co2 = (P["co2_base_mmhg"]
           + 0.4 * np.sin(2 * np.pi * (clock - 6 * 60) / MIN_PER_DAY)   # slight daytime rise with activity
           + ar1(total_min, 0.95, P["co2_sd_mmhg"], rng))
    s0 = (P["event_day"] - 1) * MIN_PER_DAY + int(P["event_co2_start_h"] * 60)
    s1 = s0 + int(P["event_co2_dur_h"] * 60)
    ramp = np.clip(np.minimum(m - s0, s1 - m) / 45.0, 0, 1)              # 45 min ramp up / down
    co2 = np.clip(co2 + ramp * (P["event_co2_mmhg"] - P["co2_base_mmhg"]), 0.5, None)
    dose_rate = P["dose_rate_msv_day"][profile] / MIN_PER_DAY
    dose = np.cumsum(np.full(total_min, dose_rate) * np.exp(rng.normal(0, 0.1, total_min)))
    env = pd.DataFrame({"met_min": m, "co2_mmhg": co2.round(2), "dose_cum_msv": dose.round(4),
                        "cabin_event": np.where((m >= s0) & (m < s1), "co2_high", "none")})
    events = [{"crew_id": "ALL", "type": "co2_high", "scope": "cabin", "start_met_min": s0,
               "end_met_min": s1, "mission_day": P["event_day"], "peak_mmhg": P["event_co2_mmhg"]}]
    return env, events
