'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        // Store token in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        // Redirect to home
        router.push('/');
      } else {
        const error = await response.json();
        setError(error.error?.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.loginBox__header}>
          <h1>Login</h1>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles['alert--error']}`}>
            {error}
          </div>
        )}

        <form className={styles.loginBox__form} onSubmit={handleSubmit}>
          <div className={styles.loginBox__group}>
            <label className={styles.loginBox__label} htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.loginBox__input}
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className={styles.loginBox__group}>
            <label className={styles.loginBox__label} htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.loginBox__input}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.loginBox__button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Default credentials: admin / admin
        </div>
      </div>
    </div>
  );
}
