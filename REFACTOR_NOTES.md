# Refactoring Notes: PackageInfoComponent

## 1. Overview
The monolithic `src/frontend/NewComponent.jsx` file (originally ~3,641 lines) has been refactored into a modular, single-responsibility architecture. 

This was a **pure refactor**:
- All UI, styling, behaviors, network call chains, cache mechanisms, and intent parsing logic were preserved with zero regressions.
- No new third-party dependencies were introduced (plain JavaScript, React 18, MUI v6).
- `src/frontend/index.jsx`, `src/sandbox/*`, `hyperdart.config.js`, `vite.config.js`, and `package.json` remain untouched.
- `NewComponent.jsx` maintains its default export `NewComponent(props)` and re-exports all 35+ named constants, utility functions, API calls, view components, and custom hooks required by the test suites.
- Common logic, such as the duplicated `onQuickSearch` intent router used by `EmptySandboxView` and `UnmatchedView`, and the `<ModeTabs />` indicator bar, were consolidated into shared modules.

---

## 2. Modular Architecture & File Map

```
src/frontend/
├── constants/
│   ├── theme.js              # THEME_TOKENS (light, dark, lightsOut tokens, accents, sparklines)
│   ├── bundleSizes.js        # KNOWN_BUNDLE_SIZES registry
│   └── words.js              # GENERIC_PROFILE_WORDS & DESCRIPTION_STOPWORDS sets
├── lib/
│   ├── formatters.js         # formatBytes, formatNumber, formatDate
│   ├── packageName.js        # cleanPkgName, isDevEnvironment
│   ├── detect.js             # detectTypeScript, detectEsm
│   ├── parseIntent.js        # parseIntent, extractEntityPackage (regex engine)
│   ├── ranking.js            # extractProfileTerms, rankAlternatives
│   └── takeaways.js          # buildTakeaways, calculateSparklineTrend
├── api/
│   ├── cache.js              # apiCache (LRU/TTL map), cachedFetch, fetchWithFallback
│   ├── bundleSize.js         # fetchBundleSize (Bundlephobia API + heuristic fallback)
│   └── npm.js                # fetchPackageInfo, fetchWeeklyDownloads, fetchMonthlyDownloadsRange,
│                             # fetchUseCaseSearch, fetchLiveCandidates
├── components/
│   ├── MissingValue.jsx      # Reusable "—" missing value placeholder
│   ├── DownloadSparkline.jsx # SVG sparkline component with min/max scale support
│   ├── ResultRow.jsx         # ResultRow & PackageHubRow list row items
│   ├── skeletons.jsx         # DetailsSkeleton, TableSkeleton, ListSkeleton
│   ├── ErrorBoundary.jsx     # ComponentErrorBoundary class
│   ├── ModeTabs.jsx          # Mode navigation indicator bar
│   └── views/
│       ├── DetailsView.jsx       # View 1: Package metadata, stats, install block, actions
│       ├── DetailsStatTiles.jsx  # Download/size/dependencies/release stat tiles
│       ├── CompareView.jsx       # View 2: Package comparison container & controls
│       ├── CompareTable.jsx      # Side-by-side metric comparison table
│       ├── AlternativesView.jsx  # View 3: Keyword & download ranked alternatives
│       ├── UseCaseView.jsx       # View 4: Use case search recommendations
│       ├── DetailsSubView.jsx    # Shared drill-in inspect view
│       ├── UnmatchedView.jsx     # Unrecognized query state with suggestions
│       ├── EmptySandboxView.jsx  # Empty query sandbox preset selector
│       └── index.js              # Views barrel export
├── hooks/
│   ├── usePackageHub.js      # Steps A-F derivation pipeline & non-hub search effects
│   ├── useSubView.js         # Drill-in subView state, caching, scroll restore, history & escape listeners
│   └── index.js              # Hooks barrel export
├── NewComponent.jsx          # Root component: theme creation, intent routing, and view dispatch
└── index.jsx                 # Entry point wrapped with withHD (untouched)
```

---

## 3. Preservation of Public API & Named Exports

All original symbols imported by tests or consumer components are exported from `NewComponent.jsx`:

1. **Constants**: `THEME_TOKENS`, `KNOWN_BUNDLE_SIZES`, `GENERIC_PROFILE_WORDS`, `DESCRIPTION_STOPWORDS`
2. **Formatters & Libs**: `formatBytes`, `formatNumber`, `formatDate`, `cleanPkgName`, `isDevEnvironment`, `detectTypeScript`, `detectEsm`, `parseIntent`, `extractEntityPackage`, `extractProfileTerms`, `rankAlternatives`, `buildTakeaways`, `calculateSparklineTrend`
3. **API & Cache**: `apiCache`, `cachedFetch`, `fetchWithFallback`, `fetchPackageInfo`, `fetchWeeklyDownloads`, `fetchMonthlyDownloadsRange`, `fetchBundleSize`, `fetchUseCaseSearch`, `fetchLiveCandidates`
4. **Components**: `MissingValue`, `DownloadSparkline`, `ResultRow`, `PackageHubRow`, `DetailsSkeleton`, `TableSkeleton`, `ListSkeleton`, `ComponentErrorBoundary`, `ModeTabs`
5. **Views**: `DetailsView`, `CompareView`, `AlternativesView`, `UseCaseView`, `DetailsSubView`, `UnmatchedView`, `EmptySandboxView`
6. **Hooks**: `usePackageHub`, `useSubView`

---

## 4. Observations & Notes for Future Work (Preserved without changes)

During the refactoring, several quirks in the original implementation were observed. In accordance with the pure refactor instructions, their behavior was preserved exactly:

1. **Bundlephobia 403 Heuristic Fallback**:
   When Bundlephobia is unavailable or returns 403, size is estimated from the tarball unpack size using constant multipliers (0.75 for minified, 0.28 for gzip).
2. **External Link Navigation**:
   The `npm` button handler uses `window.open` while also setting `href` and `target="_blank"` on the anchor button. This redundancy was maintained to avoid breaking any click interception tests.
3. **Scroll Restoration on Back**:
   `savedScrollPosRef` stores `window.scrollY` before navigating into a sub-view. On return, it restores the scroll position via `requestAnimationFrame` and `window.scrollTo({ behavior: 'instant' })`.
4. **Keyword Deduplication in Use Case Search**:
   The use-case search maps npm packages and prepends the primary package if not included in the top 5 results.
5. **Clean Repository URL Regex**:
   `cleanRepoUrl` handles git+https, git://, and ssh URLs; preserved identical behavior across view modules.
6. **Query Routing & Entity Priority**:
   When hyperDart provides `searchData.entities` (with `sourceID` / `word` / `package`), these authoritative entity names take precedence over raw string pattern matching in `parseIntent(query, entityNames)`.

---

## 5. Verification Results

All automated test suites and pre-publish validation pass with zero errors:

```bash
# Test Suites
✔ scripts/test-component.js           -> 43 passed, 0 failed (including all 14 sample query behaviors)
✔ scripts/test-network-resilience.js  -> 17 passed, 0 failed
✔ scripts/test-package-hub.js         -> 18 passed, 0 failed
Total: 78 passed, 0 failed

# Production Build
✔ vite build                          -> dist/frontend/index.modern.js built cleanly (0 errors)

# Pre-Publish Validation
✔ node scripts/validate-publish.js   -> Pre-publish validation passed
```

