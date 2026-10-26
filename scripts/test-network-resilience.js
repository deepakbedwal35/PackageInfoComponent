import {
  cachedFetch,
  fetchWithFallback,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchBundleSize,
  fetchPackageInfo,
  fetchUseCaseSearch,
  cleanPkgName,
  KNOWN_BUNDLE_SIZES
} from '../dist/frontend/index.modern.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function run() {
  console.log('\n=== 1. TESTING CLEAN PKG NAME & SAFE PARAMETERS ===');
  assert(cleanPkgName('') === '', 'cleanPkgName("") returns ""');
  assert(cleanPkgName(null) === '', 'cleanPkgName(null) returns ""');
  assert(cleanPkgName(undefined) === '', 'cleanPkgName(undefined) returns ""');
  assert(cleanPkgName('react') === 'react', 'cleanPkgName("react") returns "react"');
  assert(cleanPkgName('react@18.2.0') === 'react', 'cleanPkgName("react@18.2.0") strips version');
  assert(cleanPkgName('@mui/material') === '@mui/material', 'cleanPkgName("@mui/material") preserves scope');
  assert(cleanPkgName('@mui/material@5.15.0') === '@mui/material', 'cleanPkgName("@mui/material@5.15.0") strips version');

  console.log('\n=== 2. TESTING MISSING / EMPTY PARAMS SAFE GUARDS ===');
  const emptyDl = await fetchWeeklyDownloads('');
  assert(emptyDl === null, 'fetchWeeklyDownloads("") returns null without error');

  const nullDl = await fetchWeeklyDownloads(null);
  assert(nullDl === null, 'fetchWeeklyDownloads(null) returns null without error');

  const emptyTrend = await fetchMonthlyDownloadsRange('');
  assert(emptyTrend === null, 'fetchMonthlyDownloadsRange("") returns null without error');

  const emptySize = await fetchBundleSize('');
  assert(emptySize.size === null && emptySize.gzip === null, 'fetchBundleSize("") returns empty structure');

  const emptySearch = await fetchUseCaseSearch('');
  assert(Array.isArray(emptySearch) && emptySearch.length === 0, 'fetchUseCaseSearch("") returns empty array');

  const emptyInfo = await fetchPackageInfo('');
  assert(emptyInfo.name === 'unknown', 'fetchPackageInfo("") returns safe fallback structure');

  console.log('\n=== 3. TESTING ERROR BOUNDARY IN CACHED FETCH & FALLBACK ===');
  // Attempt invalid non-existent URL
  const deadRes = await cachedFetch('http://127.0.0.1:59999/non-existent-port-url', 500);
  assert(deadRes === null, 'cachedFetch to dead URL returns null without throwing');

  // Multi-fallback with dead first URL and default fallback
  const fallbackRes = await fetchWithFallback(['http://127.0.0.1:59999/dead1', 'http://127.0.0.1:59999/dead2'], { fallback: true }, 500);
  assert(fallbackRes.fallback === true, 'fetchWithFallback returns defaultData on failure');

  console.log('\n=== 4. TESTING BUNDLEPHOBIA 403 & HEURISTIC FALLBACKS ===');
  // Known bundle size
  const reactKnown = await fetchBundleSize('react');
  assert(reactKnown.size > 0 && reactKnown.gzip > 0, `Bundle size for react resolved: ${reactKnown.size} B / ${reactKnown.gzip} B`);

  // Unpacked size heuristic
  const mockPkgInfo = { unpackedSize: 100000, dependenciesCount: 3 };
  const heuristicSize = await fetchBundleSize('some-unknown-pkg-xyz-999', mockPkgInfo);
  assert(heuristicSize.size === 75000 && heuristicSize.gzip === 28000, 'Heuristic calculation applies 0.75 minified and 0.28 gzip ratio');

  console.log(`\nResilience tests finished: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

run();

