import type { Features, Caching } from '../../types/admin';

/** Props for FeaturesTab. */
interface FeaturesTabProps {
  features?: Features; caching?: Caching; styles: Record<string, string>;
}

const enabled = (v?: boolean) => v ? '\u2713 Enabled' : '\u2717 Disabled';

/** Features tab showing feature toggles and caching. */
export default function FeaturesTab({ features, caching, styles }: FeaturesTabProps) {
  const featureToggles = features ? [
    { label: 'Mutable Tags', value: features.mutable_tags },
    { label: 'Allow Overwrite', value: features.allow_overwrite_artifacts },
    { label: 'Proxy Enabled', value: features.proxy_enabled },
    { label: 'Garbage Collection', value: features.gc_enabled },
  ] : [];

  const gridStyle = { gridTemplateColumns: '1fr 1fr' };

  return (
    <div className={styles.section}>
      <h2 className={styles.section__title}>Features Configuration</h2>
      <div className={styles.section__content}>
        {features && (
          <div className={styles.grid} style={gridStyle}>
            {featureToggles.map((t) => (
              <div key={t.label} className={styles.stat}>
                <div className={styles.stat__info}>
                  <div className={styles.stat__label}>{t.label}</div>
                  <div className={styles.stat__value}>{enabled(t.value)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {caching && (
          <>
            <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Caching</h3>
            <div className={styles.grid} style={gridStyle}>
              <div className={styles.stat}><div className={styles.stat__info}>
                <div className={styles.stat__label}>Response Cache</div>
                <div className={styles.stat__value}>
                  {enabled(caching.response_cache_enabled)}</div>
              </div></div>
              <div className={styles.stat}><div className={styles.stat__info}>
                <div className={styles.stat__label}>Response Cache TTL</div>
                <div className={styles.stat__value}>{caching.response_cache_ttl}s</div>
              </div></div>
              <div className={styles.stat}><div className={styles.stat__info}>
                <div className={styles.stat__label}>Blob Cache</div>
                <div className={styles.stat__value}>
                  {enabled(caching.blob_cache_enabled)}</div>
              </div></div>
              <div className={styles.stat}><div className={styles.stat__info}>
                <div className={styles.stat__label}>Blob Cache Max</div>
                <div className={styles.stat__value}>{caching.blob_cache_max_bytes
                  ? `${(caching.blob_cache_max_bytes / 1024 / 1024 / 1024).toFixed(0)} GB`
                  : 'N/A'}</div>
              </div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
