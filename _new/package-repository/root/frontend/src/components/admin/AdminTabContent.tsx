'use client';

import type { AdminConfig, AdminTab } from '../../types/admin';
import type { UseRepoTypesResult } from '../../hooks/useRepoTypes';
import OverviewTab from './OverviewTab';
import EntitiesTab from './EntitiesTab';
import StorageTab from './StorageTab';
import RoutesTab from './RoutesTab';
import AuthTab from './AuthTab';
import FeaturesTab from './FeaturesTab';
import RepoTypesTab from './RepoTypesTab';
import RawTab from './RawTab';

/** Props for AdminTabContent. */
interface AdminTabContentProps {
  activeTab: AdminTab;
  config: AdminConfig;
  rt: UseRepoTypesResult;
  expandedRoute: number | null;
  setExpandedRoute: (idx: number | null) => void;
  styles: Record<string, string>;
}

/** Renders the active admin tab content. */
export default function AdminTabContent({
  activeTab, config, rt,
  expandedRoute, setExpandedRoute, styles,
}: AdminTabContentProps) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab config={config} styles={styles} />;
    case 'entities':
      return <EntitiesTab entities={config.entities ?? []} styles={styles} />;
    case 'storage':
      return <StorageTab blobStores={config.blob_stores ?? []}
        kvStores={config.kv_stores ?? []} styles={styles} />;
    case 'routes':
      return <RoutesTab routes={config.api_routes ?? []}
        expandedRoute={expandedRoute}
        setExpandedRoute={setExpandedRoute} styles={styles} />;
    case 'auth':
      return <AuthTab scopes={config.auth_scopes ?? []}
        policies={config.auth_policies ?? []} styles={styles} />;
    case 'features':
      return <FeaturesTab features={config.features}
        caching={config.caching} styles={styles} />;
    case 'repo-types':
      return <RepoTypesTab types={rt.allTypes} editing={rt.editing}
        onEdit={rt.setEditing} onAdd={rt.addType}
        onUpdate={rt.updateType} onDelete={rt.deleteType}
        onToggle={rt.toggleEnabled} onImport={rt.importTypes}
        styles={styles} />;
    case 'raw':
      return <RawTab config={config} styles={styles} />;
    default:
      return null;
  }
}
