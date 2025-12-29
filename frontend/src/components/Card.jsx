import styles from './Card.module.scss';

export default function Card({ title, subtitle, children, footer }) {
  return (
    <div className={styles.card}>
      {(title || subtitle) && (
        <div className={styles.card__header}>
          <div>
            {title && <h3 className={styles.card__title}>{title}</h3>}
            {subtitle && <p className={styles.card__subtitle}>{subtitle}</p>}
          </div>
        </div>
      )}
      {children && <div className={styles.card__body}>{children}</div>}
      {footer && <div className={styles.card__footer}>{footer}</div>}
    </div>
  );
}
