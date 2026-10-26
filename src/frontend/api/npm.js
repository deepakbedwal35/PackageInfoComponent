import { cleanPkgName, isDevEnvironment } from '../lib/packageName.js';
import { resolveVersionSpec } from '../lib/resolveVersion.js';
import { fetchWithFallback } from './cache.js';

export async function fetchPackageInfo(pkgQuery, signal = null) {
  if (!pkgQuery || typeof pkgQuery !== 'string' || !pkgQuery.trim()) {
    return {
      name: 'unknown',
      version: 'latest',
      description: 'No package specified.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: 'Missing package query'
    };
  }

  const rawTrimmed = pkgQuery.trim();
  let [name, requestedVersion] = rawTrimmed.startsWith('@')
    ? [
        `@${rawTrimmed.slice(1).split('@')[0]}`,
        rawTrimmed.slice(1).split('@')[1] || null
      ]
    : rawTrimmed.split('@');

  name = (name || '').toLowerCase().trim();
  if (!name) {
    return {
      name: 'unknown',
      version: 'latest',
      description: 'Invalid package name.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: 'Invalid package name'
    };
  }

  const encoded = encodeURIComponent(name);
  const dev = isDevEnvironment();

  try {
    let pkgData = null;
    let fullPkgData = null;
    let resolvedMeta = null;

    if (requestedVersion) {
      const packumentUrls = dev
        ? [`/proxy/npm-registry/${encoded}`, `https://registry.npmjs.org/${encoded}`, `https://registry.npmmirror.com/${encoded}`]
        : [`https://registry.npmjs.org/${encoded}`, `https://registry.npmmirror.com/${encoded}`];

      fullPkgData = await fetchWithFallback(packumentUrls, null, 3000, signal);

      if (fullPkgData && fullPkgData.versions) {
        resolvedMeta = resolveVersionSpec(requestedVersion, fullPkgData.versions, fullPkgData['dist-tags']);
        if (resolvedMeta.found && resolvedMeta.version) {
          pkgData = fullPkgData.versions[resolvedMeta.version];
        } else {
          // Packument exists but version was not found
          return {
            name,
            version: null,
            requestedSpec: requestedVersion,
            found: false,
            availableMajors: resolvedMeta.availableMajors || [],
            description: `No version matching ${requestedVersion} for ${name}`,
            error: `No version matching ${requestedVersion} for ${name}`
          };
        }
      } else if (/^\d+\.\d+\.\d+/.test(requestedVersion)) {
        // Fallback to exact version endpoint only if packument request failed and spec is exact
        const exactUrls = dev
          ? [`/proxy/npm-registry/${encoded}/${requestedVersion}`, `https://registry.npmjs.org/${encoded}/${requestedVersion}`]
          : [`https://registry.npmjs.org/${encoded}/${requestedVersion}`];
        pkgData = await fetchWithFallback(exactUrls, null, 3000, signal);
      }
    }

    if (!pkgData) {
      const latestUrls = dev
        ? [`/proxy/npm-registry/${encoded}/latest`, `https://registry.npmjs.org/${encoded}/latest`, `https://registry.npmmirror.com/${encoded}/latest`]
        : [`https://registry.npmjs.org/${encoded}/latest`, `https://registry.npmmirror.com/${encoded}/latest`];

      pkgData = await fetchWithFallback(latestUrls, null, 3000, signal);
    }

    if (!pkgData) {
      return {
        name,
        version: requestedVersion || 'latest',
        description: 'Package information unavailable or not found.',
        license: 'N/A',
        dependenciesCount: 0,
        unpackedSize: null,
        deprecated: null,
        keywords: [],
        error: 'Package not found'
      };
    }

    let deprecationMessage = pkgData?.deprecated || null;
    if (!deprecationMessage && fullPkgData?.versions?.[pkgData?.version]?.deprecated) {
      deprecationMessage = fullPkgData.versions[pkgData.version].deprecated;
    }

    // Release date from fullPkg.time[version], NOT from the version object
    const resolvedVersionStr = pkgData.version || requestedVersion || 'latest';
    const releaseDate =
      fullPkgData?.time?.[resolvedVersionStr] ||
      fullPkgData?.time?.[pkgData.version] ||
      pkgData.publish_time ||
      null;

    return {
      name: pkgData.name || name,
      version: resolvedVersionStr,
      requestedSpec: requestedVersion || 'latest',
      found: true,
      availableMajors: resolvedMeta?.availableMajors || [],
      description: pkgData.description || 'No description provided.',
      license: pkgData.license || 'N/A',
      homepage: pkgData.homepage || null,
      repository: typeof pkgData.repository === 'object' ? pkgData.repository?.url : pkgData.repository,
      dependenciesCount: Object.keys(pkgData.dependencies || {}).length,
      unpackedSize: pkgData.dist?.unpackedSize || null,
      engines: pkgData.engines || null,
      types: pkgData.types || pkgData.typings || null,
      type: pkgData.type || null,
      keywords: pkgData.keywords || [],
      deprecated: deprecationMessage,
      releaseDate,
      raw: pkgData
    };
  } catch (err) {
    return {
      name,
      version: requestedVersion || 'latest',
      description: 'Package information unavailable or not found.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: err?.message || 'Failed to load'
    };
  }
}

