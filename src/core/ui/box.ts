/**
 * The box system (spec §5.2, tokens.css): every box in the app is one of three roles, so cards,
 * panels and rows look the same on every page. Prefer the components (`Card` = Panel, `Tile`);
 * use these recipes only where a component cannot wrap the element (e.g. a Base UI popup or a
 * `<button>` that must look like a tile). Do not mix a recipe with another radius/padding/shadow
 * class — pick the recipe that fits.
 *
 * - `panel`  top-level container: surface gradient, 24 px radius, 24 px padding, soft shadow.
 * - `panelFlush`  the same surface without padding, for a panel whose rows bring their own
 *   horizontal padding (`px-panel`) — e.g. a divided list that scrolls inside the panel.
 * - `tile`   a box inside a panel or a repeated list item: raised, 20 px radius, 16 px padding,
 *   no shadow. Never put a panel inside a tile or a tile inside a tile.
 * - `tileFlush`  the tile surface without padding.
 * - `pill`   badges, chips, status lines: full radius (padding is the pill's own).
 */
export const BOX = {
  panel: 'card-surface rounded-panel p-panel shadow-soft',
  panelFlush: 'card-surface rounded-panel shadow-soft',
  tile: 'bg-raised rounded-tile p-tile',
  tileFlush: 'bg-raised rounded-tile',
  pill: 'rounded-pill',
} as const;

export type BoxRole = keyof typeof BOX;
