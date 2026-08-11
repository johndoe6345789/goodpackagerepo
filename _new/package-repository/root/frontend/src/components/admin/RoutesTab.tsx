import type { ApiRoute } from '../../types/admin';
import PipelineView from './PipelineView';

/** Props for RoutesTab. */
interface RoutesTabProps {
  routes: ApiRoute[]; expandedRoute: number | null;
  setExpandedRoute: (idx: number | null) => void;
  styles: Record<string, string>;
}

/** API Routes tab showing route definitions. */
export default function RoutesTab({
  routes, expandedRoute, setExpandedRoute, styles,
}: RoutesTabProps) {
  const btnCls = `${styles.button} ${styles['button--primary']} ${styles['button--small']}`;
  const secCls = `${styles.button} ${styles['button--secondary']} ${styles['button--small']}`;

  return (
    <div className={styles.section}>
      <h2 className={styles.section__title}>
        API Routes <button className={btnCls}>+ Add Route</button>
      </h2>
      <div className={styles.section__content}>
        {routes.length > 0 ? routes.map((route, i) => {
          const pipeline = JSON.parse(route.pipeline ?? '[]') as Array<{ op: string }>;
          const tags = JSON.parse(route.tags ?? '[]') as string[];
          const isExp = expandedRoute === i;
          return (
            <div key={route.route_id} className={styles.entityCard}
              style={{ marginBottom: '16px' }}>
              <div className={styles.entityCard__header}>
                <div style={{ flex: 1 }}>
                  <div className={styles.entityCard__name}>{route.route_id}</div>
                  <div className={styles.entityCard__details}>
                    <span className={`${styles.badge} ${styles['badge--primary']}`}>
                      {route.method}
                    </span>{' '}<code>{route.path}</code>{' \u2022 '}
                    {tags.map((t) => (
                      <span key={t} className={`${styles.badge} ${styles['badge--success']}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.entityCard__actions}>
                  <button className={secCls}
                    onClick={() => setExpandedRoute(isExp ? null : i)}>
                    {isExp ? '\u25BC Hide' : '\u25B6 View'}
                    {` Pipeline (${pipeline.length} steps)`}
                  </button>
                  <button className={secCls}>Edit</button>
                </div>
              </div>
              {isExp && pipeline.length > 0 && (
                <PipelineView pipeline={pipeline} styles={styles} />
              )}
            </div>
          );
        }) : (
          <div className={styles.empty}>
            <div className={styles.empty__icon}>{'\uD83D\uDEE3\uFE0F'}</div>
            <p>No API routes defined</p>
          </div>
        )}
      </div>
    </div>
  );
}
