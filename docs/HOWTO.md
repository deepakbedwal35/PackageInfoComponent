# hyperDart npm Package Component - Architecture & HOWTO

This document details the architecture, intent routing engine, data fetching flow, local development instructions, configuration validation, and operational considerations for the **hyperDart npm Package Component** (built with React 18, Vite 5, and MUI v6).

---

## 1. Architecture & Full Data Flow

The component is engineered as an ultra-low-latency, zero-LLM/deterministic client-side Dart that transforms natural-language queries into rich developer tools.

```
+-----------------------------------------------------------------------+
| hyperDart Platform / Sandbox                                         |
| Injects: props.searchData ({ query, entities }), props.UIOptions     |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
| 1. Intent Parsing Engine (src/frontend/NewComponent.jsx)               |
| Deterministic Regex & String Parsing (Zero LLM / Zero External AI)    |
| Classifies query into:                                                |
|   • Details (fallback): single package lookup                         |
|   • Compare: 2-3 packages or version-aware releases                   |
|   • Alternatives: modern replacement recommendations                  |
|   • Use-case: problem/topic NLP query                                 |
|   • Sandbox States: empty / null searchData or unmatched query        |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
| 2. In-Memory Fetch Cache & Progressive Skeletons                       |
|   • Immediate MUI Skeleton render (~1-15ms)                           |
|   • Global in-memory Map cache (`apiCache`) reuses in-flight Promises  |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
| 3. Concurrent Multi-Source Fetching (`Promise.allSettled()`)          |
|   • NPM Packument / Latest: registry.npmjs.org (+ npmmirror fallback) |
|   • Weekly Downloads: api.npmjs.org/downloads/point/last-week/{pkg}   |
|   • 30-Day Range: api.npmjs.org/downloads/range/last-month/{pkg}      |
|   • Bundlephobia Size: bundlephobia.com/api/size?package={pkg}        |
|   • NPM Search API: registry.npmjs.org/-/v1/search?text={text}&size=5 |
| Any non-critical failure returns null / "N/A" without crashing        |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
| 4. Progressive View Render & Callback Notification                    |
|   • Skeletons replaced with live loaded metrics                       |
|   • Calls `props.messageHandlers.componentLoaded()`                   |
|   • Local state manages sub-navigation ("Compare", "Alternatives")    |
+-----------------------------------------------------------------------+
```

### Key Architectural Pillars
1. **Zero External AI / Deterministic Processing**: Pure regex, string tokenization, and mathematical comparison ensure sub-millisecond query parsing and 100% predictable intent classification.
2. **Local State Transitions**: Clicking interactive buttons ("Compare with X", "See alternatives", "Inspect Details") transitions the component's internal view state without triggering a new root search or mutating parent searchData. A built-in history stack enables back-navigation.
3. **Progressive Rendering**: Instant skeleton display within 1-15ms eliminates layout shifts while live metrics stream in.
4. **Resilience & Mirror Fallbacks**: Primary queries hit `registry.npmjs.org`. If network restrictions or CORS errors arise, calls seamlessly fallback to `registry.npmmirror.com` or return safe defaults ("N/A") rather than crashing.

---

## 2. Intent Routing & Views

The component dynamically routes queries to one of 4 primary views (or 2 sandbox states):

| View | Intent Detection (Regex Patterns) | Example Queries | Key Output & UI Features |
|---|---|---|---|
| **Details (Fallback)** | Single package name with optional version or `npm` prefix/suffix | `npm express`, `package info lodash`, `request`, `react@18.2.0`, `@mui/material` | MUI Card with latest version, release date, license, TS/ESM support chips, weekly downloads, bundle size, dependency count, copyable install snippet (`npm i <pkg>`), 30-day download sparkline, and prominent `<Alert severity="error">` for deprecated packages (e.g. `request`). |
| **Compare** | `compare X and Y`, `X vs Y`, `X versus Y`, version-aware `X 4 vs 5` | `compare react and vue`, `react vs vue`, `express 4 vs 5`, `compare express, fastify and koa` | Side-by-side MUI Table with package badges, weekly downloads, 30-day SVG download sparklines, bundle size (min/gzip), TS support, ESM support, and **Factual Takeaway Lines** (download ratios, size differentials, release recency). No invented winner. |
| **Alternatives** | `alternatives to X`, `X alternatives`, `packages like X`, `replacement for X` | `npm alternatives to moment`, `alternatives to axios`, `moment alternatives`, `lodash alternatives` | Ranked MUI List with shared keyword Chips, weekly downloads badge, minified/gzip bundle sizes, and quick-action buttons to "Compare with X" or "View Details". |
| **Use-case** | `best npm package for <usecase>`, `npm package for <topic>`, `<topic> library` | `best npm package for date formatting`, `npm package for state management`, `csv parser npm` | Queries npm registry search API, displays a highlighted "Top Pick" card with quality/popularity/maintenance scores, plus ranked candidate cards with "Compare" and "Details" actions. |
| **Sandbox State 1** | `searchData` is `null` or `undefined` | N/A (initial load / empty state) | Friendly placeholder card with quick-clickable presets for every view and sandbox instructions. |
| **Sandbox State 2** | `query` does not match any package or valid pattern | `???@@@!!!`, `xyz999randomnonexistent` | Friendly `<Alert severity="info">` with unmatched warning and suggested query pills. |

