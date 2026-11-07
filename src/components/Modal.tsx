import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useDialog } from './useDialog';

interface ModalProps {
  open: boolean;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Accessible dialog: labelled, focus-contained, Escape/backdrop dismissal, focus restoration. */
export function Modal({ open, titleId, onClose, children, wide = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog({ open, onClose, panelRef, initialFocus: 'panel' });

  if (!open) return null;

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close dialog" onClick={onClose} tabIndex={-1} />
      <div
        ref={panelRef}
        className={`dialog ${wide ? 'dialog-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
