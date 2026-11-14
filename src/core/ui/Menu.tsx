import { createContext, useContext, useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react';

const MenuContext = createContext<{ value?: string | null; onValueChange?: (value: string) => void }>({});

function Root({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function Trigger({ className, children, ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}

function Portal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function Positioner({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

function Popup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

function RadioGroup({
  value,
  onValueChange,
  className,
  children,
}: { value?: string | null; onValueChange?: (value: string) => void; className?: string; children: ReactNode }) {
  const contextValue = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);

  return (
    <MenuContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </MenuContext.Provider>
  );
}

function RadioItem({
  value,
  className,
  children,
  onClick,
}: { value: string; className?: string; children: ReactNode; onClick?: () => void }) {
  const { value: selectedValue, onValueChange } = useContext(MenuContext);
  const checked = selectedValue === value;

  return (
    <button
      type="button"
      className={className}
      data-checked={checked}
      onClick={() => {
        onValueChange?.(value);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

function RadioItemIndicator({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function Separator({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

function Item({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

export const Menu = {
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  RadioGroup,
  RadioItem,
  RadioItemIndicator,
  Separator,
  Item,
};
