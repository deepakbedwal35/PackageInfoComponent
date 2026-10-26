# hyperDart npm Package Component — Architecture & HOWTO

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

## 5. Known Limitations & Graceful Degradation

| Service / Dependency | Potential Failure Mode | Mitigation & Fallback Implemented |
|---|---|---|
| **Bundlephobia API** | Rate limiting (HTTP 429), newly published packages without build caches, or CORS restrictions in browser contexts. | The component catches Bundlephobia rejections silently, returns `{ size: null, gzip: null }`, and displays `"N/A"` in the UI without throwing or breaking other metrics. |
| **`registry.npmjs.org`** | Corporate firewalls, restricted shell environments, or intermittent outages. | The fetch layer includes automated fallback to `registry.npmmirror.com` for package metadata and search API queries. |
| **`api.npmjs.org`** | Historic download records unavailable for brand new or scoped packages. | Returns `null` and displays `"N/A"` for download counts and `"No trend data"` for the sparkline. |
| **Deprecated Packages** | The package author may have removed or altered the deprecation notice. | Inspects both the latest package object and full packument versions to locate deprecation notices, surfacing a prominent error banner. |
| **Unpublished / Unknown Packages** | User searches for a typo or non-existent package. | Catches 404 responses gracefully and presents a clean notice rather than crashing. |

