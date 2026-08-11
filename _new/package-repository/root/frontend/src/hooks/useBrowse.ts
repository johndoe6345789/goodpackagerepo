'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiUrl } from '../utils/api';
import type { PackageInfo } from '../types/package';
import { inferType } from '../utils/inferType';
import usePkgActions from './usePkgActions';

/** Return type for the useBrowse hook. */
export interface UseBrowseResult {
  searchTerm: string;
  typeFilter: string;
  loading: boolean;
  offline: boolean;
  all: PackageInfo[];
  filtered: PackageInfo[];
  selected: PackageInfo | null;
  setSearchTerm: (term: string) => void;
  setTypeFilter: (type: string) => void;
  setSelected: (pkg: PackageInfo | null) => void;
  actions: ReturnType<typeof usePkgActions>;
}

/** Hook encapsulating browse page state. */
export default function useBrowse(): UseBrowseResult {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] =
    useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const actions = usePkgActions();

  const fetchPackages = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${apiUrl}/v1/packages`, { headers },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          packages?: PackageInfo[];
        };
        setPackages(data.packages ?? []);
      } else {
        setOffline(true);
      }
    } catch {
      setOffline(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchPackages(); }, [fetchPackages]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return packages.filter((pkg) => {
      const matchesText = !term
        || pkg.name.toLowerCase().includes(term)
        || pkg.namespace.toLowerCase().includes(term);
      const resolved = inferType(pkg.type, pkg.namespace);
      const matchesType = !typeFilter
        || resolved === typeFilter;
      return matchesText && matchesType;
    });
  }, [packages, searchTerm, typeFilter]);

  return {
    searchTerm, typeFilter, loading, offline,
    all: packages, filtered, selected,
    setSearchTerm, setTypeFilter, setSelected, actions,
  };
}
