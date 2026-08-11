import builtinTypes from '../constants/package-types.json';
import type { RepoType } from '../types/admin';

const CUSTOM_KEY = 'custom_repo_types';
const ENABLED_KEY = 'enabled_repo_types';

/** Load custom types from localStorage. */
export function loadCustom(): RepoType[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as RepoType[]) : [];
  } catch { return []; }
}

/** Load enabled type IDs from localStorage. */
export function loadEnabled(): Set<string> {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set(builtinTypes.map((t) => t.id));
}

/** Save custom types to localStorage. */
export function saveCustom(types: RepoType[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(types));
}

/** Save enabled type IDs to localStorage. */
export function saveEnabled(ids: Set<string>) {
  localStorage.setItem(
    ENABLED_KEY, JSON.stringify([...ids]),
  );
}
