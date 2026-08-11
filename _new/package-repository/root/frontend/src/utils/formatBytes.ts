const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Format a byte count into a human-readable string.
 * @param bytes - Number of bytes.
 * @returns Formatted string like "128 KB" or "1.2 MB".
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${UNITS[i]}`;
}
