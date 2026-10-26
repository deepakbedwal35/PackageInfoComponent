import {
  extractEntityPackage,
  extractProfileTerms,
  rankAlternatives,
  GENERIC_PROFILE_WORDS
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

console.log('\n=== 1. TESTING EXTRACT ENTITY PACKAGE ===');
assert(extractEntityPackage(null) === null, 'extractEntityPackage(null) returns null');
assert(extractEntityPackage({}) === null, 'extractEntityPackage({}) returns null');
assert(extractEntityPackage({ entities: 'react' }) === 'react', 'extractEntityPackage({ entities: "react" }) === "react"');
assert(extractEntityPackage({ entities: { package: 'express' } }) === 'express', 'extractEntityPackage({ entities: { package: "express" } }) === "express"');
assert(extractEntityPackage({ entities: [{ package: '@mui/material@5.0.0' }] }) === '@mui/material', 'extractEntityPackage handles scoped package and strips version');

console.log('\n=== 2. TESTING PROFILE TERMS EXTRACTION ===');
assert(GENERIC_PROFILE_WORDS.has('javascript'), 'GENERIC_PROFILE_WORDS includes javascript');
assert(GENERIC_PROFILE_WORDS.has('framework'), 'GENERIC_PROFILE_WORDS includes framework');
assert(GENERIC_PROFILE_WORDS.has('utility'), 'GENERIC_PROFILE_WORDS includes utility');

const reactPkg = {
  name: 'react',
  keywords: ['react', 'javascript', 'ui', 'frontend', 'framework', 'declarative'],
  description: 'React is a JavaScript library for building user interfaces.'
};
const reactTerms = extractProfileTerms(reactPkg);
assert(reactTerms.length <= 4, 'extractProfileTerms takes max 4 terms');
assert(!reactTerms.includes('javascript') && !reactTerms.includes('framework'), 'extractProfileTerms drops generic words');
assert(reactTerms.includes('ui') && reactTerms.includes('frontend'), 'extractProfileTerms extracts domain terms ui & frontend');

// Stopword fallback from description
const noKwPkg = {
  name: 'date-helper',
  keywords: [],
  description: 'A modern lightweight date time parser and formatter library for node'
};
const descTerms = extractProfileTerms(noKwPkg);
assert(descTerms.length > 0 && descTerms.length <= 4, 'extracts terms from description when keywords empty');
assert(descTerms.includes('date') && descTerms.includes('time'), 'extracts nouns date and time');

// Empty fallback
const emptyPkg = { name: 'my-pkg', keywords: [], description: '' };
assert(extractProfileTerms(emptyPkg)[0] === 'my-pkg', 'falls back to package name when keywords and description are empty');

console.log('\n=== 3. TESTING ALTERNATIVES RANKING ===');
const primary = {
  name: 'react',
  keywords: ['ui', 'frontend', 'components', 'declarative', 'view']
};

const candidates = [
  { name: 'vue', keywords: ['ui', 'frontend', 'framework'], weeklyDownloads: 4000000 },
  { name: 'preact', keywords: ['ui', 'frontend', 'components', 'declarative'], weeklyDownloads: 2000000 },
  { name: 'svelte', keywords: ['compiler', 'ui'], weeklyDownloads: 1000000 },
  { name: 'random-lib', keywords: ['other'], weeklyDownloads: 5000000 }
];

const ranked = rankAlternatives(candidates, primary);
assert(ranked[0].name === 'preact', 'preact is #1 with highest shared keyword score (4)');
assert(ranked[1].name === 'vue', 'vue is #2 with 2 shared keywords');
assert(ranked[2].name === 'svelte', 'svelte is #3 with 1 shared keyword');
assert(ranked[3].name === 'random-lib' && ranked[3].isWeakMatch === true, 'random-lib has 0 shared keywords and is marked weak match');

console.log(`\nPackage Hub tests finished: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);

