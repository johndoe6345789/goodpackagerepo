'use client';

import type { PackageInfo } from '../types/package';
import pkgTypes from '../constants/package-types.json';
import { inferType } from '../utils/inferType';
import styles from './TypeSidebar.module.scss';

/** Props for TypeSidebar. */
interface TypeSidebarProps {
  packages: PackageInfo[];
  selected: string;
  onSelect: (type: string) => void;
}

/** Count packages per type. */
function countByType(packages: PackageInfo[]) {
  const map: Record<string, number> = {};
  for (const p of packages) {
    const t = inferType(p.type, p.namespace);
    map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

/** Left sidebar listing package type categories. */
export default function TypeSidebar({
  packages, selected, onSelect,
}: TypeSidebarProps) {
  const counts = countByType(packages);
  const total = packages.length;

  return (
    <nav className={styles.sidebar}
      aria-label="Package types"
      data-testid="type-sidebar">
      <button
        className={`${styles.item} ${!selected ? styles.active : ''}`}
        onClick={() => onSelect('')}
      >
        <span className={styles.label}>All Packages</span>
        <span className={styles.count}>{total}</span>
      </button>
      <div className={styles.divider} />
      {pkgTypes.map((t) => (
        <button key={t.id}
          className={`${styles.item} ${selected === t.id ? styles.active : ''}`}
          onClick={() => onSelect(t.id)}
          title={t.desc}
        >
          <span className={styles.dot}
            style={{ background: t.color }} />
          <span className={styles.label}>{t.label}</span>
          <span className={styles.count}>
            {counts[t.id] ?? 0}
          </span>
        </button>
      ))}
    </nav>
  );
}
