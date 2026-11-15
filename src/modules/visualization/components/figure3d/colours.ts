import type { DisplayStatus } from '@core/ui';

/*
 * Colours of the 3D figure, read from the CSS custom properties in tokens.css (never hard-coded in
 * components). The hex values below are only fallbacks for environments without the stylesheet
 * (jsdom) and mirror tokens.css.
 */

export interface FigureColours {
  suitHi: string;
  suitBase: string;
  suitMid: string;
  suitShade: string;
  hwHi: string;
  hw: string;
  hwDark: string;
  pack: string;
  sole: string;
  visor: string;
  visorHi: string;
  lens: string;
  sheen: string;
  rim: string;
  ground: string;
  /** Suit trim stripes (`--av-suit-accent`). */
  suitAccent: string;
  /** UI accent (`--av-accent`), the whole-body tint when it is selected while nominal. */
  accent: string;
  line: string;
  /** Page background (`--av-bg`): the dark keyline around x-ray ghosts. */
  bg: string;
  status: Record<DisplayStatus, string>;
}

/** Token name → fallback, per FigureColours key. */
const TOKENS = {
  suitHi: ['--av-suit-hi', '#f8f9fc'],
  suitBase: ['--av-suit-base', '#e4e7ef'],
  suitMid: ['--av-suit-mid', '#c9ceda'],
  suitShade: ['--av-suit-shade', '#979fb4'],
  hwHi: ['--av-suit-hw-hi', '#f1f3f8'],
  hw: ['--av-suit-hw', '#b8bfcd'],
  hwDark: ['--av-suit-hw-dark', '#737b91'],
  pack: ['--av-suit-pack', '#8f97ab'],
  sole: ['--av-suit-sole', '#3a4159'],
  visor: ['--av-suit-visor', '#131a37'],
  visorHi: ['--av-suit-visor-hi', '#2c365d'],
  lens: ['--av-suit-lens', '#1b2138'],
  sheen: ['--av-suit-sheen', '#ffffff'],
  rim: ['--av-suit-rim', '#dde6ff'],
  ground: ['--av-suit-ground', '#03050d'],
  suitAccent: ['--av-suit-accent', '#e8a66b'],
  accent: ['--av-accent', '#c3b5ff'],
  line: ['--av-line', '#2a3561'],
  bg: ['--av-bg', '#0e1530'],
} as const satisfies Record<Exclude<keyof FigureColours, 'status'>, readonly [string, string]>;

const STATUS_TOKENS: Record<DisplayStatus, readonly [string, string]> = {
  nominal: ['--av-status-nominal', '#7fe0b8'],
  advisory: ['--av-status-advisory', '#7dbdff'],
  caution: ['--av-status-caution', '#ffd35c'],
  warning: ['--av-status-warning', '#ff8f99'],
  stale: ['--av-text-3', '#adb6d6'],
  none: ['--av-text-3', '#adb6d6'],
};

/** Reads one custom property; `fallback` when it is missing or empty. */
export type TokenReader = (name: string, fallback: string) => string;

export const readTokenFrom =
  (el: Element | null): TokenReader =>
  (name, fallback) => {
    if (!el || typeof getComputedStyle !== 'function') return fallback;
    const value = getComputedStyle(el).getPropertyValue(name).trim();
    return WEBGL_PARSEABLE.test(value) ? value : fallback;
  };

/** Colour syntaxes three.js can parse; anything else (color-mix, oklch…) uses the fallback. */
const WEBGL_PARSEABLE = /^(#[0-9a-f]{3}$|#[0-9a-f]{6}$|rgba?\(|hsla?\()/i;

export function readFigureColours(
  read: TokenReader = readTokenFrom(
    typeof document === 'undefined' ? null : document.documentElement,
  ),
): FigureColours {
  const entries = Object.entries(TOKENS).map(([key, [name, fallback]]) => [
    key,
    read(name, fallback),
  ]);
  const status = Object.fromEntries(
    Object.entries(STATUS_TOKENS).map(([key, [name, fallback]]) => [key, read(name, fallback)]),
  ) as Record<DisplayStatus, string>;
  return { ...(Object.fromEntries(entries) as Omit<FigureColours, 'status'>), status };
}
