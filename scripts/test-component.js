import {
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm
} from '../dist/frontend/index.modern.js';
import { extractEntityPackages, computeQueryKey } from '../src/frontend/lib/parseIntent.js';
import {
  buildPartnerOptions,
  rankUseCaseCandidates,
  isTabBarVisible,
  buildModeTabs
} from '../src/frontend/lib/ranking.js';
import { specsToFetch, validatePkgInput, buildCompareHeading } from '../src/frontend/lib/compareHelpers.js';

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

console.log('\n=== 1. TESTING INTENT ROUTING (14 HACKATHON SAMPLE QUERIES) ===');

// 1. "npm express" -> details: express
const r1 = parseIntent('npm express');
assert(r1.view === 'details' && r1.package === 'express', '1. parseIntent("npm express") -> details: express');

// 2. "package info lodash" -> details: lodash
const r2 = parseIntent('package info lodash');
assert(r2.view === 'details' && r2.package === 'lodash', '2. parseIntent("package info lodash") -> details: lodash');

// 3. "latest version of react" -> details: react (focus: 'version')
const r3a = parseIntent('latest version of react');
assert(r3a.view === 'details' && r3a.package === 'react' && r3a.focus === 'version', '3a. parseIntent("latest version of react") -> details: react (focus: version)');
const r3b = parseIntent('current version of react');
assert(r3b.view === 'details' && r3b.package === 'react' && r3b.focus === 'version', '3b. parseIntent("current version of react") -> details: react');
const r3c = parseIntent('what is the latest version of react');
assert(r3c.view === 'details' && r3c.package === 'react' && r3c.focus === 'version', '3c. parseIntent("what is the latest version of react") -> details: react');

// 4. "compare react and vue" -> compare: [react, vue]
const r4 = parseIntent('compare react and vue');
assert(r4.view === 'compare' && r4.packages[0] === 'react' && r4.packages[1] === 'vue', '4. parseIntent("compare react and vue") -> compare: [react, vue]');

// 5. "compare packages express, fastify" -> compare: [express, fastify]
const r5 = parseIntent('compare packages express, fastify');
assert(r5.view === 'compare' && r5.packages[0] === 'express' && r5.packages[1] === 'fastify', '5. parseIntent("compare packages express, fastify") -> compare: [express, fastify]');

// 6. "compare express, fastify, koa" -> compare: [express, fastify, koa]
const r6 = parseIntent('compare express, fastify, koa');
assert(r6.view === 'compare' && r6.packages.length === 3 && r6.packages[0] === 'express' && r6.packages[1] === 'fastify' && r6.packages[2] === 'koa', '6. parseIntent("compare express, fastify, koa") -> compare: [express, fastify, koa]');

// 7. "compare npm packages react vue" -> compare: [react, vue] (separator is space)
const r7 = parseIntent('compare npm packages react vue');
assert(r7.view === 'compare' && r7.packages[0] === 'react' && r7.packages[1] === 'vue', '7. parseIntent("compare npm packages react vue") -> compare: [react, vue]');

// 8. "react vs vue", "react versus vue", "react with vue after compare" -> compare
const r8a = parseIntent('react vs vue');
assert(r8a.view === 'compare' && r8a.packages.includes('react') && r8a.packages.includes('vue'), '8a. parseIntent("react vs vue") -> compare: [react, vue]');
const r8b = parseIntent('react versus vue');
assert(r8b.view === 'compare' && r8b.packages.includes('react') && r8b.packages.includes('vue'), '8b. parseIntent("react versus vue") -> compare: [react, vue]');
const r8c = parseIntent('react with vue after compare');
assert(r8c.view === 'compare' && r8c.packages[0] === 'react' && r8c.packages[1] === 'vue', '8c. parseIntent("react with vue after compare") -> compare: [react, vue]');

// 9. "express 4 vs 5", "express@4 vs express@5", "express 4 vs express 5" -> version compare
const r9a = parseIntent('express 4 vs 5');
assert(r9a.view === 'compare' && r9a.isVersionCompare && r9a.packages[0] === 'express@4' && r9a.packages[1] === 'express@5', '9a. parseIntent("express 4 vs 5") -> version-aware compare');
const r9b = parseIntent('express@4 vs express@5');
assert(r9b.view === 'compare' && r9b.isVersionCompare && r9b.packages[0] === 'express@4' && r9b.packages[1] === 'express@5', '9b. parseIntent("express@4 vs express@5") -> version-aware compare');
const r9c = parseIntent('express 4 vs express 5');
assert(r9c.view === 'compare' && r9c.isVersionCompare && r9c.packages[0] === 'express@4' && r9c.packages[1] === 'express@5', '9c. parseIntent("express 4 vs express 5") -> version-aware compare');

