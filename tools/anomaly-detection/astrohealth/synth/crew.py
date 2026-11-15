"""One crew member: template -> N days of per-minute series, daily summary, individual event, PVT."""
import numpy as np
import pandas as pd

from ..constants import MIN_PER_DAY
from .signal_utils import ar1, segment


def generate_member(tmpl, meta, days, cognition, sleep_event, env, rng, P):
    hr_t, rm_t, st_t = tmpl["hr"].values, tmpl["rmssd"].values, tmpl["steps"].values
    onset0, wake0 = meta["sleep_onset_min"], meta["wake_min"]
    win0 = meta["sleep_window_min"]; wake_len0 = MIN_PER_DAY - win0
    eff = meta["efficiency"]
    co2_env = env["co2_mmhg"].values

    rows, daily, events, pvt_rows = [], [], [], []
    t = 0; debt_h = 0.0
    rt_person = P["pvt_base_rt_ms"] + rng.normal(0, P["pvt_sd_between_ms"])

    for d in range(1, days + 1):
        ramp = min(1.0, (d - 1) / max(P["space_ramp_days"], 1))
        hr_off = rng.normal(0, P["sd_hr_day_bpm"]) + ramp * P["space_hr_shift_bpm"]
        rm_fac = np.exp(rng.normal(0, P["sd_rmssd_day_log"])) * (1 + ramp * (P["space_rmssd_factor"] - 1))
        act_fac = np.exp(rng.normal(0, P["sd_activity_day_log"]))
        hr_off += P["debt_hr_bpm_per_h"] * debt_h                       # effect of sleep debt
        rm_fac *= max(0.3, 1 + P["debt_rmssd_frac_per_h"] * debt_h)

        # ---- AWAKE period
        # Mission schedule is locked to 24 h: wake-up at about the same time each day (small jitter);
        # sleep loss shows up as a later bedtime, so crew members never drift off the cabin clock.
        target = win0 - ramp * P["space_sleep_loss_min"] + rng.normal(0, P["sd_sleep_len_min"])
        event_night = sleep_event and (d + 1 == P["event_day"])
        if event_night:
            target = P["event_sleep_min"]
        sleep_len = int(round(np.clip(target, 180, 600)))
        jitter = 0 if d == days else rng.normal(0, P["sd_onset_shift_min"])
        next_wake = d * MIN_PER_DAY + int(round(np.clip(jitter, -60, 60)))
        wake_len = next_wake - sleep_len - t
        mins = np.arange(wake_len)
        light = np.full(wake_len, float(P["light_wake_lux"])); light[-60:] = P["light_prebed_lux"]
        rows.append(pd.DataFrame({"met_min": t + mins, "mission_day": d, "asleep": 0,
                                  "hr": segment(hr_t, wake0, wake_len0, wake_len) + hr_off,
                                  "rmssd": segment(rm_t, wake0, wake_len0, wake_len) * rm_fac,
                                  "steps": segment(st_t, wake0, wake_len0, wake_len) * act_fac,
                                  "light_lux": light, "personal_event": "none"}))
        steps_day = float(rows[-1]["steps"].sum())
        co2_wake = co2_env[t:t + wake_len]

        # ---- Cognitive test (30 min and 8 h after wake-up); CO2 is read from the shared environment
        if cognition:
            for k, off in enumerate([30, 8 * 60]):
                if off >= wake_len:
                    continue
                c = co2_env[t + off]
                rt = (rt_person + P["pvt_debt_ms_per_h"] * debt_h
                      + P["pvt_co2_ms_per_mmhg"] * max(0, c - P["co2_base_mmhg"])
                      + rng.normal(0, P["pvt_sd_within_ms"]))
                lapses = rng.poisson(P["pvt_lapse_base"] + P["pvt_lapse_per_h_debt"] * debt_h)
                pvt_rows.append({"met_min": t + off, "mission_day": d, "session": k + 1,
                                 "pvt_mean_rt_ms": round(rt, 1), "pvt_lapses": int(lapses)})
        t += wake_len

        # ---- SLEEP period (night d -> d+1)
        s_hr = segment(hr_t, onset0, win0, sleep_len) + hr_off
        s_rm = segment(rm_t, onset0, win0, sleep_len) * rm_fac
        awake = rng.random(sleep_len) > eff                     # simple awakening model
        awake[:5] = True                                        # sleep-onset latency
        if event_night:
            events.append({"type": "sleep_restriction", "scope": "individual", "start_met_min": t,
                           "end_met_min": t + sleep_len, "mission_day": d, "sleep_min": sleep_len})
        rows.append(pd.DataFrame({"met_min": t + np.arange(sleep_len), "mission_day": d,
                                  "asleep": (~awake).astype(int), "hr": s_hr, "rmssd": s_rm,
                                  "steps": 0.0, "light_lux": 0.0,
                                  "personal_event": "sleep_restriction" if event_night else "none"}))
        tst = float((~awake).sum())
        debt_h = max(0.0, debt_h * (1 - P["debt_decay_per_day"]) + (win0 * eff - tst) / 60.0)
        t += sleep_len

        dd = {"mission_day": d, "tst_min": tst, "sleep_window_min": sleep_len,
              "sleep_debt_h_after": round(debt_h, 2), "hr_sleep_mean": float(np.mean(s_hr)),
              "rmssd_sleep_mean": float(np.mean(s_rm)), "steps_total": steps_day,
              "co2_max_awake": float(np.max(co2_wake))}
        for p in [p for p in pvt_rows if p["mission_day"] == d]:
            dd[f"pvt{p['session']}_rt_ms"] = p["pvt_mean_rt_ms"]; dd[f"pvt{p['session']}_lapses"] = p["pvt_lapses"]
        daily.append(dd)

    ts = pd.concat(rows, ignore_index=True)
    n = len(ts)
    ts["hr"] = np.clip(ts["hr"] + ar1(n, P["hr_ar"], P["hr_noise_bpm"], rng), 35, 200).round(1)
    ts["rmssd"] = np.clip(ts["rmssd"] * np.exp(ar1(n, P["rmssd_ar"], P["rmssd_noise_log"], rng)), 5, 200).round(1)
    ts["steps"] = np.round(ts["steps"]).astype(int)
    return ts, pd.DataFrame(daily), pd.DataFrame(events), pd.DataFrame(pvt_rows)
