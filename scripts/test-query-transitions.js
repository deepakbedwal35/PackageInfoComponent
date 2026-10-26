import { computeQueryKey, parseIntent } from '../src/frontend/lib/parseIntent.js';
import { buildPartnerOptions } from '../src/frontend/lib/ranking.js';

const queries = [
  'compare vite vs react',
  'compare node vs react',
  'npm express',
  'npm alternatives to moment',
  'best npm package for date formatting',
  'compare node vs react'
];

console.log('Testing query transition sequence:');
const keys = queries.map((q) => computeQueryKey(q));
console.log('Keys generated:');
keys.forEach((k, idx) => console.log(`  ${idx + 1}. [${queries[idx]}] -> key: "${k}"`));

if (keys[0] === keys[1]) {
  console.error('FAIL: Query 1 and 2 produced identical keys');
  process.exit(1);
}
if (keys[1] !== keys[5]) {
  console.error('FAIL: Query 2 and 6 did not produce matching keys');
  process.exit(1);
}

// Check partner dropdown options when alternatives are empty
const initialDropdown = buildPartnerOptions('react', [], 'node');
if (initialDropdown.length !== 1 || initialDropdown[0].name !== 'react') {
  console.error('FAIL: Initial dropdown did not show partner');
  process.exit(1);
}

console.log('✔ All query transitions and partner dropdown guarantees verified!');
