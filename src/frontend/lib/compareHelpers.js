import { cleanPkgName } from './packageName.js';

/**
 * Returns specs in comparePackages that are NOT represented in readyKeys.
 * Pure helper — used to decide what still needs fetching.
 *
 * @param {string[]} comparePackages  Current list of specs to compare
 * @param {string[]|Set<string>} readyKeys  Specs already in the cache
 * @returns {string[]}
 */
export function specsToFetch(comparePackages, readyKeys) {
  const keySet = readyKeys instanceof Set ? readyKeys : new Set(readyKeys);
  return (comparePackages || []).filter((spec) => !keySet.has(spec));
}

// Valid npm package name — bare name, no @version
const PKG_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

/**
 * Validates a user-supplied package name for adding to the compare list.
 * Rejects: empty, invalid characters, duplicates (case-insensitive), over-3.
 * Accepts: plain names, scoped names (@scope/pkg).
 *
 * @param {string} input               Raw user input
 * @param {string[]} comparePackages   Current compare list (for duplicate check)
 * @returns {{ valid: boolean, name: string|null, error: string|null }}
 */
export function validatePkgInput(input, comparePackages) {
  if (!input || typeof input !== 'string') {
    return { valid: false, name: null, error: 'Package name is required.' };
  }
  const trimmed = input.trim().replace(/^npm\s+/i, '');
  if (!trimmed) {
    return { valid: false, name: null, error: 'Package name is required.' };
  }
  // Strip any @version for validation
  const clean = cleanPkgName(trimmed);
  if (!clean || !PKG_NAME_REGEX.test(clean)) {
    return {
      valid: false,
      name: null,
      error: `"${clean || trimmed}" is not a valid npm package name.`
    };
  }
  const currentList = comparePackages || [];
  if (currentList.length >= 3) {
    return { valid: false, name: null, error: 'Maximum 3 packages can be compared.' };
  }
  const isDuplicate = currentList.some(
    (spec) => cleanPkgName(spec).toLowerCase() === clean.toLowerCase()
  );
  if (isDuplicate) {
    return { valid: false, name: null, error: `"${clean}" is already in the comparison.` };
  }
  return { valid: true, name: clean, error: null };
}

/**
 * Build the compare-view heading from actual column data.
 * Never reads stale closure state — only the passed packagesData.
 *
 * @param {object[]} packagesData  Derived compare list
 * @param {boolean} isVersionCompare
 * @param {string} primaryPkg  Bare package name (no @version)
 * @returns {string}
 */
export function buildCompareHeading(packagesData, isVersionCompare, primaryPkg = '') {
  if (!packagesData || packagesData.length === 0) {
    return primaryPkg ? `Comparing ${primaryPkg}` : 'Comparing packages';
  }

  if (isVersionCompare) {
    const vers = packagesData
      .map((p) => {
        if (p.info?.version) return p.info.version;
        if (p.requestedName?.includes('@')) {
          return p.requestedName.split('@')[1];
        }
        return cleanPkgName(p.requestedName || '');
      })
      .filter(Boolean);
    const base = primaryPkg || cleanPkgName(packagesData[0]?.requestedName || '');
    return vers.length >= 2 ? `${base} ${vers.join(' vs ')}` : `${base} versions`;
  }

  // Normal compare: derive names from loaded data, not from stale state
  const col0 =
    packagesData[0]?.info?.name ||
    cleanPkgName(packagesData[0]?.requestedName || '') ||
    primaryPkg;
  const col1 =
    packagesData.length > 1
      ? packagesData[1]?.info?.name || cleanPkgName(packagesData[1]?.requestedName || '') || null
      : null;

  return col1 ? `Comparing ${col0} with ${col1}` : `Comparing ${col0}`;
}
