"use client";
import { useEffect, type RefObject } from "react";

/** Reuse the same React tree during fullscreen so drafts and translations remain mounted. */
export function useFocusLayer(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const layer = ref.current;
    if (!active || !layer) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const siblings: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement = layer;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          siblings.push([sibling, sibling.hasAttribute("inert")]);
          sibling.setAttribute("inert", "");
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    document.body.style.overflow = "hidden";
    const visibleControls = () =>
      Array.from(
        layer.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter(
        (el) =>
          !el.closest("[hidden], [inert]") && el.getClientRects().length > 0,
      );
    (layer.querySelector<HTMLElement>("[data-layer-focus]") ?? layer).focus();
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest("dialog[open]"))
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const controls = visibleControls();
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          layer.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    layer.addEventListener("keydown", keyboard);
    return () => {
      layer.removeEventListener("keydown", keyboard);
      siblings.forEach(([el, inert]) => {
        if (!inert) el.removeAttribute("inert");
      });
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [active, ref, onClose]);
}
