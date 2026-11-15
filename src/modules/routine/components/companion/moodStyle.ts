import { CircleCheck, Info, MessageCircle, OctagonAlert, type LucideIcon } from 'lucide-react';
import type { CompanionMood } from '../../services/companion';

/** Mood → token colour of the visor lights and the ring. Status colours only where they mean status. */
export const MOOD_COLOR_VAR: Record<CompanionMood, string> = {
  cheerful: 'var(--av-status-nominal)',
  neutral: 'var(--av-accent)',
  concerned: 'var(--av-status-advisory)',
  alert: 'var(--av-status-warning)',
};

/** Mood → icon + text colour: the mood is never told by the drawing or colour alone. */
export const MOOD_STYLE: Record<CompanionMood, { icon: LucideIcon; textClass: string }> = {
  cheerful: { icon: CircleCheck, textClass: 'text-nominal' },
  neutral: { icon: MessageCircle, textClass: 'text-accent' },
  concerned: { icon: Info, textClass: 'text-advisory' },
  alert: { icon: OctagonAlert, textClass: 'text-warning' },
};