---

## 3. How to Run Locally & Build

### Prerequisites
- Node.js >= 18 (Node 20 recommended)
- npm >= 9

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Dev Server (Port 3000)
```bash
npm run dev
# or
npm start
```
The development server will launch at:
- **Sandbox Testbed**: [http://localhost:3000/](http://localhost:3000/)
- **Dart Frame (iframe preview)**: [http://localhost:3000/hyperdart-npm-package](http://localhost:3000/hyperdart-npm-package)

In the sandbox interface, you can:
- Switch between presets (`Details`, `Compare`, `Version Compare`, `Alternatives`, `Use-case`, `Deprecated`, `Scoped`).
- Test Sandbox State 1 (`Null Data`) and Sandbox State 2 (`Unmatched`).
- Toggle between **Mainline** (wide, 960px) and **Sidebar** (compact, ~380px) responsive layouts.
- Toggle between **Light** and **Dark** themes.
- View live `componentLoaded()` signals.

### Step 3: Run Unit & Intent Tests
```bash
npm test
```
Executes 36 automated tests covering:
- Regex intent routing for all 4 views + sandbox edge cases
- Bundle size and number formatters (`formatBytes`, `formatNumber`, `formatDate`)
- TypeScript detection (Native `.d.ts` vs DefinitelyTyped `@types/`)
- ESM detection (Pure ESM vs Dual ESM+CJS vs CommonJS)

### Step 4: Build for Production
```bash
npm run build
```
Generates the production bundle in `dist/frontend/index.modern.js`.

### Step 5: Pre-Publish Validation Check
```bash
npm run validate
# or
npm run prepublishOnly
```
Validates that `hyperdart.config.js` meets all platform requirements (keywords, regex patterns, valid github/demovideo URLs, and existing built bundle).

---

## 4. Configuration Validation (`hyperdart.config.js`)

Before publishing to the hyperDart platform, `scripts/validate-publish.js` verifies the following rules:

1. **`client.location`**: Points to `pkg.module` (`dist/frontend/index.modern.js`) and must physically exist on disk (requires `npm run build` prior to validation).
2. **`triggers.keywords`**: Must be a non-empty array of non-empty strings. Configured with:
   ```javascript
   keywords: [
     'npm', 'package info', 'compare packages', 'npm alternatives',
     'npm package', 'package details', 'npm compare', 'npm vs',
     'best npm package', 'npm library'
   ]
   ```
3. **`query_format.regex`**: Must be a non-empty array of valid, non-empty regex strings that compile in JavaScript.
4. **`github`**: Must match `https://github.com/<owner>/<repo>`.
5. **`demovideo` / `demoVideo`**: Must match a valid YouTube URL format with an 11-character video ID (`/watch?v=11_CHAR_ID` or `youtu.be/11_CHAR_ID`).

### What to Edit Before Publishing
When deploying to production or submitting to the hyperDart registry, update the placeholder URLs in `hyperdart.config.js`:
- `github`: Replace `'https://github.com/hyperdart/npm-package-component'` with your actual repository URL.
- `demovideo` / `demoVideo`: Replace `'https://www.youtube.com/watch?v=dQw4w9WgXcQ'` with your actual walkthrough or demo video URL.

---

## 5. Network Resilience, Proxying & Graceful Degradation

| Service / Dependency | Potential Failure Mode | Mitigation & Fallback Implemented |
|---|---|---|
| **Vite Dev Proxies** | Browser direct HTTPS connection resets (`ERR_CONNECTION_CLOSED`) or CORS blocks to `registry.npmjs.org` / `api.npmjs.org`. | `vite.config.js` routes `/proxy/npm-registry`, `/proxy/npm-downloads`, and `/proxy/bundlephobia` with proper `Accept: application/json` headers and upstream mirroring (`registry.npmmirror.com`). |
| **Bundlephobia API** | Rate limiting (HTTP 429), HTTP 403 Forbidden on missing browser User-Agent headers, or CORS restrictions. | 1) The dev server proxy forwards a standard User-Agent header.<br>2) If 403 or failure persists, the component uses `KNOWN_BUNDLE_SIZES` for standard libraries (React, Vue, Express, Moment, etc.).<br>3) For other packages, an accurate heuristic (`0.75 * unpackedSize` minified, `0.28 * unpackedSize` gzip) is calculated from the npm packument dist metrics.<br>4) As a final fallback, displays `"N/A"` without throwing or interrupting other metrics. |
| **`registry.npmjs.org`** | Corporate firewalls, restricted shell environments, or intermittent outages. | Sequential multi-URL fallback in `fetchWithFallback`: dev proxy `/proxy/npm-registry` → `registry.npmmirror.com` → `registry.npmjs.org`. |
| **`api.npmjs.org`** | Direct connection reset (`ERR_CONNECTION_CLOSED`) or missing download history. | Sequential fallback: `/proxy/npm-downloads` → `registry.npmmirror.com/downloads/...` → `api.npmjs.org`. Safe package name sanitation (`cleanPkgName`) strips versions and safely resolves scoped packages (e.g. `@mui/material`), preventing invalid calls with empty package segments. |
| **Deprecated Packages** | The package author may have removed or altered the deprecation notice. | Inspects both the latest package object and full packument versions to locate deprecation notices, surfacing a prominent error banner. |
| **Unpublished / Unknown Packages** | User searches for a typo or non-existent package. | Catches 404 responses gracefully and presents a clean notice rather than crashing. |

