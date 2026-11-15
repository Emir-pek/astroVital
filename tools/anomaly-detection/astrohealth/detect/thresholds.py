"""Detector thresholds and signal definitions (design choices, not clinical thresholds)."""

ANSWER_COLS = ["event_label", "personal_event", "cabin_event"]   # answer key: dropped from the input

THRESH = {
    "adaptation_days": 3,        # first 3 days: space effects settling -> excluded from the baseline
    "baseline_max_days": 7,      # rolling window: at most the last 7 days
    "baseline_min_days": 3,      # no scoring without at least 3 clean days
    # SD floors (with only a few days of data the SD can be tiny by chance)
    "floor": {"tst_min": 25.0, "hr_sleep": 2.0, "rmssd_sleep": 4.0, "pvt_rt": 15.0},
    "z_primary": 2.5,            # for sleep duration
    "z_support": 2.0,            # HR / RMSSD; reaction test only if there was a sleep alert in the last 24 h (confirmation)
    "z_pvt_standalone": 3.0,     # reaction test alerting ON ITS OWN (a single test is noisy)
    "pvt_excess_vs_crew": 2.0,   # under high CO2: the person's z must exceed the crew median by at least this much
    "co2_warn_mmhg": 4.0, "co2_crit_mmhg": 5.0, "co2_sustain_min": 15,   # PLACEHOLDER
}

# Bad direction: +1 = high is bad, -1 = low is bad
SIGNALS = {
    "tst_min":     {"dir": -1, "ad": "uyku süresi", "birim": "dk"},
    "hr_sleep":    {"dir": +1, "ad": "uykudaki nabız", "birim": "bpm"},
    "rmssd_sleep": {"dir": -1, "ad": "uykudaki RMSSD", "birim": "ms"},
    "pvt_rt":      {"dir": +1, "ad": "reaksiyon süresi", "birim": "ms"},
}
