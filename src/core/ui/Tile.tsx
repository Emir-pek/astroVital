import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { BOX } from './box';

export interface TileProps extends HTMLAttributes<HTMLElement> {
  /** Element to render; `li` for a repeated list item. */
  as?: 'div' | 'li' | 'section' | 'article';
}

/**
 * The Tile / Row box role (box.ts): a box inside a panel or a repeated list item — raised
 * background, 20 px radius, 16 px padding, no shadow. `className` is for layout (flex, gap,
 * grid), not for another radius, padding, background or shadow.
 */
export function Tile({ as: Tag = 'div', className, ...rest }: TileProps) {
  return <Tag className={clsx(BOX.tile, className)} {...rest} />;
}
