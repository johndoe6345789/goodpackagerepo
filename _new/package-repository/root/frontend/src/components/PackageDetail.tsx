'use client';

import type { PackageInfo } from '../types/package';
import pkgTypes from '../constants/package-types.json';
import { inferType } from '../utils/inferType';
import { expandInstall } from '../utils/expandInstall';
import { formatBytes } from '../utils/formatBytes';
import { getDisplayApiUrl } from '../utils/api';
import styles from './PackageDetail.module.scss';

/** Props for PackageDetail. */
interface PackageDetailProps {
  pkg: PackageInfo | null;
  error?: string;
  onDownload: (pkg: PackageInfo) => void;
}

/** Bottom detail panel for the selected package. */
export default function PackageDetail({
  pkg, error, onDownload,
}: PackageDetailProps) {
  if (!pkg) {
    return (
      <div className={styles.panel} data-testid="pkg-detail">
        <p className={styles.hint}>
          Select a package to view details
        </p>
      </div>
    );
  }

  const typeId = inferType(pkg.type, pkg.namespace);
  const ti = pkgTypes.find((t) => t.id === typeId);
  const installText = ti?.install
    ? expandInstall(ti.install, {
      ns: pkg.namespace, name: pkg.name,
      version: pkg.version, variant: pkg.variant,
      host: getDisplayApiUrl(),
      hostBare: getDisplayApiUrl()
        .replace(/^https?:\/\//, ''),
    }) : `manager repo pull ${pkg.namespace}/${pkg.name}@${pkg.version}`;

  return (
    <div className={styles.panel} data-testid="pkg-detail">
      <div className={styles.header}>
        <h3 className={styles.title}>
          {pkg.namespace}/{pkg.name}
        </h3>
        <button className={styles.btn}
          onClick={() => onDownload(pkg)}
          aria-label="Download package">
          Download
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.meta}>
        <span className={styles.tag}>v{pkg.version}</span>
        {ti && (
          <span className={styles.tag}
            style={{ background: ti.color, color: '#fff' }}>
            {ti.label}
          </span>
        )}
        <span className={styles.tag}>{pkg.variant}</span>
      </div>
      <div className={styles.stats}>
        {pkg.blob_size != null && (
          <span>{formatBytes(pkg.blob_size)}</span>
        )}
        {pkg.download_count != null && (
          <span>{pkg.download_count} downloads</span>
        )}
        {pkg.blob_digest && (
          <span className={styles.digest}>
            {pkg.blob_digest.slice(0, 19)}
          </span>
        )}
      </div>
      <pre className={styles.pre}>
        <code className={styles.code}>{installText}</code>
      </pre>
    </div>
  );
}
