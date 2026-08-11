'use client';

import styles from './Pager.module.scss';

/** Props for Pager. */
interface PagerProps {
  page: number;
  totalPages: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onPage: (p: number) => void;
}

/** Build visible page number array with ellipses. */
function pageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

/** Pagination controls with page numbers. */
export default function Pager({
  page, totalPages, onFirst, onPrev, onNext, onLast, onPage,
}: PagerProps) {
  if (totalPages <= 1) return null;
  const pages = pageRange(page, totalPages);

  return (
    <nav className={styles.pager} aria-label="Pagination"
      data-testid="pager">
      <button className={styles.btn} onClick={onFirst}
        disabled={page === 1} aria-label="First page">
        &#x21E4;
      </button>
      <button className={styles.btn} onClick={onPrev}
        disabled={page === 1} aria-label="Previous page">
        &#x2190;
      </button>
      {pages.map((p, i) => (
        p === '...'
          ? <span key={`e${i}`} className={styles.dots}>…</span>
          : <button key={p}
              className={`${styles.num} ${p === page ? styles.active : ''}`}
              onClick={() => onPage(p)} aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}>
              {p}
            </button>
      ))}
      <button className={styles.btn} onClick={onNext}
        disabled={page === totalPages} aria-label="Next page">
        &#x2192;
      </button>
      <button className={styles.btn} onClick={onLast}
        disabled={page === totalPages} aria-label="Last page">
        &#x21E5;
      </button>
    </nav>
  );
}