// 10. "npm alternatives to moment" -> alternatives: moment
const r10 = parseIntent('npm alternatives to moment');
assert(r10.view === 'alternatives' && r10.package === 'moment', '10. parseIntent("npm alternatives to moment") -> alternatives: moment');

// 11. "alternatives for axios", "moment alternatives", "packages like axios", "npm packages similar to moment" -> alternatives
const r11a = parseIntent('alternatives for axios');
assert(r11a.view === 'alternatives' && r11a.package === 'axios', '11a. parseIntent("alternatives for axios") -> alternatives: axios');
const r11b = parseIntent('moment alternatives');
assert(r11b.view === 'alternatives' && r11b.package === 'moment', '11b. parseIntent("moment alternatives") -> alternatives: moment');
const r11c = parseIntent('packages like axios');
assert(r11c.view === 'alternatives' && r11c.package === 'axios', '11c. parseIntent("packages like axios") -> alternatives: axios');
const r11d = parseIntent('npm packages similar to moment');
assert(r11d.view === 'alternatives' && r11d.package === 'moment', '11d. parseIntent("npm packages similar to moment") -> alternatives: moment');

// 12. "npm request" -> details: request
const r12 = parseIntent('npm request');
assert(r12.view === 'details' && r12.package === 'request', '12. parseIntent("npm request") -> details: request');

// 13. "best npm package for date formatting", "library for parsing csv" -> use-case (no package)
const r13a = parseIntent('best npm package for date formatting');
assert(r13a.view === 'use-case' && r13a.useCase === 'date formatting', '13a. parseIntent("best npm package for date formatting") -> use-case');
const r13b = parseIntent('library for parsing csv');
assert(r13b.view === 'use-case' && r13b.useCase === 'parsing csv', '13b. parseIntent("library for parsing csv") -> use-case');

// 14. "npm zzzz-not-a-package" -> details: zzzz-not-a-package
const r14 = parseIntent('npm zzzz-not-a-package');
assert(r14.view === 'details' && r14.package === 'zzzz-not-a-package', '14. parseIntent("npm zzzz-not-a-package") -> details: zzzz-not-a-package');

// Real searchData entity parsing test
const mockSearchData = {
  query: 'compare react and vue',
  entities: [
    { word: 'react', sourceID: 'react', collectionName: 'NPM_PACKAGES' },
    { word: 'vue', sourceID: 'vue' }
  ]
};
const extractedEnts = extractEntityPackages(mockSearchData);
assert(extractedEnts.length === 2 && extractedEnts[0] === 'react' && extractedEnts[1] === 'vue', 'extractEntityPackages handles real searchData with sourceID');

// Entity names authoritative override in parseIntent
const entityIntent = parseIntent('compare', ['react', 'vue']);
assert(entityIntent.view === 'compare' && entityIntent.packages[0] === 'react' && entityIntent.packages[1] === 'vue', 'parseIntent uses authoritative entityNames when provided');

// Sandbox States: Empty / Null / Unmatched
assert(parseIntent(null).view === 'empty', 'parseIntent(null) -> empty');
assert(parseIntent('').view === 'empty', 'parseIntent("") -> empty');
assert(parseIntent('   ').view === 'empty', 'parseIntent("   ") -> empty');
assert(parseIntent('???@@@!!!').view === 'unmatched', 'parseIntent("???@@@!!!") -> unmatched');

console.log('\n=== 2. TESTING FORMATTERS & HELPERS ===');
assert(formatBytes(0) === '0 B', 'formatBytes(0) === "0 B"');
assert(formatBytes(1024) === '1.0 kB', 'formatBytes(1024) === "1.0 kB"');
assert(formatBytes(1048576) === '1.0 MB', 'formatBytes(1048576) === "1.0 MB"');
assert(formatBytes(null) === 'N/A', 'formatBytes(null) === "N/A"');

assert(formatNumber(1250) === '1.3k', 'formatNumber(1250) === "1.3k"');
assert(formatNumber(24500000) === '24.5M', 'formatNumber(24500000) === "24.5M"');
assert(formatNumber(null) === 'N/A', 'formatNumber(null) === "N/A"');

const sampleDate = '2024-01-01T00:00:00.000Z';
assert(formatDate(sampleDate).includes('2024'), 'formatDate formats year correctly');
assert(formatDate(null) === 'N/A', 'formatDate(null) === "N/A"');

console.log('\n=== 3. TESTING TS & ESM DETECTORS ===');
const tsPkg = { name: 'my-ts-lib', types: 'index.d.ts' };
assert(detectTypeScript(tsPkg).supported === true, 'Detects TypeScript native via types');

const dtypedPkg = { name: 'react' };
assert(detectTypeScript(dtypedPkg).supported === true, 'Detects DefinitelyTyped for react');

