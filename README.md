# hyperDart npm Package Component

A standalone, ultra-low-latency developer component for the hyperDart search platform. Built with React 18, Vite 5, and Material UI v6, it parses natural-language npm queries using deterministic regex and renders package details, side-by-side comparisons, ranked alternatives, and use-case recommendations from live npm registry data.

Zero external AI/LLM dependencies are used: all routing, classification, term profiling, candidate discovery, and metric comparisons are deterministic, fast, and resilient.

---

## Features Added

### 1. Package Hub Architecture
A single package query (e.g. `react`, `express`, `lodash`, `@mui/material`) automatically activates Hub Mode and populates all four core views for that package simultaneously:
- **Entity Prioritization**: If `props.searchData.entities` specifies a package name, it takes precedence over raw regex parsing.
- **Unified Derivation Pipeline**: Resolves the primary package once, derives profile terms, and fetches a single shared candidate pool for Alternatives, Compare, and Use Case views.
- **Local Tab Navigation**: A mode tab bar allows toggling between Details, Compare, Alternatives, and Use case without re-running root searches or mutating the search query.
- **Inspect Drilldown**: Clicking "Details" on any candidate inspects that package locally with a breadcrumb back-navigation button.

### 2. Four Core Views

#### Details View
- **Release Metadata**: Latest version, release date, license, and dependency count.
- **Ecosystem Declarations**: Automatic detection of Native TypeScript (`.d.ts`), DefinitelyTyped (`@types/`), Pure ESM, Dual ESM/CJS, and CommonJS.
- **Operational Metrics**: Weekly download count (tabular numerals) and bundle size (minified and gzip).
- **Interactive Install Snippet**: One-click monospace install command (`npm i <package>`) with active copy feedback.
- **30-Day Download Sparkline**: Flat stroke SVG sparkline tracking 30-day download activity.
- **Deprecation Banner**: Prominent warning banner displayed when a package or version has been marked deprecated by its author.

#### Compare View
- **Multi-Package Comparison**: Side-by-side comparison for 2 to 3 packages (or version comparisons such as `express 4 vs 5`).
- **Auto-Selected Partner**: Automatically selects the #1 ranked alternative as the default comparison partner.
- **Partner Selector**: Dropdown to switch the comparison partner among candidate alternatives or add a third package.
- **Shared-Scale Sparklines**: Download sparklines share identical min/max Y-axis bounds across all packages in the row for visual comparison accuracy.
- **7-Day Average Trend**: Mitigates weekend volume dips by calculating `(last 7 days average - previous 7 days average) / previous 7 days average` with tooltip explanation.
- **Companion Footnote**: Clarifies that bundle size reflects the single package alone (e.g. React without react-dom).
- **Factual Takeaways**: Neutral summary bullet points highlighting size differentials, download volume ratios, and release recency without bias.

#### Alternatives View
- **Shared Keyword Ranking**: Candidates scored by count of matching non-generic keywords against the primary package, with weekly download count as tie-breaker.
- **Matched Keyword Chips**: Visual chips with mode accent borders identifying shared domain tags.
- **Match Confidence Indicator**: Candidates with zero keyword overlap are clearly badged as "Weak match".
- **Action Buttons**: Quick-action buttons to "Compare with [Primary]", "Details" (inspect), and "npm" (external registry link).

#### Use Case View
- **Natural Language Discovery**: Derives domain search phrases from primary package profile terms (or accepts custom queries like `best npm package for date formatting`).
- **Editable Search Field**: Inline input allowing developers to tweak search phrases and re-query on Enter without modifying the global search bar.
- **Primary Package Context**: Identifies and highlights the original package in the result list with a "This package" badge.

---

## 3. Network Resilience and Graceful Degradation

- **Multi-Tiered Registry Fallback**:
  - Tier 1: Local Vite dev proxy (`/proxy/npm-registry`).
  - Tier 2: Upstream registry mirror (`https://registry.npmmirror.com`).
  - Tier 3: Primary npm registry (`https://registry.npmjs.org`).
- **Bundlephobia Resilience**:
  - Standard User-Agent forwarding through dev server proxy to avoid HTTP 403 Forbidden.
  - Curated dictionary cache for standard packages.
  - Accurate fallback heuristic (`0.75 * unpackedSize` minified, `0.28 * unpackedSize` gzip) when external size APIs are unavailable.
  - Returns clean `N/A` without interrupting other metrics.
- **Parameter Sanitization**:
  - Strips version tags (e.g. `react@18.2.0` -> `react`) before requesting download stats.
  - Safely handles scoped packages (`@mui/material`).
  - Guards against empty or undefined queries, preventing malformed API requests.
- **In-Memory Cache & Cancellation**:
  - Global `apiCache` Map prevents duplicate network requests across tab switches.
  - `AbortController` integration cancels inflight requests on new query submission.

---

