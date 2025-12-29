'use client';

import { useState } from 'react';
import styles from './page.module.scss';

export default function BrowsePage() {
  const [packages] = useState([
    {
      namespace: 'acme',
      name: 'example-package',
      version: '1.0.0',
      variant: 'linux-amd64'
    },
    {
      namespace: 'acme',
      name: 'another-package',
      version: '2.1.0',
      variant: 'linux-amd64'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Browse Packages</h1>
        <p>Explore available packages in the repository</p>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          className={styles.search__input}
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.packages}>
        {filteredPackages.length > 0 ? (
          filteredPackages.map((pkg, idx) => (
            <div key={idx} className={styles.package}>
              <div className={styles.package__info}>
                <div className={styles.package__namespace}>{pkg.namespace}</div>
                <div className={styles.package__name}>{pkg.name}</div>
                <span className={styles.package__version}>v{pkg.version}</span>
              </div>
              <div className={styles.package__actions}>
                <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
                  Download
                </button>
                <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                  Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>
            <p>No packages found</p>
          </div>
        )}
      </div>
    </div>
  );
}