const esmPkg = { name: 'esm-lib', type: 'module' };
assert(detectEsm(esmPkg).isEsm === true, 'Detects Pure ESM via type: module');

const dualPkg = { name: 'dual-lib', module: 'dist/index.mjs', main: 'dist/index.cjs' };
assert(detectEsm(dualPkg).isEsm === true && detectEsm(dualPkg).isCjs === true, 'Detects Dual ESM + CJS');

console.log('\n=== 4. TESTING QUERY KEY & PARTNER OPTIONS ===');
// 6(a) queryKey different for different queries, identical for array vs object searchData
const keyViteReact = computeQueryKey('compare vite vs react');
const keyNodeReact = computeQueryKey('compare node vs react');
assert(keyViteReact !== keyNodeReact, 'queryKey is different for "compare vite vs react" and "compare node vs react"');

const objSearchData = { query: 'compare vite vs react', entities: [{ sourceID: 'vite' }, { sourceID: 'react' }] };
const arrSearchData = [{ query: 'compare vite vs react', entities: [{ sourceID: 'vite' }, { sourceID: 'react' }] }];
const keyObj = computeQueryKey(objSearchData);
const keyArr = computeQueryKey(arrSearchData);
assert(keyObj === keyArr, 'queryKey is identical for the same query given as array vs object searchData');

// 6(b) buildPartnerOptions includes current partner when not in alternatives list
const optsWithoutAlt = buildPartnerOptions('fastify', [{ name: 'koa' }, { name: 'express' }], 'express');
assert(optsWithoutAlt.some((o) => o.name === 'fastify'), 'buildPartnerOptions includes current partner when not in alternatives list');
assert(optsWithoutAlt[0].name === 'fastify', 'buildPartnerOptions puts current partner first');
assert(!optsWithoutAlt.some((o) => o.name === 'express'), 'buildPartnerOptions excludes primary package');

console.log('\n=== 5. TESTING COMPARE HELPERS & VALIDATION ===');
// 7(a) specsToFetch returns only missing specs
const cachedTwo = ['react', 'vue'];
const addThird = ['react', 'vue', 'angular'];
const fetchMissing = specsToFetch(addThird, cachedTwo);
assert(fetchMissing.length === 1 && fetchMissing[0] === 'angular', 'specsToFetch: adding a third package returns just the new one');

const removedPkg = ['react'];
const fetchRemoved = specsToFetch(removedPkg, cachedTwo);
assert(fetchRemoved.length === 0, 'specsToFetch: removing a package returns []');

const allCached = specsToFetch(['react', 'vue'], new Set(['react', 'vue']));
assert(allCached.length === 0, 'specsToFetch: all cached returns []');

// 7(b) add-package validation helper
assert(validatePkgInput('', ['react']).valid === false, 'validatePkgInput: rejects empty string');
assert(validatePkgInput('   ', ['react']).valid === false, 'validatePkgInput: rejects whitespace');
assert(validatePkgInput(null, ['react']).valid === false, 'validatePkgInput: rejects null');
assert(validatePkgInput('???invalid!!', ['react']).valid === false, 'validatePkgInput: rejects invalid package characters');
assert(validatePkgInput('react', ['react', 'vue']).valid === false, 'validatePkgInput: rejects exact duplicate');
assert(validatePkgInput('REACT', ['react', 'vue']).valid === false, 'validatePkgInput: rejects case-insensitive duplicate');
assert(validatePkgInput('svelte', ['react', 'vue', 'angular']).valid === false, 'validatePkgInput: rejects over-3 limit');

const validPlain = validatePkgInput('svelte', ['react', 'vue']);
assert(validPlain.valid === true && validPlain.name === 'svelte', 'validatePkgInput: accepts valid plain package');

const validNpmPrefix = validatePkgInput('npm svelte', ['react', 'vue']);
assert(validNpmPrefix.valid === true && validNpmPrefix.name === 'svelte', 'validatePkgInput: strips leading "npm "');

const validScoped = validatePkgInput('@mui/material', ['react', 'vue']);
assert(validScoped.valid === true && validScoped.name === '@mui/material', 'validatePkgInput: accepts valid scoped package');

// 7(c) heading builder never contains a spec from another query
const colCurrent = [
  { requestedName: 'react', info: { name: 'react' } },
  { requestedName: 'vue', info: { name: 'vue' } }
];
const headingNormal = buildCompareHeading(colCurrent, false, 'react');
assert(headingNormal === 'Comparing react with vue', 'buildCompareHeading: returns "Comparing react with vue"');
assert(!headingNormal.includes('express'), 'buildCompareHeading: never contains a spec from another query (e.g. express@5)');

