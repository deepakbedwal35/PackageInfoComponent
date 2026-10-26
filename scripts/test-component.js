import {
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm
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

console.log('\n=== 1. TESTING INTENT ROUTING (REGEX ENGINE) ===');

// View 1: Details
assert(parseIntent('npm express').view === 'details', 'parseIntent("npm express") -> details');
assert(parseIntent('npm express').package === 'express', 'Package is "express"');
assert(parseIntent('express npm').view === 'details', 'parseIntent("express npm") -> details');
assert(parseIntent('package info lodash').view === 'details', 'parseIntent("package info lodash") -> details');
assert(parseIntent('request').view === 'details', 'parseIntent("request") -> details');
assert(parseIntent('react@18.2.0').view === 'details', 'parseIntent("react@18.2.0") -> details');
assert(parseIntent('@mui/material').view === 'details', 'parseIntent("@mui/material") -> details');

// View 2: Compare
const comp1 = parseIntent('compare react and vue');
assert(comp1.view === 'compare', 'parseIntent("compare react and vue") -> compare');
assert(comp1.packages.includes('react') && comp1.packages.includes('vue'), 'Packages include react & vue');

const comp2 = parseIntent('react vs vue');
assert(comp2.view === 'compare', 'parseIntent("react vs vue") -> compare');

const comp3 = parseIntent('express 4 vs 5');
assert(comp3.view === 'compare', 'parseIntent("express 4 vs 5") -> version-aware compare');
assert(comp3.packages[0] === 'express@4' && comp3.packages[1] === 'express@5', 'Resolves to express@4 and express@5');

// View 3: Alternatives
const alt1 = parseIntent('npm alternatives to moment');
assert(alt1.view === 'alternatives', 'parseIntent("npm alternatives to moment") -> alternatives');
assert(alt1.package === 'moment', 'Target package is "moment"');

const alt2 = parseIntent('moment alternatives');
assert(alt2.view === 'alternatives', 'parseIntent("moment alternatives") -> alternatives');

const alt3 = parseIntent('alternatives to axios');
assert(alt3.view === 'alternatives', 'parseIntent("alternatives to axios") -> alternatives');

// View 4: Use-case
const uc1 = parseIntent('best npm package for date formatting');
assert(uc1.view === 'use-case', 'parseIntent("best npm package for date formatting") -> use-case');
assert(uc1.useCase === 'date formatting', 'Parsed use-case is "date formatting"');

const uc2 = parseIntent('npm package for state management');
assert(uc2.view === 'use-case', 'parseIntent("npm package for state management") -> use-case');

// Sandbox State 1: Empty / Null
assert(parseIntent(null).view === 'empty', 'parseIntent(null) -> empty');
assert(parseIntent('').view === 'empty', 'parseIntent("") -> empty');
assert(parseIntent('   ').view === 'empty', 'parseIntent("   ") -> empty');

// Sandbox State 2: Unmatched
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

console.log(`\nTests finished: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);

