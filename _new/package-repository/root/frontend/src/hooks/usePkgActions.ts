'use client';

import { useState } from 'react';
import { getApiUrl } from '../utils/api';
import { inferType } from '../utils/inferType';
import type { PackageInfo, PackageVersion } from '../types/package';
import extMap from '../constants/type-extensions.json';

/** Return type for the usePkgActions hook. */
export interface UsePkgActionsResult {
  detail: PackageInfo | null;
  versions: PackageVersion[];
  downloadError: string;
  clearDetail: () => void;
  handleDownload: (pkg: PackageInfo) => Promise<void>;
  handleDetails: (pkg: PackageInfo) => Promise<void>;
}

/** Trigger a browser download for a blob. */
function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Resolve the file extension for a package. */
function fileExt(pkg: PackageInfo): string {
  const tid = inferType(pkg.type, pkg.namespace);
  const ext = (extMap as Record<string, string>)[tid];
  return ext ?? '.tar.gz';
}

/** Hook for package download and detail actions. */
export default function usePkgActions(): UsePkgActionsResult {
  const [detail, setDetail] = useState<PackageInfo | null>(null);
  const [versions, setVersions] =
    useState<PackageVersion[]>([]);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async (pkg: PackageInfo) => {
    setDownloadError('');
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('token');
    const url = `${apiUrl}/v1/${pkg.namespace}` +
      `/${pkg.name}/${pkg.version}/${pkg.variant}/blob`;
    const ext = fileExt(pkg);
    const fname = `${pkg.name}-${pkg.version}${ext}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerDownload(await res.blob(), fname);
        return;
      }
      setDownloadError(
        `Server returned ${res.status}. Is the repo running?`,
      );
    } catch {
      setDownloadError('Server unreachable. Start with: manager repo up');
    }
  };

  const handleDetails = async (pkg: PackageInfo) => {
    setDetail(pkg);
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('token');
    const url = `${apiUrl}/v1` +
      `/${pkg.namespace}/${pkg.name}/versions`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          versions?: PackageVersion[];
        };
        setVersions(data.versions ?? []);
      }
    } catch { /* API unreachable */ }
  };

  return {
    detail, versions, downloadError,
    clearDetail: () => setDetail(null),
    handleDownload, handleDetails,
  };
}
