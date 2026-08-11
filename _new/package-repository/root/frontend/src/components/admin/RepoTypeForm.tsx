'use client';

import { useState } from 'react';
import type { RepoType } from '../../types/admin';

/** Props for RepoTypeForm. */
interface RepoTypeFormProps {
  initial?: RepoType;
  onSave: (t: RepoType) => void;
  onCancel: () => void;
  styles: Record<string, string>;
}

/** Form for creating or editing a repo type. */
export default function RepoTypeForm({
  initial, onSave, onCancel, styles,
}: RepoTypeFormProps) {
  const [id, setId] = useState(initial?.id ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [color, setColor] = useState(initial?.color ?? '#607D8B');
  const [install, setInstall] = useState(
    initial?.install ?? '```\nmanager repo pull {ns}/{name}@{version}\n```',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !label.trim()) return;
    onSave({
      id: id.trim(), label: label.trim(),
      desc, color, install,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.entityCard}
      data-testid="repo-type-form">
      <div className={styles.grid}>
        <div>
          <label htmlFor="rt-id">ID (slug)</label>
          <input id="rt-id" value={id} disabled={!!initial}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. conda" required
            className={styles.input} />
        </div>
        <div>
          <label htmlFor="rt-label">Label</label>
          <input id="rt-label" value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. conda" required
            className={styles.input} />
        </div>
        <div>
          <label htmlFor="rt-color">Color</label>
          <input id="rt-color" type="color" value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.input} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label htmlFor="rt-desc">Description</label>
        <input id="rt-desc" value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Conda packages for data science"
          className={styles.input} style={{ width: '100%' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label htmlFor="rt-install">
          Install instructions ({'{ns}'}, {'{name}'}, {'{version}'})
        </label>
        <textarea id="rt-install" value={install}
          onChange={(e) => setInstall(e.target.value)}
          rows={4} className={styles.input}
          placeholder="```&#10;pip install {name}=={version}&#10;```"
          style={{ width: '100%', fontFamily: 'monospace' }} />
      </div>
      <div className={styles.entityCard__actions}
        style={{ marginTop: 12 }}>
        <button type="submit"
          className={`${styles.button} ${styles['button--primary']}`}>
          {initial ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel}
          className={`${styles.button} ${styles['button--secondary']}`}>
          Cancel
        </button>
      </div>
    </form>
  );
}
