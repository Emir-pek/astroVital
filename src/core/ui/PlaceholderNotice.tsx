import { clsx } from 'clsx';
import { Construction } from 'lucide-react';
import { BOX } from './box';

/**
 * Banner shown inside Phase-0 stub components so the team (and jury, if a stub slips through)
 * can see what is unfinished. A Tile (box.ts) with the caution colour. Text must already be
 * translated.
 */
export function PlaceholderNotice({ text }: { text: string }) {
  return (
    <p className={clsx(BOX.tile, 'mb-4 flex items-center gap-3 text-label text-caution')}>
      <Construction aria-hidden="true" className="size-5 shrink-0" />
      {text}
    </p>
  );
}
