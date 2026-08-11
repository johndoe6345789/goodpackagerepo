'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeaderActions } from '@shared/m3';
import NavLinks from './NavLinks';
import styles from './Navbar.module.scss';

/** Shape of the user object stored in localStorage. */
interface NavbarUser {
  username: string;
  scopes?: string[];
}

/** Top-level navigation bar with auth-aware links. */
export default function Navbar() {
  const [user, setUser] =
    useState<NavbarUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('user');
      if (!raw) { setUser(null); return; }
      try {
        setUser(JSON.parse(raw) as NavbarUser);
      } catch { /* ignore corrupt */ }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener(
      'storage', syncUser,
    );
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav
      className={styles.navbar}
      data-testid="navbar"
      aria-label="Main navigation"
    >
      <div className={styles.navbar__container}>
        <AppHeaderActions
          activePath="/repo"
          onLogout={handleLogout}
        />
        <Link
          href="/"
          className={styles.navbar__logo}
        >
          Package Repo
        </Link>
        <NavLinks
          user={user}
          onLogout={handleLogout}
        />
      </div>
    </nav>
  );
}
