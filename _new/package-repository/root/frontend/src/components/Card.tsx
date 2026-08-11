import { ReactNode } from 'react';
import styles from './Card.module.scss';

/** Props for the Card component. */
interface CardProps {
  /** Optional card title displayed in the header. */
  title?: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Card body content. */
  children?: ReactNode;
  /** Optional footer content. */
  footer?: ReactNode;
}

/**
 * A reusable card container with optional header,
 * body, and footer sections.
 */
export default function Card({
  title,
  subtitle,
  children,
  footer,
}: CardProps) {
  return (
    <div
      className={styles.card}
      data-testid="card"
      aria-label={title ?? 'Card'}
    >
      {(title || subtitle) && (
        <div className={styles.card__header}>
          <div>
            {title && (
              <h3 className={styles.card__title}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={styles.card__subtitle}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      {children && (
        <div className={styles.card__body}>
          {children}
        </div>
      )}
      {footer && (
        <div className={styles.card__footer}>
          {footer}
        </div>
      )}
    </div>
  );
}
