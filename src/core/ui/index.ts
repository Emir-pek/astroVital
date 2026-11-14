/** Shared UI kit. Components take ALREADY-TRANSLATED strings; they never call t() themselves. */
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { Card, type CardProps } from './Card';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Modal, type ModalProps } from './Modal';
export { PlaceholderNotice } from './PlaceholderNotice';
export { ArcGauge, type ArcGaugeProps, type GaugeBand } from './ArcGauge';
export { arcPath, valueToAngle } from './arcMath';
export { ValueCard, type ValueCardProps } from './ValueCard';
export { StatusBadge, type StatusBadgeProps } from './StatusBadge';
export { STATUS_STYLE, STATUS_COLOR_VAR, type DisplayStatus } from './statusStyle';
export { ToastProvider } from './Toast';
export { useToast, type ToastApi, type ToastInput } from './toastContext';
