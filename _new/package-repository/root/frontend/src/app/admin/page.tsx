'use client';

import styles from './page.module.scss';
import useAdmin from '../../hooks/useAdmin';
import useRepoTypes from '../../hooks/useRepoTypes';
import AdminTabs from '../../components/admin/AdminTabs';
import AdminTabContent from '../../components/admin/AdminTabContent';

/** Admin panel page for repository management. */
export default function AdminPage() {
  const {
    config, activeTab, loading, user, usingSeed,
    expandedRoute, setActiveTab, setExpandedRoute,
  } = useAdmin();
  const rt = useRepoTypes();

  if (loading || !user || !config) {
    return (
      <div className={styles.loading}>
        Loading admin panel...
      </div>
    );
  }

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify(config, null, 2)],
      { type: 'application/json' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'repo-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const btnCls =
    `${styles.button} ${styles['button--secondary']}`;

  return (
    <div className={styles.container}
      data-testid="admin-page">
      <div className={styles.header}>
        <div>
          <h1>Admin Panel</h1>
          <p>Repository configuration and management</p>
        </div>
        <div className={styles.header__actions}>
          <button className={btnCls}
            onClick={handleExport}
            aria-label="Export configuration">
            Export Config
          </button>
        </div>
      </div>
      <div className={styles.alert} style={{
        background: usingSeed
          ? 'rgba(255,152,0,.1)' : 'rgba(33,150,243,.1)',
        borderLeft: usingSeed
          ? '4px solid #ff9800' : '4px solid #2196f3',
      }}>
        {usingSeed
          ? <><strong>Demo Mode:</strong> Showing sample
              data. Connect the backend for live config.</>
          : <><strong>Info:</strong> Configuration loaded
              from PostgreSQL.</>}
      </div>
      <AdminTabs activeTab={activeTab}
        setActiveTab={setActiveTab} styles={styles} />
      <AdminTabContent
        activeTab={activeTab} config={config} rt={rt}
        expandedRoute={expandedRoute}
        setExpandedRoute={setExpandedRoute}
        styles={styles}
      />
    </div>
  );
}
