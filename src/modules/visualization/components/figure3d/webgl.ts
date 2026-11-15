let cached: boolean | null = null;

function probe(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  // jsdom has no WebGL (and logs "not implemented" on getContext): tests use the SVG figure.
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    // Give the probe context back right away; the stage creates its own.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** True when this browser can draw the 3D figure (tried once, then remembered). */
export function canUseWebGL(): boolean {
  if (cached === null) cached = probe();
  return cached;
}
