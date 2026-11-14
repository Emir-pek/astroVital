import { Construction } from 'lucide-react';

/**
 * Small banner shown inside Phase-0 stub components so the team (and jury, if a stub
 * slips through) can see what is unfinished. Text must already be translated.
 */
export function PlaceholderNotice({ text }: { text: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">
      <Construction aria-hidden="true" className="size-4 shrink-0" />
      {text}
    </p>
  );
}
