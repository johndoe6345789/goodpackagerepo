'use client';

import type { PackageInfo } from '../types/package';
import pkgTypes from '../constants/package-types.json';
import { inferType } from '../utils/inferType';
import styles from './PackageTable.module.scss';

/** Props for PackageTable. */
interface PackageTableProps {
  packages: PackageInfo[];
  selected: PackageInfo | null;
  onSelect: (pkg: PackageInfo) => void;
}

/** Look up type info. */
function typeInfo(pkg: PackageInfo) {
  const id = inferType(pkg.type, pkg.namespace);
  return pkgTypes.find((t) => t.id === id);
}

/** Sortable package list table. */
export default function PackageTable({
  packages, selected, onSelect,
}: PackageTableProps) {
  return (
    <div className={styles.wrap} data-testid="package-table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Package</th>
            <th className={styles.th}>Namespace</th>
            <th className={styles.th}>Version</th>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Variant</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const key = `${pkg.namespace}/${pkg.name}/${pkg.version}`;
            const sel = selected;
            const isActive = sel
              && `${sel.namespace}/${sel.name}/${sel.version}` === key;
            const ti = typeInfo(pkg);
            return (
              <tr key={key}
                className={`${styles.row} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect(pkg)}
                data-testid="package-row">
                <td className={styles.name}>{pkg.name}</td>
                <td className={styles.td}>{pkg.namespace}</td>
                <td className={styles.ver}>{pkg.version}</td>
                <td className={styles.td}>
                  {ti && (
                    <span className={styles.badge}
                      style={{ background: `${ti.color}14`, color: ti.color }}>
                      {ti.label}
                    </span>
                  )}
                </td>
                <td className={styles.dim}>{pkg.variant}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {packages.length === 0 && (
        <p className={styles.empty}>No packages found</p>
      )}
    </div>
  );
}
