'use client';

import type { RepoType } from '../../types/admin';

/** Props for RepoTypeRow. */
interface RepoTypeRowProps {
  type: RepoType;
  onToggle: (id: string) => void;
  onEdit: (t: RepoType) => void;
  onDelete: (id: string) => void;
  styles: Record<string, string>;
}

/** Single table row for a repo type. */
export default function RepoTypeRow({
  type: t, onToggle, onEdit, onDelete, styles,
}: RepoTypeRowProps) {
  const statusCls = `${styles.badge} ${
    t.enabled ? styles['badge--success'] : styles['badge--warning']
  }`;
  const srcCls = `${styles.badge} ${
    t.builtin ? styles['badge--primary'] : styles['badge--success']
  }`;
  const btnCls = `${styles.button} ${styles['button--small']}`;

  return (
    <tr>
      <td>
        <span className={statusCls}>
          {t.enabled ? 'installed' : 'available'}
        </span>
      </td>
      <td><code>{t.id}</code></td>
      <td>{t.label}</td>
      <td>{t.desc}</td>
      <td>
        <span style={{
          display: 'inline-block', width: 16,
          height: 16, borderRadius: 3,
          background: t.color, verticalAlign: 'middle',
        }} /> {t.color}
      </td>
      <td>
        <span className={srcCls}>
          {t.builtin ? 'built-in' : 'custom'}
        </span>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <button className={btnCls}
          onClick={() => onToggle(t.id)}>
          {t.enabled ? 'Uninstall' : 'Install'}
        </button>
        {!t.builtin && (<>{' '}
          <button className={btnCls}
            onClick={() => onEdit(t)}>Edit</button>{' '}
          <button className={btnCls}
            onClick={() => onDelete(t.id)}>Delete</button>
        </>)}
      </td>
    </tr>
  );
}
