import type { PackageInfo } from '../types/package';
import pkgTypes from '../constants/package-types.json';
import { inferType } from '../utils/inferType';

/** Props for PackageCard. */
interface PackageCardProps {
  pkg: PackageInfo;
  styles: Record<string, string>;
  onDownload: () => void;
  onDetails: () => void;
}

/** Single package card in the browse list. */
export default function PackageCard({
  pkg, styles, onDownload, onDetails,
}: PackageCardProps) {
  const btnPri = `${styles.button} `
    + `${styles['button--primary']} `
    + `${styles['button--small']}`;
  const btnSec = `${styles.button} `
    + `${styles['button--secondary']} `
    + `${styles['button--small']}`;
  const typeId = inferType(pkg.type, pkg.namespace);
  const typeInfo = pkgTypes.find((t) => t.id === typeId);

  return (
    <div className={styles.package} data-testid="package-card">
      <div className={styles.package__info}>
        <div className={styles.package__namespace}>
          {pkg.namespace}
        </div>
        <div className={styles.package__name}>{pkg.name}</div>
        <span className={styles.package__version}>
          v{pkg.version}
        </span>
        {typeInfo && (
          <span
            className={styles.package__type}
            style={{ background: typeInfo.color }}
            title={typeInfo.desc}
          >
            {typeInfo.label}
          </span>
        )}
      </div>
      <div className={styles.package__actions}>
        <button className={btnPri} onClick={onDownload}>
          Download
        </button>
        <button className={btnSec} onClick={onDetails}>
          Details
        </button>
      </div>
    </div>
  );
}
