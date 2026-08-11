'use client';

import styles from './page.module.scss';
import useAccount from '../../hooks/useAccount';
import PasswordForm
  from '../../components/PasswordForm';
import UserInfo from '../../components/UserInfo';

/**
 * Account settings page for user management.
 * @returns The account page content.
 */
export default function AccountPage() {
  const account = useAccount();
  const { user, handleLogout } = account;

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={styles.container}
      data-testid="account-page"
    >
      <div className={styles.header}>
        <h1>Account Settings</h1>
        <p>Manage your account and security settings</p>
      </div>

      <UserInfo user={user} styles={styles} />
      <PasswordForm account={account} styles={styles} />

      <div className={styles.section}>
        <h2 className={styles.section__title}>
          Session
        </h2>
        <div className={styles.form__actions}>
          <button
            onClick={handleLogout}
            className={
              `${styles.button}`
              + ` ${styles['button--danger']}`
            }
            data-testid="logout-button"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