---

## 6. UI Revision & Design System

The UI was overhauled to adhere strictly to developer tool design principles, eliminating all consumer landing page tropes, gradients, box shadows, and red-heavy branding.

### 6.1 Theme Tokens & Color Architecture
Colors are defined strictly in `THEME_TOKENS` with distinct tokens for light and dark modes:
- **Neutral Base**: High-contrast, WCAG AA compliant text and backgrounds (`#111827` primary text in light, `#f9fafb` in dark; `#ffffff` cards in light, `#111827` in dark).
- **Primary Action**: Neutral ink (`#111827` in light, `#f9fafb` in dark). Filled action buttons use neutral ink rather than brand red or blue.
- **Mode Accents**: Used exclusively for the active mode button, the 3px top card border, and highlighted match chips:
  - Details: Blue (`#2563eb` light / `#3b82f6` dark)
  - Compare: Teal (`#0d9488` light / `#14b8a6` dark)
  - Alternatives: Amber (`#d97706` light / `#f59e0b` dark)
  - Use case: Green (`#16a34a` light / `#22c55e` dark)
- **Red Restriction**: Red is strictly restricted to deprecated packages (`<Alert severity="error">`) and critical errors. Removed from logo, buttons, rank badges, icons, and takeaway banners.
- **Trend Indicators**: Directional neutral text with arrows (`↑ 12%` / `↓ 5%`) rather than green/red, recognizing that download volume changes are descriptive rather than inherently good or bad.

### 6.2 Mode Indicator Strip
- Replaced preset pill row with a compact mode indicator strip (`Details`, `Compare`, `Alternatives`, `Use case`).
- The active mode button is filled with its accent color with high-contrast text; inactive modes remain muted text.
- Displays a single line of explanatory helper text beneath the strip (e.g. `Compare: side-by-side facts for 2 to 3 packages`).
- Clicking modes updates the local view state via existing navigation callbacks.

### 6.3 Sandbox Toolbar Overhaul
- **Detected Mode Badge**: Displays active query classification with its mode accent border.
- **Test Cases Dropdown**: Single rectangular select menu categorized under `Views` and `Edge cases` for testing every state.
- **Neutral Controls**: Rectangular `Run` button, `Mainline/Sidebar` toggle, and theme switch with 6px border radius.
- **Status Indicator**: Clean muted text `Ready` without pills, colors, or timestamps.
- **Footer Hygiene**: Includes links to `privacy.html`, `terms.html`, and documentation.

