import pkgTypes from '../constants/package-types.json';

/** Namespace aliases mapping to canonical type ids. */
const NS_ALIAS: Record<string, string> = {
  apt: 'deb', docker: 'oci', pip: 'pypi',
  gem: 'rubygems', apk: 'alpine',
};

/** All known type ids for fast lookup. */
const TYPE_IDS = new Set(pkgTypes.map((t) => t.id));

/**
 * Resolve the canonical package type id.
 * Uses the explicit type field first, then infers
 * from the namespace via alias or direct match.
 *
 * @param type - Explicit type field (may be undefined).
 * @param namespace - Package namespace.
 * @returns Resolved type id, or empty string.
 */
export function inferType(
  type: string | undefined,
  namespace: string,
): string {
  if (type && TYPE_IDS.has(type)) return type;
  const ns = NS_ALIAS[namespace] ?? namespace;
  return TYPE_IDS.has(ns) ? ns : '';
}
