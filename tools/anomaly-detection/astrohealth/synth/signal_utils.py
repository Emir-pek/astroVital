"""Time-series helpers: template-segment resampling and AR(1) noise."""
import numpy as np

from ..constants import MIN_PER_DAY


def segment(arr, start, length_src, length_dst):
    """Resample the circular template slice [start, start+length_src) to length_dst samples."""
    idx = (start + np.arange(length_src)) % MIN_PER_DAY
    src = arr[idx]
    return np.interp(np.linspace(0, length_src - 1, length_dst), np.arange(length_src), src)


def ar1(n, phi, sd, rng):
    e = rng.normal(0, sd * np.sqrt(1 - phi ** 2), n)
    x = np.empty(n); x[0] = rng.normal(0, sd)
    for i in range(1, n):
        x[i] = phi * x[i - 1] + e[i]
    return x
