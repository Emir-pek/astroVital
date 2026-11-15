import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion';
import { useId } from 'react';
import type { CompanionMood } from '../../services/companion';
import { MOOD_COLOR_VAR } from './moodStyle';

/**
 * Visor light shapes (the only "expression"): two short light strokes, never a cartoon face.
 * cheerful = lifted arcs · neutral = level bars · concerned = tilted bars · alert = upright bars.
 */
const EXPRESSION: Record<CompanionMood, [string, string]> = {
  cheerful: ['M21 37 Q25 33.5 29 37', 'M35 37 Q39 33.5 43 37'],
  neutral: ['M22 36 H28', 'M36 36 H42'],
  concerned: ['M22 35 L28 37.5', 'M36 37.5 L42 35'],
  alert: ['M25 32.5 V39.5', 'M39 32.5 V39.5'],
};

/** Nominal-style breathing (spec §5.5): opacity only, 4.5 s, same as the figure's halo. */
const BREATH: { animate: TargetAndTransition; transition: Transition } = {
  animate: { opacity: [0.85, 1] },
  transition: { duration: 4.5 / 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' },
};

/** A short visor blink every 6 s (transform only). */
const BLINK: { animate: TargetAndTransition; transition: Transition } = {
  animate: { scaleY: [1, 1, 0.15, 1] },
  transition: { duration: 6, times: [0, 0.93, 0.965, 1], repeat: Infinity, ease: 'easeInOut' },
};

export interface CompanionAvatarProps {
  mood: CompanionMood;
  /** Rendered size in px (square). */
  size?: number;
}

/**
 * The companion: an original small helmet-helper, drawn in the astronaut figure's language
 * (matte suit greys, top-left light, dark soft visor; spec §8) — not a mascot, no cartoon face.
 * Calm moods breathe (ring opacity) and blink rarely; `concerned` and `alert` are still (alert has a
 * thicker warning ring, never blinking). `prefers-reduced-motion` → no animation at all.
 * Decorative: the mood is always also given as icon + text by the caller.
 */
export function CompanionAvatar({ mood, size = 56 }: CompanionAvatarProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const uid = useId().replace(/:/g, '');
  const color = MOOD_COLOR_VAR[mood];
  const calm = mood === 'cheerful' || mood === 'neutral';
  const animate = calm && !reduceMotion;
  const [left, right] = EXPRESSION[mood];

  const ringProps = {
    cx: 32,
    cy: 33,
    r: 29,
    fill: 'none',
    stroke: color,
    strokeWidth: mood === 'alert' ? 4 : 2,
  };

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-mood={mood}
      data-animated={animate ? 'true' : 'false'}
    >
      <defs>
        <radialGradient id={`${uid}-shell`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="var(--av-suit-hi)" />
          <stop offset="0.55" stopColor="var(--av-suit-base)" />
          <stop offset="1" stopColor="var(--av-suit-shade)" />
        </radialGradient>
        <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="var(--av-suit-visor-hi)" />
          <stop offset="0.6" stopColor="var(--av-suit-visor)" />
          <stop offset="1" stopColor="var(--av-suit-visor-deep)" />
        </linearGradient>
      </defs>

      {animate ? (
        <motion.circle
          {...ringProps}
          data-breathing="true"
          animate={BREATH.animate}
          transition={BREATH.transition}
        />
      ) : (
        <circle {...ringProps} opacity={mood === 'alert' ? 1 : 0.9} />
      )}

      {/* Contact shadow, neck ring, shell, helmet lamp, visor, sheen. */}
      <ellipse cx="32" cy="58" rx="14" ry="2.5" fill="var(--av-suit-ground)" opacity="0.5" />
      <path
        d="M19 51 Q32 57 45 51"
        fill="none"
        stroke="var(--av-suit-hw)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="33"
        r="21"
        fill={`url(#${uid}-shell)`}
        stroke="var(--av-suit-hw-dark)"
        strokeWidth="1"
      />
      <rect x="15.5" y="17" width="7" height="5" rx="2" fill="var(--av-suit-hw)" />
      <circle cx="17.5" cy="19.5" r="1.4" fill="var(--av-suit-lens)" />
      <rect
        x="16"
        y="27"
        width="32"
        height="20"
        rx="10"
        fill={`url(#${uid}-visor)`}
        stroke="var(--av-suit-hw-dark)"
        strokeWidth="1"
      />
      <path
        d="M20 31 Q24 28.5 30 28.5"
        fill="none"
        stroke="var(--av-suit-sheen)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Expression: two visor lights in the mood colour. */}
      <motion.g
        data-blinking={animate ? 'true' : 'false'}
        style={{ transformOrigin: '32px 36px' }}
        {...(animate ? { animate: BLINK.animate, transition: BLINK.transition } : {})}
        stroke={color}
        strokeWidth="2.75"
        strokeLinecap="round"
        fill="none"
      >
        <path d={left} />
        <path d={right} />
      </motion.g>
    </svg>
  );
}
