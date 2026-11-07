import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface DialogOptions {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
  initialFocus?: 'panel' | 'first';
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableItems(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('type') !== 'hidden' &&
      el.tabIndex >= 0 &&
      el.getAttribute('aria-hidden') !== 'true' &&
      el.closest('[hidden]') === null,
  );
}

/** Shared focus containment, Escape dismissal, scroll lock and focus restoration. */
export function useDialog({ open, onClose, panelRef, initialFocus = 'first' }: DialogOptions): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel === null) return;

    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const items = focusableItems(panel);
    if (initialFocus === 'panel') panel.focus();
    else (items[0] ?? panel).focus();

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const current = focusableItems(panel);
      if (current.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (first === undefined || last === undefined) return;
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
      if (restore !== null && document.contains(restore)) restore.focus();
    };
  }, [open, initialFocus, panelRef]);
}
