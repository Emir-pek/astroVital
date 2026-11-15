"""
Generator parameters.

IMPORTANT: numbers tagged "PLACEHOLDER" are not yet verified against a source.
Calibrate with Fitbit (day-to-day variability) and OSDR/HRP (space effects).
Do not inflate them to make the demo look better; calibrate against the literature.
"""

PARAMS = {
    # --- Day-to-day variability (PLACEHOLDER -> calibrate from Fitbit) ---
    "sd_sleep_len_min": 30,        # daily SD of nightly sleep length
    "sd_onset_shift_min": 20,      # daily wake-time deviation (clipped to ±60 min)
    "sd_hr_day_bpm": 2.5,          # daily heart-rate level shift
    "sd_rmssd_day_log": 0.10,      # daily RMSSD multiplier (log scale)
    "sd_activity_day_log": 0.25,   # daily activity multiplier (log scale)
    # --- Within-day noise ---
    "hr_noise_bpm": 2.0, "hr_ar": 0.8,
    "rmssd_noise_log": 0.12, "rmssd_ar": 0.7,
    # --- Space effects (PLACEHOLDER -> calibrate with OSDR / HRP literature) ---
    "space_ramp_days": 3,             # days until effects reach full size
    "space_sleep_loss_min": 30,       # mean sleep loss in space
    "space_hr_shift_bpm": -3.0,       # resting HR shift in microgravity (direction to verify)
    "space_rmssd_factor": 1.0,        # HRV change (neutral until verified)
    # --- Sleep debt -> physiology (PLACEHOLDER) ---
    "debt_hr_bpm_per_h": 1.5,
    "debt_rmssd_frac_per_h": -0.05,
    "debt_decay_per_day": 0.5,        # fraction of debt repaid each day
    # --- Environment ---
    "co2_base_mmhg": 2.5, "co2_sd_mmhg": 0.3,                 # PLACEHOLDER
    "dose_rate_msv_day": {"iss": 0.5, "mars_transit": 1.8},   # PLACEHOLDER (verify against a source)
    "light_wake_lux": 300, "light_prebed_lux": 50,            # fully synthetic
    # --- Cognitive test (PVT-like, enabled with --cognition; PLACEHOLDER) ---
    "pvt_base_rt_ms": 260, "pvt_sd_between_ms": 20, "pvt_sd_within_ms": 10,
    "pvt_debt_ms_per_h": 8, "pvt_co2_ms_per_mmhg": 4,
    "pvt_lapse_base": 1.0, "pvt_lapse_per_h_debt": 0.8,
    # --- Demo events ---
    "event_day": 8,                 # short sleep the night before this day; cabin CO2 event on this day
    "event_sleep_min": 270,         # 4.5 h
    "event_co2_mmhg": 6.0,          # CO2 rise on the same afternoon
    "event_co2_start_h": 5, "event_co2_dur_h": 6,   # hours after mission-day start (--start), duration in hours
}
