'use client';

import type { UseAccountResult } from '../hooks/useAccount';

/** Props for PasswordForm component. */
interface PasswordFormProps {
  account: UseAccountResult;
  styles: Record<string, string>;
}

const FIELDS = [
  { id: 'old_password', label: 'Current Password' },
  { id: 'new_password', label: 'New Password' },
  { id: 'confirm_password', label: 'Confirm New Password' },
] as const;

/** Password change form for account settings. */
export default function PasswordForm({ account, styles }: PasswordFormProps) {
  const { formData, message, loading, handleChange, handlePasswordChange } = account;

  return (
    <div className={styles.section}>
      <h2 className={styles.section__title}>Change Password</h2>
      {message.text && (
        <div className={`${styles.alert} ${styles[`alert--${message.type}`]}`}
          data-testid="password-message">
          {message.text}
        </div>
      )}
      <form className={styles.form} onSubmit={handlePasswordChange}
        data-testid="password-form">
        {FIELDS.map((f) => (
          <div key={f.id} className={styles.form__group}>
            <label className={styles.form__label} htmlFor={f.id}>{f.label}</label>
            <input
              type="password" id={f.id} name={f.id} className={styles.form__input}
              value={formData[f.id]} onChange={handleChange}
              required aria-label={f.label}
            />
          </div>
        ))}
        <div className={styles.form__actions}>
          <button type="submit"
            className={`${styles.button} ${styles['button--primary']}`}
            disabled={loading} data-testid="change-password-submit">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
