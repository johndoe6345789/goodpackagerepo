'use client';

import { useRef } from 'react';
import type { RepoType } from '../../types/admin';
import { exportTypesPackage, readTypesFile } from '../../utils/packageExport';
import RepoTypeForm from './RepoTypeForm';
import RepoTypeRow from './RepoTypeRow';

/** Props for RepoTypesTab. */
interface RepoTypesTabProps {
  types: RepoType[];
  editing: RepoType | null;
  onEdit: (t: RepoType | null) => void;
  onAdd: (t: RepoType) => void;
  onUpdate: (id: string, t: RepoType) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onImport: (types: RepoType[]) => void;
  styles: Record<string, string>;
}

/** Admin tab for managing repo types. */
export default function RepoTypesTab({
  types, editing, onEdit, onAdd, onUpdate,
  onDelete, onToggle, onImport, styles,
}: RepoTypesTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const showForm = editing !== null;
  const installed = types.filter((t) => t.enabled).length;
  const btn2 = `${styles.button} ${styles['button--secondary']}`;

  return (
    <div data-testid="repo-types-tab">
      <div className={styles.section}>
        <div className={styles.section__title}>
          <span>Package Types ({installed}/{types.length} installed)</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={btn2} onClick={() => exportTypesPackage(types)}>
              Save as Package</button>
            <button className={btn2} onClick={() => fileRef.current?.click()}>
              Import Package</button>
            <input ref={fileRef} type="file" accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readTypesFile(f, onImport);
              }} />
            {!showForm && (
              <button className={`${styles.button} ${styles['button--primary']}`}
                onClick={() => onEdit({ id: '', label: '', desc: '', color: '#607D8B' })}>
                + New Type</button>
            )}
          </div>
        </div>
        {showForm && (
          <RepoTypeForm initial={editing?.id ? editing : undefined} styles={styles}
            onSave={(t) => { if (editing?.id) onUpdate(editing.id, t); else onAdd(t); onEdit(null); }}
            onCancel={() => onEdit(null)} />
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead><tr>
              <th>Status</th><th>ID</th><th>Label</th>
              <th>Description</th><th>Color</th><th>Source</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {types.map((t) => (
                <RepoTypeRow key={t.id} type={t} onToggle={onToggle}
                  onEdit={onEdit} onDelete={onDelete} styles={styles} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
