import { clsx } from 'clsx';
import { Construction } from 'lucide-react';
import { BOX } from './box';

/**
 * Banner shown inside Phase-0 stub components so the team (and jury, if a stub slips through)
 * can see what is unfinished. A Tile (box.ts) with the caution colour. Text must already be
 * translated. Always two text lines tall (clamped, full text in `title`), so the content below
 * stays put when the language changes.
 */
export function PlaceholderNotice({ text }: { text: string }) {
  return (
    <p
      title={text}
      className={clsx(BOX.tile, 'mb-4 flex h-20 items-center gap-3 text-label text-caution')}
    >
      <Construction aria-hidden="true" className="size-5 shrink-0" />
      <span className="line-clamp-2 min-w-0">{text}</span>
    </p>
  );
}
