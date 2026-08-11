'use client';

import { useState, useMemo, useCallback } from 'react';

/** Return type for the usePagination hook. */
export interface UsePaginationResult<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  setPage: (p: number) => void;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

/** Default items per page. */
const PER_PAGE = 25;

/**
 * Generic pagination hook.
 * @param items - Full list of items.
 * @param perPage - Items per page.
 */
export default function usePagination<T>(
  items: T[],
  perPage = PER_PAGE,
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / perPage)),
    [items.length, perPage],
  );

  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const goFirst = useCallback(() => setPage(1), []);
  const goPrev = useCallback(
    () => setPage((p) => Math.max(1, p - 1)), [],
  );
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );
  const goLast = useCallback(
    () => setPage(totalPages), [totalPages],
  );

  return {
    page: safePage, totalPages, pageItems,
    setPage, goFirst, goPrev, goNext, goLast,
  };
}
