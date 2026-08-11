'use client';

import { useState, useEffect, useCallback } from 'react';
import builtinTypes from '../constants/package-types.json';
import type { RepoType } from '../types/admin';
import {
  loadCustom, loadEnabled, saveCustom, saveEnabled,
} from '../utils/repoTypeStorage';

/** Return type for useRepoTypes. */
export interface UseRepoTypesResult {
  allTypes: RepoType[];
  editing: RepoType | null;
  setEditing: (t: RepoType | null) => void;
  addType: (t: RepoType) => void;
  updateType: (id: string, t: RepoType) => void;
  deleteType: (id: string) => void;
  toggleEnabled: (id: string) => void;
  importTypes: (types: RepoType[]) => void;
}

/** Hook for managing repo types. */
export default function useRepoTypes(): UseRepoTypesResult {
  const [custom, setCustom] = useState<RepoType[]>([]);
  const [enabled, setEnabled] = useState(new Set<string>());
  const [editing, setEditing] =
    useState<RepoType | null>(null);

  useEffect(() => {
    setCustom(loadCustom());
    setEnabled(loadEnabled());
  }, []);

  const builtins: RepoType[] = builtinTypes.map(
    (t) => ({ ...t, builtin: true, enabled: enabled.has(t.id) }),
  );
  const allTypes = [
    ...builtins,
    ...custom.map((t) => ({ ...t, enabled: enabled.has(t.id) })),
  ];

  const addType = useCallback((t: RepoType) => {
    setCustom((prev) => {
      const next = [...prev, { ...t, builtin: false }];
      saveCustom(next); return next;
    });
    setEnabled((prev) => {
      const next = new Set(prev); next.add(t.id);
      saveEnabled(next); return next;
    });
  }, []);

  const updateType = useCallback((id: string, t: RepoType) => {
    setCustom((prev) => {
      const next = prev.map(
        (x) => (x.id === id ? { ...t, builtin: false } : x),
      );
      saveCustom(next); return next;
    });
  }, []);

  const deleteType = useCallback((id: string) => {
    setCustom((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveCustom(next); return next;
    });
  }, []);

  const toggleEnabled = useCallback((id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveEnabled(next); return next;
    });
  }, []);

  const importTypes = useCallback((types: RepoType[]) => {
    const nc = types.filter((t) => !t.builtin);
    const ne = new Set(
      types.filter((t) => t.enabled).map((t) => t.id),
    );
    setCustom((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const m = [...prev, ...nc.filter((t) => !ids.has(t.id))];
      saveCustom(m); return m;
    });
    setEnabled(ne); saveEnabled(ne);
  }, []);

  return {
    allTypes, editing, setEditing, addType,
    updateType, deleteType, toggleEnabled, importTypes,
  };
}
