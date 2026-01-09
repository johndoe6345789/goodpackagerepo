'use client';

import { useState } from 'react';
import styles from './page.module.scss';
import { getApiUrl } from '../../utils/api';

export default function PublishPage() {
  const [formData, setFormData] = useState({
    namespace: '',
    name: '',
    version: '',
    variant: '',
    file: null
  });
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    try {
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/v1/${formData.namespace}/${formData.name}/${formData.version}/${formData.variant}/blob`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` ,
        },
        body: formData.file
      });

      if (response.ok) {
        const result = await response.json();
        setStatus({
          type: 'success',
          message: `Package published successfully! Digest: ${result.digest}`
        });
        setFormData({
          namespace: '',
          name: '',
          version: '',
          variant: '',
          file: null
        });
      } else {
        const error = await response.json();
        setStatus({
          type: 'error',
          message: error.error?.message || 'Failed to publish package'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
  };

  // Require login
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Publish Package</h1>
          <p>You must be logged in to publish packages.</p>
        </div>
        <div className={styles.form__actions}>
          <a href="/login" className={`${styles.button} ${styles['button--primary']}`}>Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Publish Package</h1>
        <p>Upload a new package to the repository</p>
      </div>

      {status.type === 'success' && (
        <div className={styles.success}>
          <strong>Success!</strong> {status.message}
        </div>
      )}

      {status.type === 'error' && (
        <div className={styles.error}>
          <strong>Error:</strong> {status.message}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.form__group}>
          <label className={styles.form__label} htmlFor="namespace">
            Namespace *
          </label>
          <input
            type="text"
            id="namespace"
            name="namespace"
            className={styles.form__input}
            value={formData.namespace}
            onChange={handleChange}
            required
            pattern="[a-z0-9][a-z0-9._-]{0,127}"
          />
          <p className={styles.form__help}>
            Lowercase letters, numbers, dots, dashes (e.g., acme)
          </p>
        </div>

        <div className={styles.form__group}>
          <label className={styles.form__label} htmlFor="name">
            Package Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={styles.form__input}
            value={formData.name}
            onChange={handleChange}
            required
            pattern="[a-z0-9][a-z0-9._-]{0,127}"
          />
          <p className={styles.form__help}>
            Lowercase letters, numbers, dots, dashes (e.g., my-package)
          </p>
        </div>

        <div className={styles.form__group}>
          <label className={styles.form__label} htmlFor="version">
            Version *
          </label>
          <input
            type="text"
            id="version"
            name="version"
            className={styles.form__input}
            value={formData.version}
            onChange={handleChange}
            required
            pattern="[A-Za-z0-9][A-Za-z0-9._+-]{0,127}"
          />
          <p className={styles.form__help}>
            Semantic version (e.g., 1.0.0)
          </p>
        </div>

        <div className={styles.form__group}>
          <label className={styles.form__label} htmlFor="variant">
            Variant *
          </label>
          <input
            type="text"
            id="variant"
            name="variant"
            className={styles.form__input}
            value={formData.variant}
            onChange={handleChange}
            required
            pattern="[a-z0-9][a-z0-9._-]{0,127}"
          />
          <p className={styles.form__help}>
            Platform/architecture (e.g., linux-amd64)
          </p>
        </div>

        <div className={styles.form__group}>
          <label className={styles.form__label} htmlFor="file">
            Package File *
          </label>
          <input
            type="file"
            id="file"
            name="file"
            className={styles.fileInput}
            onChange={handleFileChange}
            required
          />
          <p className={styles.form__help}>
            Select the package file to upload
          </p>
        </div>

        <div className={styles.form__actions}>
          <button
            type="button"
            className={`${styles.button} ${styles['button--secondary']}`}
            onClick={() => setFormData({
              namespace: '',
              name: '',
              version: '',
              variant: '',
              file: null
            })}
          >
            Reset
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles['button--primary']}`}
          >
            Publish Package
          </button>
        </div>
      </form>
    </div>
  );
}
