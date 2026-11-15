"""Thin entry point -> astrohealth.synth.cli (the real code lives in the package)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tool root: lets Python find astrohealth

from astrohealth.synth.cli import main  # noqa: E402

if __name__ == "__main__":
    main()