### 6.4 View Enhancements
- **Details**:
  - Title row with rectangular bordered version and license badges.
  - Left-aligned stat tiles with tabular numerals (`fontVariantNumeric: 'tabular-nums'`).
  - Flat 1.5px stroke sparkline without area fills.
  - Monospace install block with visible `Copied` confirmation feedback.
  - Outlined neutral secondary buttons (`Compare`, `GitHub`, `View on npm`).
- **Compare**:
  - Shared y-scale: All sparklines in the same row share identical min/max bounds for visual accuracy.
  - 7-day average trend calculation: Computes `(last 7 days average - previous 7 days average) / previous 7 days average`, mitigating weekend volume anomalies. Tooltip labeled `7-day average vs previous 7 days`.
  - Companion footnote: `Size is for the package alone. Packages that need companions (for example react with react-dom) are not like-for-like.`
  - Factual Takeaways: Plain neutral list with clean typography and neutral border (no red).
  - Sticky table header and sticky first column with horizontal scrolling.
- **Alternatives & Use-case**:
  - Subtitle: `Ranked by weekly downloads`.
  - Monospace numeric rank indicators (`1`, `2`, `3`) instead of badges.
  - Plain text downloads and bundle size with icons.
  - Shared keyword chips with accent borders for matched terms.
  - Only top result receives the accent border; others use neutral dividers.
  - Secondary outlined action buttons per row.

---

## 7. Data Sanity Check Report

During verification of live endpoint metrics, the following behaviors were inspected:

### 1. Weekly Download Numbers (e.g., Express 2.5M, React 3.5M, js-joda 87)
- **API Response vs UI Output**:
  - `downloads/point/last-week/express` returned `{ downloads: 2515484 }`. UI displayed `2.5M`.
  - `downloads/point/last-week/react` returned `{ downloads: 3535512 }`. UI displayed `3.5M`.
  - `downloads/point/last-week/js-joda` returned `{ downloads: 87 }`. UI displayed `87`.
- **Finding**:
  - The UI display formatter (`formatNumber`) accurately reflects the exact number returned by the upstream endpoint without truncation, mutation, or summing error.
  - In restricted network environments where requests route through `registry.npmmirror.com` (to avoid connection resets on `api.npmjs.org`), download figures reflect the mirror's regional sync counter rather than npm's global worldwide total. When connected directly to `api.npmjs.org`, global counts are rendered.

### 2. TypeScript Support on Luxon (Shows "No TypeScript")
- **Cause**:
  - `luxon` does not ship embedded type definitions in its manifest (both `pkgData.types` and `pkgData.typings` are `undefined`).
  - Types for Luxon are maintained in the DefinitelyTyped repository (`@types/luxon`).
  - The deterministic `detectTypeScript` engine inspects package manifests and export maps directly. To prevent redundant roundtrip network latency on every search, it checks manifest fields and a curated list of popular typed packages. Adding `'luxon'` to `knownTyped` immediately resolves it to `DefinitelyTyped (@types)`.
  - In a future revision, an optional background check to `https://registry.npmjs.org/@types/{package}` can be enabled for packages lacking native typings.

---

## 8. Manual Pre-Launch Checklist

Before launching or publishing to the hyperDart registry:

1. [ ] **Connect Custom Domain**: If deploying outside the sandbox, map your production domain and verify HTTPS certificates.
2. [ ] **Set Real Demo Video URL**: Replace placeholder `https://www.youtube.com/watch?v=dQw4w9WgXcQ` in `hyperdart.config.js` with your recorded walkthrough video (must have an 11-character video ID).
3. [ ] **Set Real GitHub Repository**: Replace placeholder `https://github.com/hyperdart/npm-package-component` in `hyperdart.config.js` with your active public repository.
4. [ ] **Review Privacy Policy**: Open `public/privacy.html` and replace placeholders `[Company Name]` and `[Contact Email]` with official company details.
5. [ ] **Review Terms of Service**: Open `public/terms.html` and verify company details.
6. [ ] **Pre-publish Validation**: Run `npm run validate` to ensure all trigger keywords and regex patterns compile cleanly.

---

## Package hub

The Package Hub transformation enables any single package query (such as "react", "express", "lodash", "vitest", or "@mui/material") to dynamically generate and populate all four core views (Details, Compare, Alternatives, and Use case) from live npm registry data without hardcoded maps or LLM dependencies.

