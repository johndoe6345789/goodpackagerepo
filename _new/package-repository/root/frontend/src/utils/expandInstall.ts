/** Variables available in install templates. */
export interface InstallVars {
  ns: string;
  name: string;
  version: string;
  variant: string;
  /** Full API URL including protocol. */
  host: string;
  /** API host without the protocol prefix. */
  hostBare: string;
}

/**
 * Expand {var} placeholders in an install template.
 * Strips markdown code fences for inline rendering.
 *
 * @param template - Raw template with `{var}` tokens
 * @param vars     - Replacement values
 * @returns Expanded string ready for display
 */
export function expandInstall(
  template: string, vars: InstallVars,
): string {
  return template
    .replace(/\{ns\}/g, vars.ns)
    .replace(/\{name\}/g, vars.name)
    .replace(/\{version\}/g, vars.version)
    .replace(/\{variant\}/g, vars.variant)
    .replace(/\{host\}/g, vars.host)
    .replace(/\{host_bare\}/g, vars.hostBare)
    .replace(/```\w*/g, '')
    .trim();
}
