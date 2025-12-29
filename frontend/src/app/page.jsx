import Link from 'next/link';
import styles from './page.module.scss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.hero__title}>Welcome to Good Package Repo</h1>
        <p className={styles.hero__subtitle}>
          The world's first truly good package repository
        </p>
        <div className={styles.hero__actions}>
          <Link href="/browse" className={`${styles.button} ${styles['button--primary']}`}>
            Browse Packages
          </Link>
          <Link href="/docs" className={`${styles.button} ${styles['button--secondary']}`}>
            Read Docs
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.feature__icon}>🔒</div>
          <h3 className={styles.feature__title}>Secure by Design</h3>
          <p className={styles.feature__description}>
            Content-addressed storage with SHA256 verification on every upload
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.feature__icon}>⚡</div>
          <h3 className={styles.feature__title}>Lightning Fast</h3>
          <p className={styles.feature__description}>
            Built-in caching and intelligent indexing for rapid package retrieval
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.feature__icon}>📋</div>
          <h3 className={styles.feature__title}>Schema-Driven</h3>
          <p className={styles.feature__description}>
            Declarative repository configuration with automatic validation
          </p>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.stat__value}>100%</div>
          <div className={styles.stat__label}>Uptime</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.stat__value}>0</div>
          <div className={styles.stat__label}>Security Issues</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.stat__value}>∞</div>
          <div className={styles.stat__label}>Scalability</div>
        </div>
      </section>

      <section className={styles.code}>
        <pre><code>{`# Install a package
curl -H "Authorization: Bearer $TOKEN" \\
  https://repo.example.com/v1/acme/myapp/1.0.0/linux-amd64/blob \\
  -o myapp.tar.gz

# Publish a package
curl -X PUT \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @myapp.tar.gz \\
  https://repo.example.com/v1/acme/myapp/1.0.0/linux-amd64/blob`}</code></pre>
      </section>
    </div>
  );
}