## 4. UI and Design System (Developer Tool Aesthetic)

Strictly adheres to developer tool design standards:
- **No Purples or Gradients**: Flat 1px borders replace drop shadows. Sparklines use single-stroke vectors with no area fills.
- **Restricted Corner Radii**: Maximum 6px border radius on inputs, buttons, and chips; maximum 8px on cards.
- **Neutral Primary Palette**: High-contrast neutral ink (`#111827` light / `#f9fafb` dark) for action buttons and text.
- **Mode Accents**: Reserved strictly for the active mode tab, top card border, and matched keyword chips:
  - Details: Blue (`#2563eb` light / `#3b82f6` dark)
  - Compare: Teal (`#0d9488` light / `#14b8a6` dark)
  - Alternatives: Amber (`#d97706` light / `#f59e0b` dark)
  - Use case: Green (`#16a34a` light / `#22c55e` dark)
- **Controlled Error Palette**: Red is reserved exclusively for deprecated packages and critical errors. Removed from logos, action buttons, rank numbers, and takeaway cards.
- **Directional Neutral Trends**: Download trends use neutral text with arrows (`↑ 12%`, `↓ 5%`) rather than value-judgment green/red.
- **Tabular Numerals**: Numeric metrics render using `fontVariantNumeric: 'tabular-nums'` for vertical column stability.
- **WCAG AA Compliance**: High-contrast ratios maintained across light and dark modes.

---

## 5. Development Sandbox Harness

Located in `src/sandbox/main.jsx`:
- **Query Persistence**: Query state is mirrored to the URL (`?q=<query>`) and `localStorage['hd_sandbox_query']`. Survives full page refreshes.
- **Tab State Persistence**: Active tab is stored separately via URL hash (`#tab`) and `localStorage['hd_sandbox_tab']`. Tab switching never modifies the search query.
- **Settings Persistence**: Theme (`hd_sandbox_theme`), layout (`hd_sandbox_layout`), and active test case (`hd_sandbox_case`) persist across refreshes.
- **Preset Test Cases**: Dropdown menu covering all primary views and edge cases (`Null Data (Case 1)`, `Unmatched (Case 2)`).
- **Layout Modes**: Live preview toggle between Mainline (full-width 960px) and Sidebar (compact 380px) contexts.
- **Reset Action**: Toolbar "Reset" button clears all URL parameters and sandbox storage keys, reverting to clean default state.

---

## 6. Project Structure

```
.
├── src/
│   ├── frontend/
│   │   ├── index.jsx           # Entry point wrapped with withHD HOC
│   │   └── NewComponent.jsx    # Root component (Hub, views, fetching, theme)
│   └── sandbox/                # Local dev sandbox harness
│       ├── main.jsx            # Test harness with persistent controls
│       └── index.css           # Sandbox root styling
├── scripts/
│   ├── test-component.js       # Unit tests (intent regex, formatting, TS/ESM)
│   ├── test-network-resilience.js # Resilience tests (clean params, bundle heuristics)
│   ├── test-package-hub.js     # Package Hub tests (profile terms, ranking, routing)
│   └── validate-publish.js     # Platform pre-publish validation script
├── docs/
│   └── HOWTO.md                # Comprehensive architecture and operations guide
├── public/                     # Static assets, privacy policy, and terms
├── hyperdart.config.js         # Platform discovery triggers and metadata
├── vite.config.js              # Dev proxy and UMD/ES build config
├── package.json
└── README.md
```

---

## 7. Commands

```bash
# Install dependencies
npm install

# Start local dev server (sandbox testbed at http://localhost:3000)
npm run dev

# Run all test suites (71 tests across 3 suites)
npm test

# Build production bundle (dist/frontend/index.modern.js)
npm run build

# Validate hyperdart.config.js against platform requirements
npm run validate
```

---

## 8. Test Suites

The project includes 71 automated tests across three specialized suites:

1. **`scripts/test-component.js` (36 tests)**:
   - Intent routing regex for Details, Compare, Alternatives, and Use Case.
   - Number and byte formatters (`formatBytes`, `formatNumber`, `formatDate`).
   - TypeScript detection (embedded `.d.ts` vs DefinitelyTyped `@types/`).
   - ESM detection (Pure ESM vs Dual ESM+CJS vs CommonJS).

2. **`scripts/test-network-resilience.js` (17 tests)**:
   - Package name sanitization and version stripping.
   - Missing/empty parameter safeguards.
   - Error handling in `cachedFetch` and `fetchWithFallback`.
   - Bundlephobia 403 handling and unpacked size ratio heuristics.

3. **`scripts/test-package-hub.js` (18 tests)**:
   - Entity package extraction from `searchData.entities`.
   - Domain keyword extraction and generic word filtering.
   - Candidate ranking by shared keyword overlap.
   - Case-insensitive package resolution (`reACT` -> `react`).