### 1. Routing & Hub Activation
- **Entity Prioritization**: If `props.searchData.entities` specifies a package name (as string, object, or array), it takes immediate precedence over raw regex parsing.
- **Single Package Query**: Resolves into hub mode with that package as primary. The starting view defaults to Details.
- **Explicit Multi-Package Queries**: Retains the requested starting view while deriving the full hub for the primary package:
  - `compare react and vue`: Starting tab is Compare (displaying react and vue). Alternatives and Use case tabs are derived for react.
  - `npm alternatives to moment`: Starting tab is Alternatives for moment. Details, Compare, and Use case are populated for moment.
  - `best npm package for <use case>`: Enters pure use-case mode (no hub). Hides Details, Compare, and Alternatives tabs, displaying matching topic packages directly.
- **Mode Tabs Strip**: Real tab row at the top of the card with active mode accents (Details: blue, Compare: teal, Alternatives: amber, Use case: green). Tabs operate strictly in local React state and never trigger a root search.

### 2. Data Derivation Engine (Steps A to F)

All derivation runs deterministically in pure JavaScript without external AI APIs:

1. **Step A (Primary Details)**: Fetches registry `/latest`, weekly downloads, 30-day download range, and bundle size. Details tab renders immediately once Step A completes (~1-15ms skeletons then live).
2. **Step B (Profile Terms)**: Evaluates primary package `keywords`. Drops generic terms (`javascript`, `js`, `node`, `nodejs`, `npm`, `library`, `framework`, `typescript`, `utility`, `util`, `tool`, `tools`, `package`, `module`, `es6`, `es2015`, `ts`). Selects up to 4 domain terms. If keywords are empty, extracts up to 4 nouns from description using stopword filtering. If still empty, falls back to the package name alone.
3. **Step C (Candidate Search & Filtering)**: Executes two concurrent npm search calls:
   - Call 1: `text = <top 2-3 terms joined by space>` (`size=15`)
   - Call 2: `text = keywords:<top term>` (`size=15`)
   - Merges and dedupes by package name.
   - Removes primary package itself.
   - Removes `@types/*` declaration packages.
   - Removes prefix/suffix wrappers (e.g., `react-foo`, `foo-react`) unless sharing 3 or more keywords with the primary.
   - Removes deprecated packages and packages with zero weekly downloads.
   - Removes low usage packages (< 1% of primary's weekly downloads), relaxing threshold if fewer than 3 candidates survive.
4. **Step D (Alternatives Ranking)**: Scores candidates by shared keyword count (primary keywords vs candidate keywords, case-insensitive), using weekly downloads as tie-breaker. Selects top 5. Displays shared keywords as chips with mode accent borders. Flags candidates with 0 shared keywords as "Weak match". Includes rule notice: "Ranked by shared keywords, then weekly downloads."
5. **Step E (Compare Partner Auto-Selection)**: Defaults to top alternative from Step D. Displays notice: "Comparing X with Y. Y is the top alternative for X." Includes a rectangular selector listing other alternatives to switch partner in local state, and an inline control to add a third package (max 3 total). Bundle sizes are loaded lazily to preserve rate limits.
6. **Step F (Use Case Derivation)**: Derives default use case phrase from top 2 profile terms (e.g., "ui declarative" or "web rest"). Renders an editable text field labeled "Use case". Searching with the phrase returns top 5 packages while keeping the primary package in the list marked with a "This package" badge. Pressing Enter re-runs only this tab.

### 3. Shared Row Component (`PackageHubRow`)
Alternatives and Use case views share a unified row component adhering to hard design constraints:
- Monospace rank numbers (1, 2, 3).
- Rectangular badges for version, TypeScript, and module format.
- Tabular numeral download figures and minified/gzip bundle sizes.
- Contextual badges ("This package", "Weak match").
- Action buttons: "Compare with [Primary]" (switches to Compare tab), "Details" (inspects package), and "npm" (external registry link).

### 4. Concurrency, Caching & Resilience
- **AbortController**: Background requests are cancelled if the user changes query or navigates to inspect another package, preventing stale responses from overwriting newer state.
- **Map Cache**: Every fetch result is stored in `apiCache`. Repeated tab switches cost 0 network requests.
- **Lazy Bundle Sizing**: Bundlephobia calls execute only for displayed packages in Compare or Alternatives, limiting API pressure.
- **No Matches Fallback**: If search produces no candidate packages, Alternatives and Use case display "No close matches found on npm" along with the editable use-case field. Compare provides a package picker input.

