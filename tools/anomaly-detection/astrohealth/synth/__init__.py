"""
MMASH -> multi-day synthetic mission data generator (v4).

Idea:
  1. Extract each MMASH participant's 24 h rhythm as a "template"
     (per-minute heart rate, 5-min RMSSD, steps, sleep window).          -> mmash.py
  2. Stretch the template to N days with day-to-day variability.          -> crew.py
  3. Add space effects (sleep loss, HR/HRV shift), environment channels
     (CO2, radiation dose, light) and the demo events.                    -> crew.py, environment.py
  4. Write event locations to a separate ground-truth file so the
     detector can be evaluated.                                           -> cli.py

IMPORTANT: numbers tagged "PLACEHOLDER" in params.py are not yet verified against a source.
"""
from .params import PARAMS
from .mmash import load_template
from .environment import generate_environment
from .crew import generate_member

__all__ = ["PARAMS", "load_template", "generate_environment", "generate_member"]
