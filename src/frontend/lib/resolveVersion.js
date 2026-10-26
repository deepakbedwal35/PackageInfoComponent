/**
 * Pure semver and version resolution helper for npm packuments.
 * Zero external dependencies.
 */

export function parseSemver(v) {
  if (!v || typeof v !== 'string') {
    return { raw: '', major: 0, minor: 0, patch: 0, isPrerelease: false };
  }
  const clean = v.replace(/^v/i, '').trim();
  const [core, prerelease] = clean.split('-');
  const parts = core.split('.').map((p) => parseInt(p, 10));
  return {
    raw: v,
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
    isPrerelease: Boolean(prerelease)
  };
}

export function compareSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  // Non-prerelease ranks higher than prerelease
  if (!a.isPrerelease && b.isPrerelease) return 1;
  if (a.isPrerelease && !b.isPrerelease) return -1;
  return 0;
}

/**
 * Resolves a version spec against a package's versions map and dist-tags.
 *
 * @param {string|null} spec e.g. "4", "4.x", "4.18", "4.18.2", "latest", ""
 * @param {object|null} versionsMap { [version: string]: object }
 * @param {object|null} distTags { [tag: string]: string }
 * @returns {{ version: string|null, found: boolean, requestedSpec: string, availableMajors: number[] }}
 */
export function resolveVersionSpec(spec, versionsMap = {}, distTags = {}) {
  const rawSpec = spec != null ? String(spec).trim() : '';
  // Strip package prefix if passed like "express@4" -> "4"
  let cleanSpec = rawSpec.includes('@') ? rawSpec.split('@').slice(1).join('@').trim() : rawSpec;
  if (/^v\d/i.test(cleanSpec)) {
    cleanSpec = cleanSpec.slice(1);
  }

  const allVersions = Object.keys(versionsMap || {});
  
  // Extract all available stable major versions
  const majorSet = new Set();
  for (const v of allVersions) {
    const parsed = parseSemver(v);
    if (!parsed.isPrerelease && parsed.major >= 0) {
      majorSet.add(parsed.major);
    }
  }
  const availableMajors = Array.from(majorSet).sort((a, b) => a - b);

  if (allVersions.length === 0) {
    return {
      version: null,
      found: false,
      requestedSpec: cleanSpec || 'latest',
      availableMajors: []
    };
  }

  // 1. "latest" or empty spec -> dist-tags.latest
  if (!cleanSpec || cleanSpec.toLowerCase() === 'latest') {
    const latestTag = distTags?.latest;
    if (latestTag && versionsMap[latestTag]) {
      return {
        version: latestTag,
        found: true,
        requestedSpec: cleanSpec || 'latest',
        availableMajors
      };
    }
    // Fallback: pick highest stable version
    const sorted = allVersions
      .map(parseSemver)
      .filter((p) => !p.isPrerelease)
      .sort(compareSemver);
    const highest = sorted.length > 0 ? sorted[sorted.length - 1].raw : allVersions[allVersions.length - 1];
    return {
      version: highest,
      found: true,
      requestedSpec: cleanSpec || 'latest',
      availableMajors
    };
  }

  // 2. Exact match wins ("4.18.2")
  if (versionsMap[cleanSpec]) {
    return {
      version: cleanSpec,
      found: true,
      requestedSpec: cleanSpec,
      availableMajors
    };
  }

  // 3. Prefix matching: "4", "4.x", "4.*", "4.18", "4.18.x"
  const prefixPattern = cleanSpec
    .replace(/\.x$/i, '')
    .replace(/\.\*$/, '')
    .replace(/x$/i, '');

  const parts = prefixPattern.split('.').map((p) => parseInt(p, 10));
  const targetMajor = Number.isFinite(parts[0]) ? parts[0] : null;
  const targetMinor = parts.length > 1 && Number.isFinite(parts[1]) ? parts[1] : null;
  const targetPatch = parts.length > 2 && Number.isFinite(parts[2]) ? parts[2] : null;

  const matches = allVersions.filter((v) => {
    const p = parseSemver(v);
    if (targetMajor !== null && p.major !== targetMajor) return false;
    if (targetMinor !== null && p.minor !== targetMinor) return false;
    if (targetPatch !== null && p.patch !== targetPatch) return false;
    return true;
  });

  if (matches.length === 0) {
    return {
      version: null,
      found: false,
      requestedSpec: cleanSpec,
      availableMajors
    };
  }

  // Split into stable and prereleases
  const parsedMatches = matches.map(parseSemver);
  const stable = parsedMatches.filter((p) => !p.isPrerelease);
  const candidatePool = stable.length > 0 ? stable : parsedMatches;

  // Filter out deprecated versions only if non-deprecated ones exist
  const nonDeprecated = candidatePool.filter((p) => !versionsMap[p.raw]?.deprecated);
  const finalPool = nonDeprecated.length > 0 ? nonDeprecated : candidatePool;

  finalPool.sort(compareSemver);
  const highest = finalPool[finalPool.length - 1].raw;

  return {
    version: highest,
    found: true,
    requestedSpec: cleanSpec,
    availableMajors
  };
}
