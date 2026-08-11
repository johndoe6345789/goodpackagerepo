'use client';

import Link from 'next/link';
import styles from './Navbar.module.scss';
import nav from '../constants/nav-links.json';

/** Shape of the user object for nav display. */
interface NavbarUser {
  username: string;
  scopes?: string[];
}

/** Props for the NavLinks component. */
interface NavLinksProps {
  user: NavbarUser | null;
  onLogout: () => void;
}

/** Renders the navigation link list. */
export default function NavLinks(
  { user, onLogout }: NavLinksProps,
) {
  return (
    <ul className={styles.navbar__nav}>
      {nav.public.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={styles.navbar__link}
          >
            {l.label}
          </Link>
        </li>
      ))}
      {user && nav.auth.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={styles.navbar__link}
          >
            {l.href === '/account'
              ? `${l.label} (${user.username})`
              : l.label}
          </Link>
        </li>
      ))}
      {user?.scopes?.includes('admin')
        && nav.admin.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={styles.navbar__link}
          >
            {l.label}
          </Link>
        </li>
      ))}
      {user ? (
        <li>
          <button
            onClick={onLogout}
            className={styles.navbar__button}
            aria-label={nav.logoutLabel}
          >
            {nav.logoutLabel}
          </button>
        </li>
      ) : nav.guest.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className={styles.navbar__link}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
