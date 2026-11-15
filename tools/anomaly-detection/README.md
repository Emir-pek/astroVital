# Anomaly detection tool (offline, Python)

Offline research tool for AstroVital: builds a **multi-day synthetic crew dataset** from a real public
wearable dataset (MMASH) and runs an **explainable, personal-baseline anomaly detector** on it.

- **Not part of the web app.** It is not bundled, not run by `npm run verify` / CI, and the app never
  calls it at runtime (offline-first stays intact). The app can consume its **outputs** (`results/alerts.csv`).
- **Decision support, not diagnosis.** Every alert says what happened, compared to whose normal, and what to do.
- Why Python here although the app is Node-only: see ADR-039 in `docs/DECISIONS.md`.

## Quick start

Requires Python ≥ 3.10 (tested with 3.13). Run everything from this folder.

```bash
cd tools/anomaly-detection
python -m pip install -r requirements.txt

# 1) Generate the 14-day, 3-person mission (needs the MMASH data, see below)
python scripts/generate_mission.py --users data/raw/mmash/user_3 data/raw/mmash/user_5 data/raw/mmash/user_7 \
    --days 14 --cognition --sleep-event-crew CM2 --out data/synthetic

# 2) Run the detector and score it against the answer key
python scripts/detect_anomalies.py --data data/synthetic --out results --evaluate
```

Expected: `4` alerts, `{"events_detected": "2/2", "false_alarms": 0, "scored_person_nights": 24}`,
and 20,160 rows per crew member in `data/synthetic/mission_timeseries.csv`.

`data/synthetic/` and `results/` are committed, so step 2 (and integration with the app) works
**without** downloading MMASH.

## Getting the MMASH data (only for step 1)

MMASH (Multilevel Monitoring of Activity and Sleep in Healthy People), PhysioNet, ODbL licence:
https://physionet.org/content/mmash/ — 22 healthy young men, 24 h each (RR intervals, actigraphy,
sleep). Download it and copy the `DataPaper/user_X` folders to `data/raw/mmash/user_X`.
`data/raw/` is git-ignored (~100 MB, and the licence asks for attribution rather than redistribution here).

## Layout

```
astrohealth/
  constants.py
  synth/            generator (v4)
    params.py       PARAMS — PLACEHOLDER coefficients live here
    mmash.py        MMASH user_X -> 24 h template
    signal_utils.py segment(), ar1()
    environment.py  cabin CO2, radiation dose, cabin event (shared by the crew)
    crew.py         one crew member: days, sleep debt, PVT, individual event
    cli.py
  detect/           detector (v1)
    thresholds.py   THRESH, SIGNALS, ANSWER_COLS
    features.py     nightly features
    baseline.py     rolling robust personal baseline (median + MAD, SD floor)
    cabin.py        CO2 cabin alerts
    individual.py   night + reaction-test alerts, cabin-vs-person attribution
    priority.py     priority crew list on cabin alerts
    pipeline.py     run(): end to end
    evaluate.py     the answer key is read ONLY here
    cli.py
scripts/            thin entry points
data/raw/mmash/     MMASH (git-ignored)
data/synthetic/     generated mission data
results/            alerts.csv, scores.csv, evaluation.json
reports/figures/    demo_timeline.png
```

## Output contract (`results/alerts.csv`)

`timestamp, met_min, crew_id, scope (cabin|individual), level (BİLGİ|DİKKAT|UYARI), title, explanation, action, priority_crew`

Alert texts are Turkish today. Level mapping to the app's `Status` (ADR-031) is an open integration task.
