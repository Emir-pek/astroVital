/** WCAG 2.x contrast helpers and a tiny design-token CSS parser (used by the contrast guard test). */

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) throw new Error(`Expected #RRGGBB colour, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};

/** WCAG contrast ratio between two `#RRGGBB` colours (order-independent), 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface ColorTokens {
  root: Record<string, string>;
  env: Record<string, Record<string, string>>;
}

/**
 * Extracts hex `--av-*` custom properties. Keys drop the `--av-` prefix. `:root` blocks go to
 * `root`; `[data-env='x']` selectors (comma lists allowed) go to `env[x]`. Non-hex values are skipped.
 */
export function parseColorTokens(css: string): ColorTokens {
  const out: ColorTokens = { root: {}, env: {} };
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const block of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1] ?? '';
    const body = block[2] ?? '';
    const tokens: Record<string, string> = {};
    for (const d of body.matchAll(/--av-([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*(?:;|$)/g)) {
      if (d[1] && d[2]) tokens[d[1]] = d[2];
    }
    if (/(^|,)\s*:root\s*(,|$)/.test(selector)) Object.assign(out.root, tokens);
    for (const e of selector.matchAll(/\[data-env=['"]([\w-]+)['"]\]/g)) {
      if (e[1]) out.env[e[1]] = { ...out.env[e[1]], ...tokens };
    }
  }
  return out;
}
