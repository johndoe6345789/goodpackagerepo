'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar__container}>
        <Link href="/" className={styles.navbar__logo}>
          📦 Good Package Repo
        </Link>
        <ul className={styles.navbar__nav}>
          <li>
            <Link href="/" className={styles.navbar__link}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/browse" className={styles.navbar__link}>
              Browse
            </Link>
          </li>
          <li>
            <Link href="/publish" className={styles.navbar__link}>
              Publish
            </Link>
          </li>
          <li>
            <Link href="/docs" className={styles.navbar__link}>
              Docs
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link href="/account" className={styles.navbar__link}>
                  Account ({user.username})
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className={styles.navbar__button}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" className={styles.navbar__link}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

