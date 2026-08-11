'use client';

import {
  useState, type ChangeEvent, type FormEvent,
} from 'react';
import { getApiUrl } from '../utils/api';

/** Publish form field values. */
interface PublishFormData {
  namespace: string; name: string; type: string;
  version: string; variant: string; file: File | null;
}

/** Status message for publish operations. */
interface PublishStatus { type: 'success' | 'error' | null; message: string; }

/** Return type for the usePublish hook. */
export interface UsePublishResult {
  formData: PublishFormData;
  status: PublishStatus;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
}

const EMPTY: PublishFormData = {
  namespace: '', name: '', type: 'generic',
  version: '', variant: '', file: null,
};

/** Hook encapsulating publish form state and submission. */
export default function usePublish(): UsePublishResult {
  const [formData, setFormData] = useState<PublishFormData>({ ...EMPTY });
  const [status, setStatus] = useState<PublishStatus>({
    type: null, message: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }));
  };

  const resetForm = () => setFormData({ ...EMPTY });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    try {
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/v1/${formData.namespace}/${formData.name}/${formData.version}/${formData.variant}/blob`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData.file,
      });
      if (response.ok) {
        const result = (await response.json()) as { digest: string };
        setStatus({
          type: 'success',
          message: `Package published! Digest: ${result.digest}`,
        });
        resetForm();
      } else {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setStatus({
          type: 'error',
          message: body.error?.message ?? 'Failed to publish package',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus({ type: 'error', message: msg });
    }
  };

  return {
    formData, status, handleChange, handleFileChange, handleSubmit, resetForm,
  };
}
