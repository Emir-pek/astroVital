/**
 * Non-modal popover from the UI kit's headless behaviour layer (Base UI, ADR-029).
 * Re-exported here so app/modules never import `@base-ui/react` directly (ESLint enforces it).
 * Styling stays ours: use the Panel recipe (`BOX.panel`) on `Popover.Popup`; keep the positioner
 * below the full-screen layers (z-30: under Sheet z-40, RedAlertDialog/Modal/Toast z-50).
 */
export { Popover } from '@base-ui/react/popover';
