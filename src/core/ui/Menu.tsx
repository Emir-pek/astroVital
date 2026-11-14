/**
 * Dropdown menu from the UI kit's headless behaviour layer (Base UI, ADR-029).
 * Re-exported here so app/modules never import `@base-ui/react` directly (ESLint enforces it).
 * Styling stays ours: pass Tailwind token classes via `className` on each part.
 */
export { Menu } from '@base-ui/react/menu';
