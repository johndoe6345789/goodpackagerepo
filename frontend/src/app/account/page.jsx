'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.new_password.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error?.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Account Settings</h1>
        <p>Manage your account and security settings</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.section__title}>User Information</h2>
        <div className={styles.info}>
          <div className={styles.info__item}>
            <span className={styles.info__itemLabel}>Username</span>
            <span className={styles.info__itemValue}>{user.username}</span>
          </div>
          <div className={styles.info__item}>
            <span className={styles.info__itemLabel}>Permissions</span>
            <span className={styles.info__itemValue}>
              {user.scopes?.map((scope, idx) => (
                <span key={idx} className={styles.badge}>{scope}</span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.section__title}>Change Password</h2>
        
        {message.text && (
          <div className={`${styles.alert} ${styles[`alert--${message.type}`]}`}>
            {message.text}
          </div>
        )}

        <form className={styles.form} onSubmit={handlePasswordChange}>
          <div className={styles.form__group}>
            <label className={styles.form__label} htmlFor="old_password">
              Current Password
            </label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              className={styles.form__input}
              value={formData.old_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.form__group}>
            <label className={styles.form__label} htmlFor="new_password">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              className={styles.form__input}
              value={formData.new_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.form__group}>
            <label className={styles.form__label} htmlFor="confirm_password">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              className={styles.form__input}
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.form__actions}>
            <button
              type="submit"
              className={`${styles.button} ${styles['button--primary']}`}
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.section__title}>Session</h2>
        <div className={styles.form__actions}>
          <button
            onClick={handleLogout}
            className={`${styles.button} ${styles['button--danger']}`}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
