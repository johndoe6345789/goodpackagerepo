'use client';

import styles from './page.module.scss';
import useBrowse from '../../hooks/useBrowse';
import usePagination from '../../hooks/usePagination';
import TypeSidebar from '../../components/TypeSidebar';
import PackageTable from '../../components/PackageTable';
import PackageDetail from '../../components/PackageDetail';
import Pager from '../../components/Pager';

/** Synaptic-style package browser page. */
export default function BrowsePage() {
  const {
    searchTerm, typeFilter, loading, offline,
    all, filtered, selected,
    setSearchTerm, setTypeFilter,
    setSelected, actions,
  } = useBrowse();

  const {
    page, totalPages, pageItems,
    setPage, goFirst, goPrev, goNext, goLast,
  } = usePagination(filtered);

  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.toolbar}>
          <span>Loading packages...</span>
        </div>
      </div>
    );
  }

  if (offline) {
    return (
      <div className={styles.layout} data-testid="browse-page">
        <div className={styles.toolbar}>
          <span className={styles.offline}>
            Repository server is offline.
            Start with: <code>manager repo up</code>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout} data-testid="browse-page">
      <div className={styles.toolbar}>
        <input
          type="text" className={styles.search}
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search packages"
          data-testid="search-input"
        />
      </div>
      <div className={styles.sidebar}>
        <TypeSidebar
          packages={all}
          selected={typeFilter}
          onSelect={setTypeFilter}
        />
      </div>
      <div className={styles.main}>
        <PackageTable
          packages={pageItems}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
      <div className={styles.pager}>
        <Pager
          page={page} totalPages={totalPages}
          onFirst={goFirst} onPrev={goPrev}
          onNext={goNext} onLast={goLast}
          onPage={setPage}
        />
      </div>
      <div className={styles.detail}>
        <PackageDetail
          pkg={selected}
          error={actions.downloadError}
          onDownload={(p) =>
            void actions.handleDownload(p)}
        />
      </div>
      <div className={styles.status}>
        <span>{filtered.length} packages shown</span>
        <span>{all.length} total</span>
        {typeFilter && <span>Type: {typeFilter}</span>}
        {totalPages > 1 && (
          <span>Page {page}/{totalPages}</span>
        )}
      </div>
    </div>
  );
}
