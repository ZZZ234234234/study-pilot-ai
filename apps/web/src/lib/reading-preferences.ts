"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { Viewport } from "./reader-layout";

const eventName = "studypilot:reading-preference";
const unsaved = new Map<string, string>();

/** Only device-local UI preferences, never document text or model credentials. */
export function useReadingPreference<T extends string>(
  key: string,
  choices: readonly T[],
  fallback: T,
) {
  const read = useCallback(() => {
    let value = unsaved.get(key) ?? null;
    if (value === null) {
      try {
        value = window.localStorage.getItem(key);
      } catch {
        /* Visit-only preference. */
      }
    }
    return choices.includes(value as T) ? (value as T) : fallback;
  }, [key, choices, fallback]);
  const subscribe = useCallback(
    (notify: () => void) => {
      const storage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) {
          unsaved.delete(key);
          notify();
        }
      };
      window.addEventListener(eventName, notify);
      window.addEventListener("storage", storage);
      return () => {
        window.removeEventListener(eventName, notify);
        window.removeEventListener("storage", storage);
      };
    },
    [key],
  );
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const setValue = (next: T) => {
    try {
      window.localStorage.setItem(key, next);
      unsaved.delete(key);
    } catch {
      unsaved.set(key, next);
    }
    window.dispatchEvent(new Event(eventName));
  };
  return [value, setValue] as const;
}

function viewportSnapshot() {
  const view = window.visualViewport;
  return [
    view?.width ?? window.innerWidth,
    view?.height ?? window.innerHeight,
    view?.offsetLeft ?? 0,
    view?.offsetTop ?? 0,
  ].join(",");
}
function subscribeViewport(notify: () => void) {
  window.addEventListener("resize", notify);
  window.visualViewport?.addEventListener("resize", notify);
  window.visualViewport?.addEventListener("scroll", notify);
  return () => {
    window.removeEventListener("resize", notify);
    window.visualViewport?.removeEventListener("resize", notify);
    window.visualViewport?.removeEventListener("scroll", notify);
  };
}
export function useReadingViewport(): Viewport {
  const snapshot = useSyncExternalStore(
    subscribeViewport,
    viewportSnapshot,
    () => "1440,900,0,0",
  );
  const [width, height, left, top] = snapshot.split(",").map(Number);
  return { width, height, left, top };
}
