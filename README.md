# hyperdart-npm-package

A standalone HyperDart search component for developers that displays npm package details, side-by-side comparisons, alternatives, and use-case recommendations from live registry data.

| Item | Details |
|---|---|
| Demo Video | https://youtu.be/Ai-L7W6o2OM |
| Repository | https://github.com/deepakbedwal35/PackageInfoComponent |
| Placements | Mainline (960px max width) and Sidebar (380px max width) |
| Themes | Light mode and dark mode |

## What It Does

This component runs inside the HyperDart search engine when a search query matches npm package keywords or patterns. It deterministically classifies queries into one of four views: Details, Compare, Alternatives, or Use case. All data is fetched directly from npm APIs on the client, with zero runtime AI or LLM dependencies.

| Example Query | View Opened | Key Information Shown |
|---|---|---|
| `npm express` | Details | Version, license, TypeScript/ESM flags, weekly downloads, bundle size, install command |
| `latest version of react` | Details | Version banner highlighted, publish date, dependency count |
| `compare react and vue` | Compare | Side-by-side table with metrics, shared-scale sparklines, and factual takeaways |
| `compare express, fastify, koa` | Compare | Three-column comparative table with column removal and retry options |
| `express 4 vs 5` | Compare | Version-aware comparison between major releases with shared package downloads |
| `npm alternatives to moment` | Alternatives | Modern replacements ranked by keyword overlap and weekly downloads |
| `best npm package for date formatting` | Use case | Top recommendations ranked by npm search relevance and weekly downloads |
| `npm request` | Details | Prominent deprecation alert showing the author's deprecation message |

## Features by View

### Details
- Displays version, license, release date, unpacked size, and dependency count.
- Detects TypeScript (native `.d.ts` or DefinitelyTyped `@types/`) and module format (Pure ESM, Dual ESM/CJS, or CommonJS).
- Shows weekly downloads with tabular numerals, bundle size (minified and gzip), and a 30-day SVG download sparkline.
- Provides a one-click monospace install command (`npm i <package>`) with temporary copy confirmation.
- Displays an error alert banner when a package is marked deprecated.
- Includes local buttons to switch to Compare or Alternatives for the package without triggering a new search.

### Compare
- Renders a side-by-side table for 2 to 3 packages or two versions of the same package.
- Auto-selects the top alternative as the initial comparison partner if only one package was queried.
- Supports switching partners via dropdown, adding a third package, or swapping/selecting versions.
- Sparklines share identical Y-axis bounds across columns in the row so visual differences reflect real numbers.
- Computes a 7-day average percentage change to smooth weekend download drops.
- Generates neutral factual takeaways and includes an isolated error boundary per column with retry.

### Alternatives
- Renders ranked replacements based on shared manifest keywords, breaking ties with weekly downloads.
- Labels shared keyword tags with accent borders; badges packages with zero overlap as "Weak match".
- Displays weekly download counts and minified/gzip bundle sizes for each candidate.
- Includes inline actions to view package details in a sub-view, compare with the primary package, or open npmjs.com.

### Use Case
- Runs natural-language searches for problem descriptions (e.g. `best npm package for date formatting`).
- Ranks candidates using a transparent blend: normalized npm search score and normalized log10 weekly downloads.
- Subtitle clearly states "Ranked by npm search relevance and weekly downloads" without declaring any winner.
- Clicking "Details" opens a sub-view with a "Back to results" button and a "Set as primary" action.

## Design Decisions

- Answer first: Core answers (e.g., version banner, install snippet) render immediately above secondary metrics.
- No invented winners: Factual comparisons avoid subjective labels or claiming that any library is "the best".
- Shared-scale sparklines: 30-day download charts use identical Y-axis bounds across compared packages so visual slopes are accurate.
- Flat developer-tool aesthetic: 1px borders, 4-6px border radii, no background gradients, and tabular numerals for vertical stability.
- Responsive layout: Adapts between wide mainline (up to 960px) and compact sidebar (380-420px).
- Theme tokens: Centralized token system supporting light and dark themes with dedicated mode accent colors.

## Data Sources and Accuracy

| Source | Endpoint | Data Provided |
|---|---|---|
| npm Registry | `https://registry.npmjs.org/<pkg>` | Version manifests, license, release dates, dependencies, deprecation notices |
| npm Downloads API | `https://api.npmjs.org/downloads/point/last-week/<pkg>` | Weekly download totals |
| npm Downloads API | `https://api.npmjs.org/downloads/range/last-month/<pkg>` | 30-day daily download series for sparklines |
| npm Search API | `https://registry.npmjs.org/-/v1/search?text=<phrase>` | Search results and relevance score (`score.final`) |
| Bundlephobia | `https://bundlephobia.com/api/size?package=<pkg>` | Minified and gzip bundle sizes |
| npmmirror (Fallback) | `https://registry.npmmirror.com` | Registry and download fallback mirror when upstream is unreachable |

### Accuracy Notes
- Estimated bundle sizes: When Bundlephobia is slow or rate-limited, size is estimated from unpacked size (0.75 minified, 0.28 gzip ratio) and marked "Estimated".
- Mirror fallback: When corporate firewalls or networks block direct npm registry endpoints, requests fallback to npmmirror.
- Downloads are package-wide: npm does not record downloads per version; queries like `express 4 vs 5` show package-level download totals.
- Heuristic ranking: Alternative ranking relies on manifest keywords and download volumes, not source code analysis.

## Robustness

