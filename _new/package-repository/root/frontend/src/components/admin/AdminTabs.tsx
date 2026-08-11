import type { AdminTab } from '../../types/admin';

/** Props for AdminTabs. */
interface AdminTabsProps {
  /** Currently active tab. */
  activeTab: AdminTab;
  /** Callback to change the active tab. */
  setActiveTab: (tab: AdminTab) => void;
  /** SCSS module styles. */
  styles: Record<string, string>;
}

/** Tab configuration. */
interface TabConfig {
  id: AdminTab;
  label: string;
}

const TABS: readonly TabConfig[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'entities', label: 'Entities' },
  { id: 'storage', label: 'Storage' },
  { id: 'routes', label: 'API Routes' },
  { id: 'auth', label: 'Auth & Policies' },
  { id: 'features', label: 'Features' },
  { id: 'repo-types', label: 'System Packages' },
  { id: 'raw', label: 'Raw Data' },
];

/**
 * Tab navigation bar for the admin panel.
 * @param props - Component props.
 * @returns The tab bar JSX.
 */
export default function AdminTabs({
  activeTab,
  setActiveTab,
  styles,
}: AdminTabsProps) {
  return (
    <div
      className={styles.tabs}
      data-testid="admin-tabs"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={
            `${styles.tabs__tab}`
            + (activeTab === tab.id
              ? ` ${styles['tabs__tab--active']}`
              : '')
          }
          onClick={() => setActiveTab(tab.id)}
          aria-label={tab.label}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
