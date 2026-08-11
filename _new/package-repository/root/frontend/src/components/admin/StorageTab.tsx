import type { BlobStore, KvStore } from '../../types/admin';

/** Props for StorageTab. */
interface StorageTabProps {
  blobStores: BlobStore[]; kvStores: KvStore[]; styles: Record<string, string>;
}

/** Storage tab showing blob and KV store configs. */
export default function StorageTab({ blobStores, kvStores, styles }: StorageTabProps) {
  const btnCls = `${styles.button} ${styles['button--primary']} ${styles['button--small']}`;
  const editCls = `${styles.button} ${styles['button--secondary']} ${styles['button--small']}`;

  return (
    <>
      <div className={styles.section}>
        <h2 className={styles.section__title}>
          Blob Stores <button className={btnCls}>+ Add Store</button>
        </h2>
        <div className={styles.section__content}>
          {blobStores.length > 0 ? (
            <table className={styles.table}>
              <thead><tr>
                <th>Name</th><th>Kind</th><th>Root</th>
                <th>Addressing</th><th>Max Size</th><th>Actions</th>
              </tr></thead>
              <tbody>{blobStores.map((s) => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td><td>{s.kind}</td>
                  <td><code>{s.root}</code></td><td>{s.addressing_mode}</td>
                  <td>{s.max_blob_bytes
                    ? `${(s.max_blob_bytes / 1024 / 1024).toFixed(0)} MB` : 'N/A'}</td>
                  <td><button className={editCls}>Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          ) : (
            <div className={styles.empty}>
              <div className={styles.empty__icon}>{'\uD83D\uDCBE'}</div>
              <p>No blob stores defined</p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.section__title}>
          KV Stores <button className={btnCls}>+ Add Store</button>
        </h2>
        <div className={styles.section__content}>
          {kvStores.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Kind</th><th>Root</th><th>Actions</th></tr></thead>
              <tbody>{kvStores.map((s) => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td><td>{s.kind}</td>
                  <td><code>{s.root}</code></td>
                  <td><button className={editCls}>Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          ) : (
            <div className={styles.empty}>
              <div className={styles.empty__icon}>{'\uD83D\uDDC4\uFE0F'}</div>
              <p>No KV stores defined</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
