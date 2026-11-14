import { AlertDialog } from '@base-ui/react/alert-dialog';
import { clsx } from 'clsx';
import { OctagonAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './Button';

export interface RedAlertItem {
  id: string;
  title: string;
  valueText: string;
  description: string;
  steps: string[];
  escalationText: string;
}

export interface RedAlertDialogProps {
  items: RedAlertItem[];
  heading: string;
  whatToDoLabel: string;
  acknowledgeLabel: string;
  stopBlinkingLabel: string;
  onAcknowledge: (id: string) => void;
}

/**
 * Full-screen red warning: the only place reversed video is allowed. Escape and outside presses
 * never dismiss it; it closes only when every item has been acknowledged (items becomes empty).
 */
export function RedAlertDialog({
  items,
  heading,
  whatToDoLabel,
  acknowledgeLabel,
  stopBlinkingLabel,
  onAcknowledge,
}: RedAlertDialogProps) {
  const [blinking, setBlinking] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const [knownIds, setKnownIds] = useState<string[]>(() => items.map((i) => i.id));

  // A new warning must always blink again, even after "stop blinking" for an earlier one.
  if (items.some((i) => !knownIds.includes(i.id))) {
    setKnownIds(items.map((i) => i.id));
    setBlinking(true);
    setOpenId(null);
  } else if (knownIds.length !== items.length) {
    setKnownIds(items.map((i) => i.id));
  }

  return (
    <AlertDialog.Root
      open={items.length > 0}
      onOpenChange={(_open, details) => {
        // Controlled by `items`: no user gesture may close a red alert.
        details.cancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Popup
          initialFocus={firstActionRef}
          className="fixed inset-0 z-50 flex flex-col gap-touch-gap overflow-y-auto bg-warning-fill p-6 text-on-warning-fill"
        >
          <div className="flex flex-wrap items-center justify-between gap-touch-gap">
            <AlertDialog.Title className="text-headline font-semibold">{heading}</AlertDialog.Title>
            <Button variant="secondary" onClick={() => setBlinking(false)}>
              {stopBlinkingLabel}
            </Button>
          </div>
          <AlertDialog.Description className="sr-only">{heading}</AlertDialog.Description>
          <ul className="flex flex-col gap-touch-gap">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-card border-2 border-current p-4"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <OctagonAlert
                    aria-hidden="true"
                    className={clsx('size-12 shrink-0', blinking && 'av-blink av-blink-frame')}
                  />
                  <span className="text-title font-semibold">{item.title}</span>
                  <span className="font-mono text-title tabular-nums">{item.valueText}</span>
                </div>
                <p className="text-body">{item.description}</p>
                {openId === item.id && (
                  <div className="text-body">
                    <ol className="list-decimal pl-6">
                      {item.steps.map((s, i) => (
                        <li key={`${i}-${s}`}>{s}</li>
                      ))}
                    </ol>
                    <p className="mt-2 font-medium">{item.escalationText}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-touch-gap">
                  <Button
                    ref={index === 0 ? firstActionRef : undefined}
                    variant="secondary"
                    aria-expanded={openId === item.id}
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  >
                    {whatToDoLabel}
                  </Button>
                  <Button variant="secondary" onClick={() => onAcknowledge(item.id)}>
                    {acknowledgeLabel}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
