"""
Explainable anomaly detector (v1) - decision support, not diagnosis.

  1) CABIN alert      : CO2 sensor above an absolute threshold for a sustained period.         -> cabin.py
  2) INDIVIDUAL alert : each person vs. their own normal (rolling window, adaptation excluded).  -> baseline.py, individual.py
                        Primary signal: sleep duration; supporting: sleep HR, RMSSD, reaction test.
  3) ATTRIBUTION      : if reaction time rises in most of the crew while CO2 is high, blame the cabin. -> individual.py
  4) PRIORITY         : a cabin alert lists crew with an individual alert in the last 24 h.     -> priority.py
  Evaluation (the answer key is read ONLY here)                                                -> evaluate.py

HONESTY NOTE: thresholds and SD floors in thresholds.py are design choices, not clinical thresholds.
"""
from .thresholds import THRESH, SIGNALS, ANSWER_COLS
from .pipeline import run
from .evaluate import evaluate

__all__ = ["THRESH", "SIGNALS", "ANSWER_COLS", "run", "evaluate"]