- Caching: In-memory Map caches prevent duplicate network requests across tab switches and sub-view navigation.
- Request cancellation: AbortController aborts ongoing HTTP requests when tabs switch or the query changes.
- Fallbacks and timeouts: Requests race against timeouts; non-critical failures render "N/A" instead of crashing the UI.
- Unknown packages: Invalid package names render an informative card without throwing unhandled exceptions.
- Rate limiting: Download and search lookups cap concurrency (e.g. concurrency of 4 for use-case downloads).
- Error boundaries: The root content and individual compare columns are wrapped in error boundaries with retry buttons.

## Tech Stack and Libraries

- React 18: Client-side component rendering and hooks (`useMemo`, `useCallback`, `useRef`, `useState`).
- Vite 5: Dev server with proxy middleware and modern ES module production bundling.
- Material UI (MUI) v6: Accessible base UI components customized to a flat developer-tool design.
- MUI Icons: Lightweight SVG icons for metadata and actions.
- No LLM runtime dependencies: All parsing, categorization, and ranking run client-side with deterministic algorithms.

## Project Structure

```
.
├── hyperdart.config.js       # HyperDart triggers, placement, and module configuration
├── index.html                # Local development HTML entry
├── package.json              # Project dependencies, scripts, and publish settings
├── resource.json             # Structured query schema for the HyperDart platform
├── searchData.json           # Sample search queries for sandbox testing
├── vite.config.js            # Vite build and dev proxy server configuration
├── dist/                     # Production build output
│   └── frontend/
│       └── index.modern.js   # Built standalone ES module bundle
├── docs/
│   └── HOWTO.md              # Architecture and operations documentation
├── public/                   # Static assets (terms, privacy, icons)
├── scripts/
│   ├── test-component.js     # Unit tests for routing, formatting, and tab logic
│   ├── test-network-resilience.js # Resilience tests for API fallbacks and heuristics
│   ├── test-package-hub.js   # Tests for term profiling and candidate ranking
│   ├── test-query-transitions.js  # Tests for state transitions between queries
│   └── validate-publish.js   # Pre-publish validation for hyperdart.config.js
└── src/
    ├── frontend/
    │   ├── index.jsx         # Standalone entry point wrapped with withHD HOC
    │   ├── NewComponent.jsx  # Main component orchestrator, hub setup, and mode tabs
    │   ├── api/              # API clients for npm registry, downloads, search, and bundle size
    │   ├── components/       # UI elements (sparkline, error boundary, tabs, skeletons)
    │   │   └── views/        # Views for Details, Compare, Alternatives, Use Case, and Sandbox
    │   ├── constants/        # Theme tokens, known bundle sizes, and stopwords
    │   ├── hooks/            # Data fetching (usePackageHub) and drill-in (useSubView) hooks
    │   └── lib/              # Intent parser, formatters, ranking algorithms, and detectors
    └── sandbox/
        ├── index.css         # Sandbox harness styling
        └── main.jsx          # Interactive testbed with theme, query, and layout controls
```

## Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev

# Run all test suites
npm test

# Build production bundle (outputs to dist/frontend/index.modern.js)
npm run build

# Validate configuration
npm run validate
```

### Publishing
1. Create the package in the HyperDart Partner Portal.
2. Add your HyperDart auth token to `.npmrc`.
3. Bump the patch version: `npm version patch`.
4. Publish: `npm publish` (do not use `--ignore-scripts`, as `prepublishOnly` runs validation).

## Testing

Automated tests are divided into three suites executed via `npm test`:
- `scripts/test-component.js`: 88 passing tests covering 14 hackathon query patterns, number/byte formatters, TypeScript/ESM detection, compare helpers, tab visibility, and use-case ranking.
- `scripts/test-network-resilience.js`: 18 passing tests covering parameter sanitization, empty inputs, network errors, and bundle size estimation.
- `scripts/test-package-hub.js`: 18 passing tests covering entity extraction, domain term extraction, and keyword overlap ranking.

Total: 124 passing automated tests. Live API behavior was tested manually in the sandbox at `http://localhost:3000/`.

## How to Add a Query Pattern

All query patterns are defined in `src/frontend/lib/parseIntent.js` inside the `parseIntent(query, entityNames = [])` function.

To add a new pattern, insert a regex check before the generic fallbacks:

```javascript
// Example: match "bundle size of <package>"
const sizeMatch = clean.match(/^(?:bundle\s+size\s+of|size\s+of)\s+([@a-z0-9_.-]+)$/i);
if (sizeMatch && sizeMatch[1]) {
  return { view: 'details', package: cleanPkgName(sizeMatch[1]), focus: 'size', rawQuery: clean };
}
```

Add the pattern to `query_format.regex` in `hyperdart.config.js` and add a test case in `scripts/test-component.js`.

## Known Limitations

- Bundlephobia rate limits: Bundlephobia may rate-limit or return 403 on high-volume traffic; the component falls back to heuristics or displays N/A.
- Package-wide download metrics: The npm registry does not track downloads per version; version comparisons show total package downloads.
- Keyword overlap heuristic: Alternatives ranking depends on manifest keywords; packages with missing keywords may rank lower.
- Upstream mirror lag: When using the npmmirror fallback, manifest and download figures can experience a short sync delay.
- External API availability: Registry search and download data depend on third-party service uptime.

## AI Tools Used

TODO (author to complete): Which AI tools I used (for example Gemini/Antigravity for code generation and refactoring, Claude for planning and prompts), what they generated, and what I wrote, changed or reviewed myself. I can explain every part of this code.
