# hyperdart-npm-package

A standalone HyperDart search component that helps a developer decide which npm package to use. It shows package details, side-by-side comparisons (including version-aware ones), ranked alternatives, and use-case recommendations from live registry data.

| Item | Details |
|---|---|
| Demo Video | https://youtu.be/Ai-L7W6o2OM |
| Repository | https://github.com/deepakbedwal35/PackageInfoComponent |
| Placements | Mainline (960px max width) and Sidebar (380px max width) |
| Themes | Light mode and dark mode |
| Runtime AI | None. All parsing and ranking is deterministic JavaScript |

## Table of Contents

1. [The Idea](#the-idea)
2. [What It Does](#what-it-does)
3. [Features by View](#features-by-view)
4. [Design Decisions](#design-decisions)
5. [How It Was Built](#how-it-was-built)
6. [Data Sources and Accuracy](#data-sources-and-accuracy)
7. [Robustness](#robustness)
8. [Tech Stack and Libraries](#tech-stack-and-libraries)
9. [Project Structure](#project-structure)
10. [Getting Started](#getting-started)
11. [Testing](#testing)
12. [How to Add a Query Pattern](#how-to-add-a-query-pattern)
13. [Known Limitations](#known-limitations)
14. [AI Tools Used](#ai-tools-used)

## The Idea

Choosing an npm package usually means opening several sites and comparing numbers by hand. A raw registry response does not answer the real question: "which one should I use?" or "what replaces this?".

This component is built around one idea, the **Package Hub**. A single package query opens a hub for that package with four views: Details, Compare, Alternatives, and Use case. The developer moves between them with local tabs, without running a new search. The first thing on screen is the answer (version, key numbers, install command), and deeper detail is one click away.

Two rules shape every screen:

- **Be factual.** The component never declares a "best" package. It shows numbers, ratios and dates and lets the developer decide.
- **Never break.** If any non-critical data source fails, that value shows `N/A` and the rest of the view still works.

## What It Does

The component runs inside the HyperDart search engine when a query matches npm package keywords or patterns. It classifies the query into one of four views using regular expressions, then fetches data directly from public npm APIs in the browser.

| Example Query | View Opened | Key Information Shown |
|---|---|---|
| `npm express` | Details | Version, license, TypeScript/ESM flags, weekly downloads, bundle size, install command |
| `latest version of react` | Details | Latest version and release date first, then key details |
| `compare react and vue` | Compare | Side-by-side table, shared-scale sparklines, factual takeaways |
| `compare express, fastify, koa` | Compare | Three-column table with column removal and retry |
| `express 4 vs 5` | Compare | Version-aware comparison of two major releases; downloads shown as package-wide |
| `npm alternatives to moment` | Alternatives | Replacements ranked by shared keywords, then weekly downloads |
| `best npm package for date formatting` | Use case | Recommendations ranked by npm search relevance and weekly downloads |
| `npm request` | Details | Prominent deprecation alert with the author's deprecation message |

## Features by View

### Details
- Version, license, release date, unpacked size and dependency count.
- TypeScript detection (native `.d.ts` or DefinitelyTyped) and module format (Pure ESM, Dual ESM/CJS, CommonJS).
- Weekly downloads, bundle size (minified and gzip) and a 30-day SVG download sparkline.
- One-click install command (`npm i <package>`) with copy confirmation.
- Error alert when a package is deprecated.
- Local buttons to open Compare or Alternatives for the same package.

### Compare
- Side-by-side table for 2 to 3 packages, or two versions of the same package.
- Picks the top alternative as the first comparison partner when only one package is named.
- Change the partner from a dropdown, add a third package, or remove a column. Only the changed package is fetched.
- Sparklines share the same Y-axis range, so slopes can be compared honestly.
- 7-day average trend (last 7 days vs the previous 7 days) to avoid weekend dips.
- Neutral factual takeaways and a per-column error state with retry.

### Alternatives
- Ranked by number of shared package keywords, with weekly downloads as the tie-breaker.
- Shared keywords are highlighted; packages with no overlap are labelled "Weak match".
- Each row shows weekly downloads and bundle size.
- Row actions: open details, compare with the primary package, open on npm.

### Use case
- Natural-language searches such as `best npm package for date formatting`.
- Ranking blends the normalised npm search score with normalised log10 weekly downloads.
- The subtitle says exactly how results are ranked; no winner is declared.
- "Details" opens a sub-view with a Back button and a "Set as primary" action.

## Design Decisions

| Decision | Reason |
|---|---|
| Answer first, details second | Developers want the key fact immediately; depth is optional |
| No invented winners | Takeaways are ratios and differences, never "X is better" |
| Shared-scale sparklines | Independent scales would make a small package look as big as a large one |
| 7-day average trend | Download counts dip on weekends; a daily comparison would mislead |
| Local tabs and actions | "Compare with..." and "See alternatives" update local state, so no new root search is triggered |
| Flat developer-tool look | 1px borders, small radii, no gradients, tabular numerals for aligned numbers |
| Restricted colour use | Accent colours mark the mode only; red is reserved for deprecation and critical errors |
| Light, dark, sidebar, mainline | Theme tokens and responsive layout work in both placements |

## How It Was Built

The project was built in stages, with each stage tested in the local sandbox before moving on.

1. **Foundation.** Created the project from the HyperDart React + Vite template. Wrote the deterministic intent parser, the npm data fetchers, and the first versions of the Details, Compare and Alternatives views.
2. **Package Hub.** Added the shared derivation pipeline (primary package, profile terms, candidate pool) and local tab navigation.
3. **Resilience.** Added caching, request cancellation, timeouts, fallback endpoints, and bundle-size fallbacks.
4. **Modular code.** Split one large file into `lib/`, `api/`, `hooks/`, `components/` and `constants/` so each part has one job and is easy to explain and change.
5. **Query handling.** Fixed routing for the hackathon sample queries, including comma-separated lists, "latest version of", and platform entities (`sourceID`).
6. **Version-aware compare.** Added `express 4 vs 5` with correct version resolution and per-version fields, keeping downloads clearly labelled as package-wide.
7. **State and speed fixes.** Fixed stale state when the query changes, made adding a compare package fetch only the new column, rendered Details before slow size lookups, and kept the tab bar visible in the Use case view.
8. **Tests and docs.** Added automated tests for routing, formatting, ranking, resilience and query transitions, plus this README and `docs/HOWTO.md`.

## Data Sources and Accuracy

| Source | Endpoint | Data Provided |
|---|---|---|
| npm Registry | `https://registry.npmjs.org/<pkg>` | Version manifests, license, release dates, dependencies, deprecation notices |
| npm Downloads API | `https://api.npmjs.org/downloads/point/last-week/<pkg>` | Weekly download totals |
| npm Downloads API | `https://api.npmjs.org/downloads/range/last-month/<pkg>` | 30-day daily series for sparklines |
| npm Search API | `https://registry.npmjs.org/-/v1/search?text=<phrase>` | Search results and relevance score |
| Bundlephobia | `https://bundlephobia.com/api/size?package=<pkg>` | Minified and gzip bundle sizes |
| npmmirror (fallback) | `https://registry.npmmirror.com` | Registry fallback when the main registry is unreachable |

### Accuracy Notes
- **Estimated bundle sizes.** When Bundlephobia is slow or rate-limited, size falls back to a built-in list of known packages or an estimate from unpacked size (about 0.75 for minified and 0.28 for gzip). Estimated values are marked "Estimated" in the interface.
- **Downloads are package-wide.** npm does not record downloads per version, so `express 4 vs 5` shows one package-level download figure.
- **Ranking is a heuristic.** Alternatives use shared manifest keywords and download volume, not source code analysis.
- **Mirror lag.** Data from the npmmirror fallback may lag the main registry by a short time.

## Robustness

| Concern | How it is handled |
|---|---|
| Duplicate requests | In-memory cache of in-flight and finished requests |
| Stale responses | `AbortController` cancels old requests; stale results are ignored |
| Slow or failing APIs | Timeouts, fallback endpoints, and `N/A` for non-critical data |
| Unknown packages | Clear "not found" card, no crash |
| Rate limits | Capped concurrency for download and search lookups |
| Render crashes | Error boundaries around views and individual compare columns, with retry |
| Query changes | The component restarts from clean state for each new query |

## Tech Stack and Libraries

| Library | Use |
|---|---|
| React 18 | Component rendering and hooks |
| Vite 5 | Dev server with proxy and production bundle |
| Material UI (MUI) v6 | Base UI components, styled to a flat developer-tool look |
| MUI Icons | Small SVG icons |
| `@hyperdart/frontend` | `withHD` wrapper that connects the component to the platform |

No LLM or AI API is called at runtime. No chart library is used; sparklines are hand-written SVG.

## Project Structure

```
.
├── hyperdart.config.js       # Triggers, placement, and module configuration
├── index.html                # Local development HTML entry
├── package.json              # Dependencies, scripts, and publish settings
├── resource.json             # Query schema for the HyperDart platform
├── searchData.json           # Sample search data for sandbox testing
├── vite.config.js            # Build and dev proxy configuration
├── docs/
│   └── HOWTO.md              # Architecture and operations notes
├── public/                   # Static assets (terms, privacy, icons)
├── scripts/                  # Test suites and publish validation
└── src/
    ├── frontend/
    │   ├── index.jsx         # Entry point wrapped with withHD
    │   ├── NewComponent.jsx  # Root component: hub setup and tab navigation
    │   ├── api/              # npm registry, downloads, search and bundle size clients
    │   ├── components/       # Sparkline, error boundary, tabs, skeletons, views/
    │   ├── constants/        # Theme tokens, known bundle sizes, stopwords
    │   ├── hooks/            # usePackageHub, useSubView
    │   └── lib/              # Intent parser, formatters, ranking, detectors
    └── sandbox/
        ├── index.css         # Sandbox styling
        └── main.jsx          # Local test harness with query, theme and layout controls
```

## Getting Started

```bash
npm install        # install dependencies
npm run dev        # sandbox at http://localhost:3000
npm test           # run all test suites
npm run build      # production bundle: dist/frontend/index.modern.js
npm run validate   # check hyperdart.config.js against platform rules
```

### Publishing
1. Create the package in the HyperDart Partner Portal.
2. Set your registry token as shown in the portal.
3. Run `npm run build`, then `npm version patch`.
4. Run `npm publish`. Do not use `--ignore-scripts`; the `prepublishOnly` step runs validation.

## Testing

`npm test` runs four suites:

| Suite | Covers |
|---|---|
| `scripts/test-component.js` | Routing for the hackathon sample queries, formatters, TypeScript/ESM detection, compare helpers, tab visibility, use-case ranking |
| `scripts/test-network-resilience.js` | Name sanitisation, empty input, network errors, bundle size estimation |
| `scripts/test-package-hub.js` | Entity extraction, profile terms, keyword-overlap ranking |
| `scripts/test-query-transitions.js` | State transitions between queries |

The automated tests cover parsing, ranking and fallback logic. Live API behaviour was checked manually in the sandbox at `http://localhost:3000/`.

## How to Add a Query Pattern

Query patterns live in `src/frontend/lib/parseIntent.js`, inside `parseIntent(query, entityNames = [])`. Add a new check before the generic fallbacks. Example: route "migrate from X" to the Alternatives view.

```javascript
const migrateMatch = clean.match(/^(?:migrate|move)\s+from\s+([@a-z0-9_.-]+)$/i);
if (migrateMatch && migrateMatch[1]) {
  return { view: 'alternatives', package: cleanPkgName(migrateMatch[1]), rawQuery: clean };
}
```

Then:
1. Add a matching pattern to `query_format.regex` in `hyperdart.config.js` so the platform sends the query to this component.
2. Add a test case in `scripts/test-component.js`.
3. Try the query in the sandbox (`npm run dev`).

## Known Limitations

- **Bundlephobia limits.** It may rate-limit or block browser requests; sizes then use fallbacks or show `N/A`.
- **No per-version downloads.** Version comparisons show package-wide downloads.
- **Keyword-based ranking.** Packages with missing or unusual keywords may rank lower in Alternatives.
- **Mirror lag.** The fallback registry can be slightly behind.
- **Third-party uptime.** All data depends on public services being available.

## AI Tools Used

I used AI tools to speed up the work, and I reviewed, tested and directed the result.

| Tool | What it was used for |
|---|---|
| Gemini (via Antigravity) | Generated the first version of the component, the refactor into modules, and many bug fixes and features from written prompts |
| Claude | Helped write and improve the prompts, reviewed the code and screenshots to find likely causes of bugs, and helped draft documentation |

What I did myself:
- Defined the product direction and requirements from the problem statement and judging criteria.
- Ran the component in the sandbox for every change and reported bugs, for example stale state after changing the query, a missing `useRef` import, missing tabs in the Use case view, and compare columns refetching when a package was added.
- Chose the design rules (no invented winners, shared-scale charts, flat design, honest labelling of estimated data).
- Reviewed the generated code, reran the tests, and checked the results against the real npm data.
- Wrote and checked the README, and prepared the demo.

I can explain every part of this code.