export async function fetchWeeklyDownloads(pkgName, signal = null) {
  const clean = cleanPkgName(pkgName);
  if (!clean) return null;

  const encoded = encodeURIComponent(clean);
  const dev = isDevEnvironment();
  const urls = dev
    ? [`/proxy/npm-downloads/point/last-week/${encoded}`, `https://api.npmjs.org/downloads/point/last-week/${encoded}`]
    : [`https://api.npmjs.org/downloads/point/last-week/${encoded}`];

  try {
    const data = await fetchWithFallback(urls, null, 3000, signal);
    return data?.downloads ?? null;
  } catch {
    return null;
  }
}

export async function fetchMonthlyDownloadsRange(pkgName, signal = null) {
  const clean = cleanPkgName(pkgName);
  if (!clean) return null;

  const encoded = encodeURIComponent(clean);
  const dev = isDevEnvironment();
  const urls = dev
    ? [`/proxy/npm-downloads/range/last-month/${encoded}`, `https://api.npmjs.org/downloads/range/last-month/${encoded}`]
    : [`https://api.npmjs.org/downloads/range/last-month/${encoded}`];

  try {
    const data = await fetchWithFallback(urls, null, 3000, signal);
    if (data?.downloads && Array.isArray(data.downloads)) {
      return data.downloads.map((item) => (typeof item === 'object' ? item.downloads : item));
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchUseCaseSearch(text, size = 5, signal = null) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return [];
  }
  const encoded = encodeURIComponent(text.trim());
  const dev = isDevEnvironment();
  const urls = dev
    ? [`/proxy/npm-registry/-/v1/search?text=${encoded}&size=${size}`, `https://registry.npmjs.org/-/v1/search?text=${encoded}&size=${size}`, `https://registry.npmmirror.com/-/v1/search?text=${encoded}&size=${size}`]
    : [`https://registry.npmjs.org/-/v1/search?text=${encoded}&size=${size}`, `https://registry.npmmirror.com/-/v1/search?text=${encoded}&size=${size}`];

  try {
    const data = await fetchWithFallback(urls, null, 3000, signal);
    return data?.objects || [];
  } catch {
    return [];
  }
}

export async function fetchLiveCandidates(profileTerms, primaryPkgData, primaryDownloads = 0, signal = null) {
  if (!profileTerms || profileTerms.length === 0 || !primaryPkgData?.name) {
    return [];
  }

  const primaryName = (primaryPkgData.name || '').toLowerCase().trim();
  const primaryKeywords = (primaryPkgData.keywords || []).map((k) => String(k).toLowerCase());

  const searchPhrase = profileTerms.slice(0, 3).join(' ');
  const kwSearchPhrase = `keywords:${profileTerms[0]}`;

  const [s1, s2] = await Promise.all([
    fetchUseCaseSearch(searchPhrase, 15, signal),
    fetchUseCaseSearch(kwSearchPhrase, 15, signal)
  ]);

  if (signal?.aborted) return [];

  const rawList = [...(s1 || []), ...(s2 || [])];
  const seenNames = new Set();
  const deduped = [];

  for (const item of rawList) {
    const pkg = item?.package || item;
    const name = (pkg?.name || '').toLowerCase().trim();
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    deduped.push(pkg);
  }

  const filtered = [];
  for (const cand of deduped) {
    const cName = (cand.name || '').toLowerCase().trim();
    if (cName === primaryName) continue;
    if (cName.startsWith('@types/')) continue;
    if (cand.deprecated) continue;

    const candKeywords = (cand.keywords || []).map((k) => String(k).toLowerCase());
    const sharedKwCount = candKeywords.filter((k) => primaryKeywords.includes(k)).length;

    const isPrefixOrSuffix =
      cName.startsWith(`${primaryName}-`) ||
      cName.startsWith(`${primaryName}_`) ||
      cName.endsWith(`-${primaryName}`) ||
      cName.endsWith(`_${primaryName}`);

    if (isPrefixOrSuffix && sharedKwCount < 3) {
      continue;
    }

    filtered.push({
      ...cand,
      sharedKwCount
    });
  }

  if (signal?.aborted) return [];

  // Sort candidates by shared keywords count descending before slicing to top 8
  filtered.sort((a, b) => (b.sharedKwCount || 0) - (a.sharedKwCount || 0));
  const pool = filtered.slice(0, 8);

  // Fetch weekly downloads with concurrency capped at 4
  const dlResults = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < pool.length; i += CONCURRENCY) {
    if (signal?.aborted) return [];
    const batch = pool.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.allSettled(
      batch.map((c) => fetchWeeklyDownloads(c.name, signal))
    );
    dlResults.push(...batchRes);
  }

  const withDownloads = pool.map((c, i) => {
    const res = dlResults[i];
    const dl = res && res.status === 'fulfilled' ? res.value : null;
    return {
      ...c,
      weeklyDownloads: dl
    };
  });

  const activeUsage = withDownloads.filter((c) => c.weeklyDownloads !== null && c.weeklyDownloads > 0);
  const threshold = (primaryDownloads || 0) * 0.01;
  const popularCandidates = activeUsage.filter((c) => c.weeklyDownloads >= threshold);

  return popularCandidates.length >= 3 ? popularCandidates : activeUsage;
}
