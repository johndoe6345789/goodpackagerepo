'use client';

import type { UsePublishResult } from '../hooks/usePublish';
import pkgTypes from '../constants/package-types.json';

/** Props for PublishForm. */
interface PublishFormProps {
  publish: UsePublishResult;
  styles: Record<string, string>;
}

/** Field configuration for text inputs. */
interface FieldCfg {
  id: string; label: string;
  pattern: string; help: string;
}

const FIELDS: readonly FieldCfg[] = [
  { id: 'namespace', label: 'Namespace *',
    pattern: '[a-z0-9][a-z0-9._-]{0,127}',
    help: 'Lowercase, numbers, dots, dashes' },
  { id: 'name', label: 'Package Name *',
    pattern: '[a-z0-9][a-z0-9._-]{0,127}',
    help: 'Lowercase, numbers, dots, dashes' },
  { id: 'version', label: 'Version *',
    pattern: '[A-Za-z0-9][A-Za-z0-9._+-]{0,127}',
    help: 'Semantic version (e.g., 1.0.0)' },
  { id: 'variant', label: 'Variant *',
    pattern: '[a-z0-9][a-z0-9._-]{0,127}',
    help: 'Platform/arch (e.g., linux-amd64)' },
];

/** Package publish form with type selector. */
export default function PublishForm(
  { publish, styles }: PublishFormProps,
) {
  const { formData, handleChange, handleFileChange } = publish;
  const btnPri = `${styles.button} ${styles['button--primary']}`;
  const btnSec = `${styles.button} ${styles['button--secondary']}`;

  return (
    <form className={styles.form}
      onSubmit={publish.handleSubmit}
      data-testid="publish-form">
      <div className={styles.form__group}>
        <label className={styles.form__label} htmlFor="type">
          Package Type *
        </label>
        <select id="type" name="type"
          className={styles.form__input}
          value={formData.type} onChange={handleChange}
          required aria-label="Package Type">
          {pkgTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} — {t.desc}
            </option>
          ))}
        </select>
      </div>
      {FIELDS.map((f) => (
        <div key={f.id} className={styles.form__group}>
          <label className={styles.form__label}
            htmlFor={f.id}>{f.label}</label>
          <input type="text" id={f.id} name={f.id}
            className={styles.form__input}
            value={formData[f.id as keyof typeof formData] as string}
            onChange={handleChange} required
            pattern={f.pattern} aria-label={f.label} />
          <p className={styles.form__help}>{f.help}</p>
        </div>
      ))}
      <div className={styles.form__group}>
        <label className={styles.form__label} htmlFor="file">
          Package File *
        </label>
        <input type="file" id="file" name="file"
          className={styles.fileInput}
          onChange={handleFileChange} required
          aria-label="Package file" />
      </div>
      <div className={styles.form__actions}>
        <button type="button" className={btnSec}
          onClick={publish.resetForm}>Reset</button>
        <button type="submit" className={btnPri}
          data-testid="publish-submit">
          Publish Package
        </button>
      </div>
    </form>
  );
}
