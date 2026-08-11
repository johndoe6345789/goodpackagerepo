'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../utils/api';

/** Login form field values. */
interface LoginFormData { username: string; password: string; }

/** Return type for the useLogin hook. */
export interface UseLoginResult {
  formData: LoginFormData;
  error: string;
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/** Hook encapsulating login form state and submission. */
export default function useLogin(): UseLoginResult {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const result = (await response.json()) as {
          token: string; user: Record<string, unknown>;
        };
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.dispatchEvent(new Event('storage'));
        router.push('/');
      } else {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, error, loading, handleChange, handleSubmit };
}
