/**
 * Safe package name sanitization guarding against undefined, empty, or scoped inputs.
 */
export function cleanPkgName(pkg) {
  if (!pkg || typeof pkg !== 'string') return '';
  const trimmed = pkg.trim();
  if (trimmed.startsWith('@')) {
    const parts = trimmed.slice(1).split('@');
    return '@' + parts[0];
  }
  return trimmed.split('@')[0];
}

/**
 * Detects local development or sandbox environment to leverage low-latency dev proxies.
 */
export function isDevEnvironment() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
