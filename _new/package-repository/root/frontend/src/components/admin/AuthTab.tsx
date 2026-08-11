import type { AuthScope, AuthPolicy } from '../../types/admin';

/** Props for AuthTab. */
interface AuthTabProps {
  scopes: AuthScope[]; policies: AuthPolicy[]; styles: Record<string, string>;
}

/** Auth & Policies tab showing scopes and policies. */
export default function AuthTab({ scopes, policies, styles }: AuthTabProps) {
  const btnCls = `${styles.button} ${styles['button--primary']} ${styles['button--small']}`;
  const editCls = `${styles.button} ${styles['button--secondary']} ${styles['button--small']}`;

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.section__title}>
          Scopes <button className={btnCls}>+ Add Scope</button>
        </h2>
        <div className={styles.section__content}>
          {scopes.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>Scope</th><th>Actions</th><th style={{ width: '120px' }}>Actions</th></tr></thead>
              <tbody>{scopes.map((s) => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td>
                  <td>{(JSON.parse(s.actions ?? '[]') as string[]).join(', ')}</td>
                  <td><button className={editCls}>Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          ) : (
            <div className={styles.empty}>
              <div className={styles.empty__icon}>{'\uD83D\uDD10'}</div>
              <p>No auth scopes defined</p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.section__title}>
          Policies <button className={btnCls}>+ Add Policy</button>
        </h2>
        <div className={styles.section__content}>
          {policies.length > 0 ? policies.map((p) => (
            <div key={p.name} className={styles.entityCard}>
              <div className={styles.entityCard__header}>
                <div>
                  <div className={styles.entityCard__name}>{p.name}</div>
                  <div className={styles.entityCard__details}>Effect: {p.effect}</div>
                </div>
                <div className={styles.entityCard__actions}>
                  <button className={editCls}>Edit</button>
                  <button className={editCls}>Delete</button>
                </div>
              </div>
              <div className={styles.codeBlock}>
                <pre>{JSON.stringify({
                  conditions: JSON.parse(p.conditions ?? '{}'),
                  requirements: JSON.parse(p.requirements ?? '{}'),
                }, null, 2)}</pre>
              </div>
            </div>
          )) : (
            <div className={styles.empty}>
              <div className={styles.empty__icon}>{'\uD83D\uDCDC'}</div>
              <p>No policies defined</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
