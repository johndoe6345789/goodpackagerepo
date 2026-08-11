import type { Entity } from '../../types/admin';

/** Props for EntityCard. */
interface EntityCardProps { entity: Entity; styles: Record<string, string>; }

/** Single entity card with fields and constraints tables. */
export default function EntityCard({ entity: e, styles }: EntityCardProps) {
  const editCls = `${styles.button} ${styles['button--secondary']} ${styles['button--small']}`;

  return (
    <div className={styles.entityCard}>
      <div className={styles.entityCard__header}>
        <div>
          <div className={styles.entityCard__name}>{e.name}</div>
          <div className={styles.entityCard__details}>
            Type: {e.type} {'\u2022'} Fields: {e.fields?.length ?? 0}
            {' \u2022 '}Constraints: {e.constraints?.length ?? 0}
          </div>
        </div>
        <div className={styles.entityCard__actions}>
          <button className={editCls}>Edit</button>
          <button className={editCls}>Delete</button>
        </div>
      </div>
      {e.fields && e.fields.length > 0 && (
        <>
          <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Fields</h4>
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Type</th><th>Optional</th><th>Normalizations</th></tr></thead>
            <tbody>
              {e.fields.map((f) => (
                <tr key={f.name}>
                  <td><strong>{f.name}</strong></td>
                  <td>{f.type}</td>
                  <td>{f.optional ? '\u2713' : '\u2717'}</td>
                  <td>{(JSON.parse(f.normalizations ?? '[]') as string[]).join(', ') || 'none'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {e.constraints && e.constraints.length > 0 && (
        <>
          <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Constraints</h4>
          <table className={styles.table}>
            <thead><tr><th>Field</th><th>Pattern</th><th>When Present</th></tr></thead>
            <tbody>
              {e.constraints.map((c) => (
                <tr key={c.field}>
                  <td><strong>{c.field}</strong></td>
                  <td><code>{c.regex}</code></td>
                  <td>{c.when_present ? '\u2713' : '\u2717'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
