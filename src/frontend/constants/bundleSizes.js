/**
 * Known bundle sizes (minified / gzipped) for high-frequency packages.
 * Serves as instantaneous fallback if Bundlephobia encounters 403 or rate limits.
 */
export const KNOWN_BUNDLE_SIZES = {
  react: { size: 7994, gzip: 3053, dependencyCount: 0 },
  'react-dom': { size: 130000, gzip: 42000, dependencyCount: 0 },
  vue: { size: 124800, gzip: 47300, dependencyCount: 0 },
  svelte: { size: 15400, gzip: 5200, dependencyCount: 0 },
  preact: { size: 10500, gzip: 4100, dependencyCount: 0 },
  express: { size: 215000, gzip: 65000, dependencyCount: 31 },
  fastify: { size: 165000, gzip: 48000, dependencyCount: 12 },
  koa: { size: 48000, gzip: 16000, dependencyCount: 4 },
  hono: { size: 36000, gzip: 12000, dependencyCount: 0 },
  lodash: { size: 71000, gzip: 25000, dependencyCount: 0 },
  radash: { size: 18000, gzip: 5500, dependencyCount: 0 },
  ramda: { size: 52000, gzip: 14000, dependencyCount: 0 },
  axios: { size: 32000, gzip: 11000, dependencyCount: 0 },
  ky: { size: 11000, gzip: 3800, dependencyCount: 0 },
  got: { size: 120000, gzip: 35000, dependencyCount: 18 },
  moment: { size: 290000, gzip: 72000, dependencyCount: 0 },
  dayjs: { size: 6900, gzip: 2900, dependencyCount: 0 },
  'date-fns': { size: 85000, gzip: 21000, dependencyCount: 0 },
  luxon: { size: 72000, gzip: 22000, dependencyCount: 0 },
  chalk: { size: 12000, gzip: 4500, dependencyCount: 0 },
  colorette: { size: 3200, gzip: 1200, dependencyCount: 0 },
  picocolors: { size: 2800, gzip: 1100, dependencyCount: 0 },
  commander: { size: 35000, gzip: 11000, dependencyCount: 0 },
  yargs: { size: 80000, gzip: 25000, dependencyCount: 5 },
  zod: { size: 58000, gzip: 13000, dependencyCount: 0 },
  joi: { size: 180000, gzip: 45000, dependencyCount: 4 },
  zustand: { size: 3500, gzip: 1200, dependencyCount: 0 },
  redux: { size: 11000, gzip: 3800, dependencyCount: 0 },
  uuid: { size: 4200, gzip: 1600, dependencyCount: 0 },
  nanoid: { size: 2500, gzip: 900, dependencyCount: 0 },
  vitest: { size: 310000, gzip: 85000, dependencyCount: 22 },
  jest: { size: 480000, gzip: 120000, dependencyCount: 40 },
  '@mui/material': { size: 320000, gzip: 95000, dependencyCount: 12 }
};
