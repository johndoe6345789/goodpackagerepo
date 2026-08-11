import type { AdminConfig } from '../../types/admin';

/** Props for OverviewTab. */
interface OverviewTabProps { config: AdminConfig; styles: Record<string, string>; }

const parseJson = (s?: string): string[] => JSON.parse(s ?? '[]') as string[];

/** Overview tab showing repo info and capabilities. */
export default function OverviewTab({ config, styles }: OverviewTabProps) {
  const stats = [
    { icon: '\uD83D\uDCCB', label: 'Schema Version', value: config.schema_version ?? 'N/A' },
    { icon: '\uD83D\uDD27', label: 'Type ID', value: config.type_id ?? 'N/A', small: true },
    { icon: '\uD83D\uDEE3\uFE0F', label: 'API Routes', value: config.api_routes?.length ?? 0 },
    { icon: '\uD83D\uDCE6', label: 'Entities', value: config.entities?.length ?? 0 },
    { icon: '\uD83D\uDCBE', label: 'Blob Stores', value: config.blob_stores?.length ?? 0 },
    { icon: '\uD83D\uDD10', label: 'Auth Scopes', value: config.auth_scopes?.length ?? 0 },
  ];

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.section__title}>Repository Information</h2>
        <div className={styles.section__content}>
          <div className={styles.grid}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.stat__icon}>{s.icon}</div>
                <div className={styles.stat__info}>
                  <div className={styles.stat__label}>{s.label}</div>
                  <div className={styles.stat__value}
                    style={s.small ? { fontSize: '14px' } : undefined}>
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '24px', color: '#666' }}>{config.description}</p>
        </div>
      </div>
      {config.capabilities && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>Capabilities</h2>
          <div className={styles.section__content}>
            {(['protocols', 'storage'] as const).map((key) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                {parseJson(config.capabilities?.[key]).map((v) => (
                  <span key={v} className={`${styles.badge} ${styles['badge--primary']}`}>
                    {v}
                  </span>
                ))}
              </div>
            ))}
            <div>
              <strong>Features:</strong>{' '}
              {parseJson(config.capabilities?.features).map((f) => (
                <span key={f} className={`${styles.badge} ${styles['badge--success']}`}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
