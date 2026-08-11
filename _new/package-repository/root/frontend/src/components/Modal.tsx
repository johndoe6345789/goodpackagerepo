import { ReactNode, useEffect, MouseEvent } from 'react';
import styles from './Modal.module.scss';

/** Props for the Modal component. */
interface ModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Callback invoked when the modal should close. */
  onClose: () => void;
  /** Title displayed in the modal header. */
  title: string;
  /** Modal body content. */
  children: ReactNode;
  /** Optional footer content. */
  footer?: ReactNode;
}

/** A dialog overlay that locks page scroll when open. */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    document.body.style.overflow =
      isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stopPropagation = (e: MouseEvent) =>
    e.stopPropagation();

  return (
    <div
      className={styles.modal}
      onClick={onClose}
      data-testid="modal-overlay"
      aria-label={title}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={styles.modal__content}
        onClick={stopPropagation}
        data-testid="modal-content"
      >
        <div className={styles.modal__header}>
          <h2>{title}</h2>
          <button
            className={styles.modal__close}
            onClick={onClose}
            aria-label="Close modal"
            data-testid="modal-close"
          >
            &times;
          </button>
        </div>
        <div className={styles.modal__body}>
          {children}
        </div>
        {footer && (
          <div className={styles.modal__footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
