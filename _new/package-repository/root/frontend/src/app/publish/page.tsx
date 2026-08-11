'use client';

import styles from './page.module.scss';
import usePublish from '../../hooks/usePublish';
import PublishForm from '../../components/PublishForm';

/**
 * Publish page for uploading new packages.
 * @returns The publish page content.
 */
export default function PublishPage() {
  const publish = usePublish();
  const { status } = publish;

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  if (!token) {
    return (
      <div
        className={styles.container}
        data-testid="publish-page"
      >
        <div className={styles.header}>
          <h1>Publish Package</h1>
          <p>You must be logged in to publish.</p>
        </div>
        <div className={styles.form__actions}>
          <a
            href="/login"
            className={
              `${styles.button}`
              + ` ${styles['button--primary']}`
            }
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      data-testid="publish-page"
    >
      <div className={styles.header}>
        <h1>Publish Package</h1>
        <p>Upload a new package to the repository</p>
      </div>

      {status.type === 'success' && (
        <div className={styles.success}>
          <strong>Success!</strong> {status.message}
        </div>
      )}

      {status.type === 'error' && (
        <div className={styles.error}>
          <strong>Error:</strong> {status.message}
        </div>
      )}

      <PublishForm publish={publish} styles={styles} />
    </div>
  );
}
