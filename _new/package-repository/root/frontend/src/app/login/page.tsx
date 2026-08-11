'use client';

import styles from './page.module.scss';
import useLogin from '../../hooks/useLogin';

/** Login page with username/password form. */
export default function LoginPage() {
  const { formData, error, loading, handleChange, handleSubmit } = useLogin();
  const alertCls = `${styles.alert} ${styles['alert--error']}`;

  return (
    <div className={styles.container} data-testid="login-page">
      <div className={styles.loginBox}>
        <div className={styles.loginBox__header}>
          <h1>Login</h1>
          <p>Sign in to your account</p>
        </div>
        {error && (
          <div className={alertCls} data-testid="login-error">{error}</div>
        )}
        <form
          className={styles.loginBox__form}
          method="post"
          onSubmit={handleSubmit}
        >
          <div className={styles.loginBox__group}>
            <label className={styles.loginBox__label} htmlFor="username">
              Username
            </label>
            <input
              type="text" id="username" name="username"
              className={styles.loginBox__input}
              value={formData.username} onChange={handleChange}
              required autoFocus aria-label="Username"
            />
          </div>
          <div className={styles.loginBox__group}>
            <label className={styles.loginBox__label} htmlFor="password">
              Password
            </label>
            <input
              type="password" id="password" name="password"
              className={styles.loginBox__input}
              value={formData.password} onChange={handleChange}
              required aria-label="Password"
            />
          </div>
          <button
            type="submit" className={styles.loginBox__button}
            disabled={loading} data-testid="login-submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{
          marginTop: '16px', textAlign: 'center',
          color: '#666', fontSize: '14px',
        }}>
          Contact your administrator for credentials.
        </div>
      </div>
    </div>
  );
}
