import { useSyncExternalStore } from 'react';

/**
 * One shared ticker per interval: every component calling `useNow(1000)` is driven by the SAME
 * `setInterval`, which is started on first subscribe and cleared when the last one unmounts.
 */
interface Ticker {
  now: Date;
  listeners: Set<() => void>;
  id: number | undefined;
}

const tickers = new Map<number, Ticker>();

const getTicker = (intervalMs: number): Ticker => {
  let ticker = tickers.get(intervalMs);
  if (!ticker) {
    ticker = { now: new Date(), listeners: new Set(), id: undefined };
    tickers.set(intervalMs, ticker);
  }
  return ticker;
};

// Stable subscribe function per interval — a new function every render would make React
// resubscribe on each render (and loop).
const subscribers = new Map<number, (listener: () => void) => () => void>();

const subscribe = (intervalMs: number) => {
  let fn = subscribers.get(intervalMs);
  if (!fn) {
    fn = createSubscribe(intervalMs);
    subscribers.set(intervalMs, fn);
  }
  return fn;
};

const createSubscribe = (intervalMs: number) => (listener: () => void) => {
  const ticker = getTicker(intervalMs);
  ticker.listeners.add(listener);
  if (ticker.id === undefined) {
    ticker.now = new Date();
    ticker.id = window.setInterval(() => {
      ticker.now = new Date();
      ticker.listeners.forEach((l) => l());
    }, intervalMs);
  }
  return () => {
    ticker.listeners.delete(listener);
    if (ticker.listeners.size === 0 && ticker.id !== undefined) {
      window.clearInterval(ticker.id);
      ticker.id = undefined;
    }
  };
};

/**
 * Current time for components (ADR-030). Use this instead of `new Date()` in render code; pass
 * the returned `Date` into pure time functions as their `now` parameter. All time math is UTC.
 */
export function useNow(intervalMs = 1000): Date {
  const ticker = getTicker(intervalMs);
  return useSyncExternalStore(subscribe(intervalMs), () => ticker.now);
}
