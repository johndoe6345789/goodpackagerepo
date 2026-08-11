'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../utils/api';
import type { UserData } from '../types/package';

interface PasswordFormData {
  old_password: string; new_password: string; confirm_password: string;
}
interface AccountMessage { type: string; text: string; }
/** Return type for the useAccount hook. */
export interface UseAccountResult {
  user: UserData | null; formData: PasswordFormData;
  message: AccountMessage; loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: FormEvent<HTMLFormElement>) => void;
  handleLogout: () => void;
}
const EMPTY: PasswordFormData = {
  old_password: '', new_password: '', confirm_password: '',
};

/** Hook encapsulating account page state and actions. */
export default function useAccount(): UseAccountResult {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<PasswordFormData>({ ...EMPTY });
  const [message, setMessage] = useState<AccountMessage>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    setUser(JSON.parse(userData) as UserData);
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
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
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password,
        }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({ ...EMPTY });
      } else {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setMessage({
          type: 'error',
          text: body.error?.message ?? 'Failed to change password',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return {
    user, formData, message, loading,
    handleChange, handlePasswordChange, handleLogout,
  };
}
