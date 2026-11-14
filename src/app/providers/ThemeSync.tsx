import { useEffect } from 'react';
import { useHealthStore } from '@core/store';

/** Sets <html data-env="..."> so tokens.css can tint the UI per environment (ISS / Moon / Mars). */
export function ThemeSync() {
  const env = useHealthStore((s) => s.activeEnvironment);
  useEffect(() => {
    document.documentElement.dataset.env = env;
  }, [env]);
  return null;
}
