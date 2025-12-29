import { useEffect } from 'react';
import styles from './Modal.module.scss';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal__header}>
          <h2>{title}</h2>
          <button className={styles.modal__close} onClick={onClose}>
            ×
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
