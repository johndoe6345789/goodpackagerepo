'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../utils/api';
import seedConfig from '../constants/seed-admin-config.json';
import type { UserData } from '../types/package';
import type { AdminConfig, AdminTab } from '../types/admin';

/** Return type for the useAdmin hook. */
export interface UseAdminResult {
  user: UserData | null;
  config: AdminConfig | null;
  activeTab: AdminTab;
  loading: boolean;
  usingSeed: boolean;
  expandedRoute: number | null;
  setActiveTab: (tab: AdminTab) => void;
  setExpandedRoute: (idx: number | null) => void;
}

/** Check if user has admin access. */
function isAdmin(u: UserData): boolean {
  return u.scopes?.includes('admin')
    || u.role === 'admin';
}

/** Hook encapsulating admin page state and data. */
export default function useAdmin(): UseAdminResult {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [config, setConfig] =
    useState<AdminConfig | null>(null);
  const [activeTab, setActiveTab] =
    useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [usingSeed, setUsingSeed] = useState(false);
  const [expandedRoute, setExpandedRoute] =
    useState<number | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          config: AdminConfig;
        };
        setConfig(data.config);
        setLoading(false);
        return;
      }
    } catch { /* API unreachable */ }
    setConfig(seedConfig as AdminConfig);
    setUsingSeed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(userData) as UserData;
    if (!isAdmin(parsed)) {
      router.push('/');
      return;
    }
    setUser(parsed);
    void fetchConfig();
  }, [router, fetchConfig]);

  return {
    user, config, activeTab, loading, usingSeed,
    expandedRoute, setActiveTab, setExpandedRoute,
  };
}
