import { cleanPkgName, isDevEnvironment } from '../lib/packageName.js';
import { KNOWN_BUNDLE_SIZES } from '../constants/bundleSizes.js';
import { fetchWithFallback } from './cache.js';

let bundlephobiaBlocked = false;

export async function fetchBundleSize(pkgQuery, rawPkgData = null, signal = null, isVersionCompare = false) {
  const clean = cleanPkgName(pkgQuery);
  if (!clean) return { size: null, gzip: null, dependencyCount: null };

  const queryTarget = isVersionCompare && rawPkgData?.version
    ? `${clean}@${rawPkgData.version}`
    : clean;

  const encoded = encodeURIComponent(queryTarget);
  const dev = isDevEnvironment();
  const urls = dev
    ? [
        `/proxy/bundlephobia/size?package=${encoded}`,
        `https://bundlephobia.com/api/size?package=${encoded}`
      ]
    : [
        `https://bundlephobia.com/api/size?package=${encoded}`
      ];

  if (!bundlephobiaBlocked) {
    try {
      const data = await fetchWithFallback(urls, null, 2000, signal);
      if (data && (data.size != null || data.gzip != null)) {
        return {
          size: data.size ?? null,
          gzip: data.gzip ?? null,
          dependencyCount: data.dependencyCount ?? null
        };
      }
      bundlephobiaBlocked = true;
    } catch {
      bundlephobiaBlocked = true;
    }
  }

  // In version-compare mode, do NOT use KNOWN_BUNDLE_SIZES (it is not per-version)
  if (!isVersionCompare) {
    const known = KNOWN_BUNDLE_SIZES[clean.toLowerCase()];
    if (known) {
      return {
        size: known.size,
        gzip: known.gzip,
        dependencyCount: known.dependencyCount
      };
    }
  }

  // Fallback: Heuristic estimation from unpackedSize of that specific version
  const unpackedSize = rawPkgData?.unpackedSize || rawPkgData?.dist?.unpackedSize;
  if (unpackedSize && typeof unpackedSize === 'number') {
    return {
      size: Math.round(unpackedSize * 0.75),
      gzip: Math.round(unpackedSize * 0.28),
      dependencyCount: rawPkgData?.dependenciesCount || 0,
      estimated: true
    };
  }

  return { size: null, gzip: null, dependencyCount: null };
}