const colVersions = [
  { requestedName: 'express@4', info: { version: '4.21.2' } },
  { requestedName: 'express@5', info: { version: '5.1.0' } }
];
const headingVer = buildCompareHeading(colVersions, true, 'express');
assert(headingVer === 'express 4.21.2 vs 5.1.0', 'buildCompareHeading: builds version compare heading "express 4.21.2 vs 5.1.0"');

console.log('\n=== 8. TESTING TAB VISIBILITY & DISABLED LOGIC FOR PURE USE-CASE QUERIES ===');

// 8(a) Tab bar visibility
assert(isTabBarVisible('empty') === false, 'isTabBarVisible("empty") returns false');
assert(isTabBarVisible('unmatched') === false, 'isTabBarVisible("unmatched") returns false');
assert(isTabBarVisible('use-case') === true, 'isTabBarVisible("use-case") returns true');
assert(isTabBarVisible('details') === true, 'isTabBarVisible("details") returns true');
assert(isTabBarVisible('compare') === true, 'isTabBarVisible("compare") returns true');
assert(isTabBarVisible('alternatives') === true, 'isTabBarVisible("alternatives") returns true');

// 8(b) ModeTabs with NO primary package (pure use-case query)
const modesNoPrimary = buildModeTabs(null, { useCase: true });
const detailsTab = modesNoPrimary.find((m) => m.id === 'details');
const compareTab = modesNoPrimary.find((m) => m.id === 'compare');
const altsTab = modesNoPrimary.find((m) => m.id === 'alternatives');
const useCaseTab = modesNoPrimary.find((m) => m.id === 'use-case');

assert(detailsTab.disabled === true, 'No primary: Details tab is disabled');
assert(detailsTab.tooltip === 'Pick a package first', 'No primary: Details tab tooltip is "Pick a package first"');
assert(detailsTab.loading === false, 'No primary: Details tab does not say loading');

assert(compareTab.disabled === true, 'No primary: Compare tab is disabled');
assert(compareTab.tooltip === 'Pick a package first', 'No primary: Compare tab tooltip is "Pick a package first"');

assert(altsTab.disabled === true, 'No primary: Alternatives tab is disabled');
assert(altsTab.tooltip === 'Pick a package first', 'No primary: Alternatives tab tooltip is "Pick a package first"');

assert(useCaseTab.disabled === false, 'No primary: Use case tab is enabled');
assert(useCaseTab.tooltip === undefined, 'No primary: Use case tab has no tooltip');
assert(useCaseTab.loading === true, 'No primary: Use case tab correctly reflects loading: true');

// 8(c) ModeTabs WITH a primary package (e.g. after picking a package)
const modesWithPrimary = buildModeTabs('date-fns', { details: false, compare: false, alternatives: false, useCase: false });
assert(modesWithPrimary.every((m) => m.disabled === false), 'With primary: all tabs are enabled');
assert(modesWithPrimary.every((m) => m.tooltip === undefined), 'With primary: no tabs have "Pick a package first" tooltip');

// 8(d) Use-case ranking blend: drops @types and deprecated, calculates transparent blend
const sampleCandidates = [
  { name: '@types/node', score: { final: 0.99 }, weeklyDownloads: 50000000 },
  { name: 'old-date-lib', score: { final: 0.95 }, weeklyDownloads: 100000, deprecated: 'Use date-fns instead' },
  { name: 'date-fns', score: { final: 0.9 }, weeklyDownloads: 20000000 },
  { name: 'dayjs', score: { final: 0.88 }, weeklyDownloads: 15000000 },
  { name: 'moment', score: { final: 0.7 }, weeklyDownloads: 18000000 },
  { name: 'luxon', score: { final: 0.8 }, weeklyDownloads: 8000000 },
  { name: 'date-format', score: { final: 0.6 }, weeklyDownloads: 500000 },
  { name: 'tiny-date', score: { final: 0.5 }, weeklyDownloads: 20000 }
];

const ranked = rankUseCaseCandidates(sampleCandidates);
assert(ranked.length === 5, 'rankUseCaseCandidates: returns top 5 candidates');
assert(!ranked.some((c) => c.name.startsWith('@types/')), 'rankUseCaseCandidates: drops @types packages');
assert(!ranked.some((c) => c.deprecated), 'rankUseCaseCandidates: drops deprecated packages');
assert(ranked[0].name === 'date-fns', 'rankUseCaseCandidates: ranks date-fns top based on blend of relevance and downloads');
assert(ranked[0].blendScore >= ranked[1].blendScore, 'rankUseCaseCandidates: sorted descending by blendScore');
assert(ranked[0].blendScore <= 1 && ranked[0].blendScore >= 0, 'rankUseCaseCandidates: blendScore normalized between 0 and 1');

console.log(`\nTests finished: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);

