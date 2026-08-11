import type { UserData } from '../types/package';

/** Props for UserInfo component. */
interface UserInfoProps {
  /** The current user data. */
  user: UserData;
  /** SCSS module styles from the parent page. */
  styles: Record<string, string>;
}

/**
 * Displays user information and permission scopes.
 * @param props - Component props.
 * @returns The user info section JSX.
 */
export default function UserInfo(
  { user, styles }: UserInfoProps,
) {
  return (
    <div
      className={styles.section}
      data-testid="user-info"
    >
      <h2 className={styles.section__title}>
        User Information
      </h2>
      <div className={styles.info}>
        <div className={styles.info__item}>
          <span className={styles.info__itemLabel}>
            Username
          </span>
          <span className={styles.info__itemValue}>
            {user.username}
          </span>
        </div>
        <div className={styles.info__item}>
          <span className={styles.info__itemLabel}>
            Permissions
          </span>
          <span className={styles.info__itemValue}>
            {user.scopes?.map((scope) => (
              <span
                key={scope}
                className={styles.badge}
              >
                {scope}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
