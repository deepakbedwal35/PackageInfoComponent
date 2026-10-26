import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  Skeleton,
  Tooltip,
  List,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GitHubIcon from '@mui/icons-material/GitHub';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

// ==========================================
// 1. DESIGN SYSTEM TOKENS (LIGHT & DARK)
// ==========================================
export const THEME_TOKENS = {
  light: {
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
      subtle: '#f3f4f6'
    },
    divider: '#e5e7eb',
    border: '#d1d5db',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      disabled: '#9ca3af'
    },
    action: {
      primary: '#111827', // neutral ink
      primaryText: '#ffffff',
      hover: '#1f2937'
    },
    modeAccents: {
      details: '#2563eb', // blue
      compare: '#0d9488', // teal
      alternatives: '#d97706', // amber
      'use-case': '#16a34a', // green
      empty: '#4b5563',
      unmatched: '#4b5563'
    },
    sparkline: '#6b7280',
    error: {
      main: '#dc2626',
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#991b1b'
    }
  },
  dark: {
    background: {
      default: '#0b0f17',
      paper: '#111827',
      subtle: '#1f2937'
    },
    divider: '#1f2937',
    border: '#374151',
    text: {
      primary: '#f9fafb',
      secondary: '#9ca3af',
      disabled: '#6b7280'
    },
    action: {
      primary: '#f9fafb', // near-white ink
      primaryText: '#111827',
      hover: '#e5e7eb'
    },
    modeAccents: {
      details: '#3b82f6', // blue
      compare: '#14b8a6', // teal
      alternatives: '#f59e0b', // amber
      'use-case': '#22c55e', // green
      empty: '#9ca3af',
      unmatched: '#9ca3af'
    },
    sparkline: '#9ca3af',
    error: {
      main: '#ef4444',
      bg: '#450a0a',
      border: '#7f1d1d',
      text: '#fca5a5'
    }
  }
};

// ==========================================
// 2. IN-MEMORY CACHE & NETWORK FETCH HELPERS
// ==========================================
const apiCache = new Map();

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

/**
 * Safe package name sanitization guarding against undefined, empty, or scoped inputs.
 */
export function cleanPkgName(pkg) {
  if (!pkg || typeof pkg !== 'string') return '';
  const trimmed = pkg.trim();
  if (trimmed.startsWith('@')) {
    const parts = trimmed.slice(1).split('@');
    return '@' + parts[0];
  }
  return trimmed.split('@')[0];
}

/**
 * Detects local development or sandbox environment to leverage low-latency dev proxies.
 */
export function isDevEnvironment() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Concurrently fetch JSON with in-memory caching, timeout, and safe error boundary.
 */
export async function cachedFetch(url, timeoutMs = 6000, externalSignal = null) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const cleanUrl = url.trim();
  if (apiCache.has(cleanUrl)) {
    return apiCache.get(cleanUrl);
  }

  const promise = (async () => {
    let timer = null;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) {
        timer = setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // ignore abort failure
          }
        }, timeoutMs);
      }

      // Chain external abort signal if provided
      if (externalSignal) {
        if (externalSignal.aborted) {
          if (timer) clearTimeout(timer);
          return null;
        }
        externalSignal.addEventListener('abort', () => {
          try {
            controller?.abort();
          } catch {
            // ignore
          }
        });
      }

      const res = await fetch(cleanUrl, {
        signal: controller?.signal,
        headers: {
          Accept: 'application/json'
        }
      });

      if (timer) clearTimeout(timer);

      if (!res || !res.ok) {
        return null;
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch {
      if (timer) clearTimeout(timer);
      return null;
    }
  })();

  apiCache.set(cleanUrl, promise);

  return promise
    .then((data) => {
      if (data === null || data === undefined) {
        apiCache.delete(cleanUrl);
      }
      return data;
    })
    .catch(() => {
      apiCache.delete(cleanUrl);
      return null;
    });
}

/**
 * Fallback multi-url sequential fetcher.
 */
export async function fetchWithFallback(urls, defaultData = null, timeoutMs = 3500, signal = null) {
  try {
    const urlList = (Array.isArray(urls) ? urls : [urls]).filter(
      (u) => Boolean(u) && typeof u === 'string' && u.trim().length > 0
    );

    if (urlList.length === 0) {
      return defaultData;
    }

    for (const url of urlList) {
      if (signal?.aborted) return defaultData;
      try {
        const result = await cachedFetch(url, timeoutMs, signal);
        if (result !== null && result !== undefined) {
          return result;
        }
      } catch {
        // Continue to fallback url
      }
    }

    return defaultData;
  } catch {
    return defaultData;
  }
}

// ==========================================
// 3. FORMATTING & MATH UTILITIES
// ==========================================
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    if (diffDays <= 1) return `${formatted} (today)`;
    if (diffDays < 30) return `${formatted} (${diffDays}d ago)`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${formatted} (${months}mo ago)`;
    }
    const years = (diffDays / 365).toFixed(1);
    return `${formatted} (${years}y ago)`;
  } catch {
    return 'N/A';
  }
}

// TS & ESM Detection
export function detectTypeScript(pkgData) {
  if (!pkgData) return { supported: false, label: 'No TypeScript', native: false };
  if (pkgData.name && pkgData.name.startsWith('@types/')) {
    return { supported: true, label: 'DefinitelyTyped', native: false };
  }
  if (pkgData.types || pkgData.typings) {
    return { supported: true, label: 'TypeScript Native', native: true };
  }
  if (pkgData.exports) {
    const expStr = JSON.stringify(pkgData.exports);
    if (
      expStr.includes('.d.ts') ||
      expStr.includes('.d.cts') ||
      expStr.includes('.d.mts') ||
      expStr.includes('"types"')
    ) {
      return { supported: true, label: 'TypeScript Native', native: true };
    }
  }
  const knownTyped = [
    'react',
    'react-dom',
    'lodash',
    'express',
    'node-fetch',
    'ws',
    'jest',
    'mocha',
    'qs',
    'uuid',
    'superagent',
    'luxon'
  ];
  if (knownTyped.includes(pkgData.name)) {
    return { supported: true, label: 'DefinitelyTyped (@types)', native: false };
  }
  return { supported: false, label: 'No TypeScript', native: false };
}

export function detectEsm(pkgData) {
  if (!pkgData) return { isEsm: false, isCjs: true, label: 'CommonJS' };
  const isTypeModule = pkgData.type === 'module';
  const hasModuleField = Boolean(pkgData.module || pkgData['jsnext:main']);
  let hasEsmExport = false;
  let hasCjsExport = false;

  if (pkgData.exports) {
    const expStr = JSON.stringify(pkgData.exports);
    if (expStr.includes('"import"') || expStr.includes('.mjs')) hasEsmExport = true;
    if (expStr.includes('"require"') || expStr.includes('.cjs')) hasCjsExport = true;
  }

  if (isTypeModule && !hasCjsExport && !pkgData.main) {
    return { isEsm: true, isCjs: false, label: 'Pure ESM' };
  }
  if ((isTypeModule || hasModuleField || hasEsmExport) && (hasCjsExport || pkgData.main)) {
    return { isEsm: true, isCjs: true, label: 'Dual (ESM + CJS)' };
  }
  if (hasModuleField || hasEsmExport || isTypeModule) {
    return { isEsm: true, isCjs: false, label: 'ESM' };
  }
  return { isEsm: false, isCjs: true, label: 'CommonJS' };
}

// ==========================================
// 4. INTENT PARSING ENGINE (DETERMINISTIC REGEX)
// ==========================================
export function parseIntent(query) {
  if (!query || typeof query !== 'string') {
    return { view: 'empty', rawQuery: '' };
  }
  const clean = query.trim();
  if (!clean) {
    return { view: 'empty', rawQuery: '' };
  }

  // 1. Alternatives: e.g. "npm alternatives to moment", "alternatives to axios", "moment alternatives"
  const altMatch =
    clean.match(/^(?:(?:npm|top|best)\s+)?(?:alternatives?|replacements?|competitors?)\s+(?:to|for)\s+([@a-z0-9_.-]+(?:\s+npm)?)/i) ||
    clean.match(/^([@a-z0-9_.-]+)\s+(?:alternatives?|replacements?)(?:\s+npm)?$/i) ||
    clean.match(/^(?:packages?|libraries?|libs?)\s+(?:like|similar\s+to)\s+([@a-z0-9_.-]+)/i) ||
    clean.match(/^(?:what\s+can\s+i\s+use\s+instead\s+of)\s+([@a-z0-9_.-]+)/i);

  if (altMatch && altMatch[1]) {
    const pkg = altMatch[1].replace(/\s+npm$/i, '').trim();
    return { view: 'alternatives', package: pkg, rawQuery: clean };
  }

  // 2. Compare: e.g. "compare react and vue", "express 4 vs 5", "react vs vue", "compare express, fastify and koa"
  const compareMatch = clean.match(
    /^(?:compare\s+)?([@a-z0-9_.-]+(?:\s+\d+(?:\.\d+)*)?)\s+(?:vs\.?|versus|and)\s+([@a-z0-9_.-]+(?:\s+\d+(?:\.\d+)*)?)(?:\s+(?:vs\.?|versus|and)\s+([@a-z0-9_.-]+(?:\s+\d+(?:\.\d+)*)?))?$/i
  );

  if (compareMatch) {
    let p1 = compareMatch[1].trim();
    let p2 = compareMatch[2].trim();
    let p3 = compareMatch[3] ? compareMatch[3].trim() : null;

    // Check version-aware comparison for same package, e.g. "express 4 vs 5"
    const samePkgVerMatch = p1.match(/^([@a-z0-9_.-]+)\s+(\d+(?:\.\d+)*)$/i);
    if (samePkgVerMatch) {
      const baseName = samePkgVerMatch[1];
      const ver1 = samePkgVerMatch[2];
      const ver2Match = p2.match(/^(\d+(?:\.\d+)*)$/);
      if (ver2Match) {
        return {
          view: 'compare',
          packages: [`${baseName}@${ver1}`, `${baseName}@${ver2Match[1]}`],
          isVersionCompare: true,
          basePackage: baseName,
          rawQuery: clean
        };
      }
    }

    const packages = [p1, p2];
    if (p3) packages.push(p3);

    return {
      view: 'compare',
      packages: packages.map((p) => p.replace(/\s+/g, '@')),
      rawQuery: clean
    };
  }

  // 3. Use-case queries: e.g. "best npm package for date formatting", "npm package for state management"
  const useCaseMatch =
    clean.match(/^(?:best|top|recommended)?\s*(?:npm\s+)?(?:package|packages|library|libraries|module|modules)\s+(?:for|to)\s+(.+)$/i) ||
    clean.match(/^(?:what\s+is\s+the\s+best\s+npm\s+package\s+for)\s+(.+)$/i);

  if (useCaseMatch && useCaseMatch[1]) {
    const rawCase = useCaseMatch[1].trim().replace(/\s+npm$/i, '');
    return { view: 'use-case', useCase: rawCase, rawQuery: clean };
  }

  // 4. Details (fallback): single package name with optional version/flags
  let pkgCandidate = clean
    .replace(/^npm\s+package\s+/i, '')
    .replace(/^package\s+info\s+/i, '')
    .replace(/^npm\s+info\s+/i, '')
    .replace(/^npm\s+view\s+/i, '')
    .replace(/^npm\s+show\s+/i, '')
    .replace(/^npm\s+/i, '')
    .replace(/\s+npm$/i, '')
    .replace(/\s+package$/i, '')
    .trim();

  if (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(?:@[0-9a-zA-Z.-]+)?$/i.test(pkgCandidate)) {
    return { view: 'details', package: pkgCandidate, rawQuery: clean };
  }

  // If query is multiple words and does not look like invalid symbols, treat as use-case
  if (clean.split(/\s+/).length >= 2 && !clean.includes('/') && /^[a-zA-Z0-9\s-]+$/.test(clean)) {
    return { view: 'use-case', useCase: clean.replace(/^npm\s+/i, ''), rawQuery: clean };
  }

  return { view: 'unmatched', rawQuery: clean };
}

/**
 * Extract an explicit package entity from platform props.searchData if present.
 */
export function extractEntityPackage(searchData) {
  if (!searchData) return null;
  const target = Array.isArray(searchData) ? searchData[0] : searchData;
  if (!target || typeof target !== 'object') return null;

  const entities = target.entities;
  if (!entities) return null;

  if (typeof entities === 'string' && entities.trim()) {
    return cleanPkgName(entities);
  }
  if (Array.isArray(entities) && entities.length > 0) {
    const first = entities[0];
    if (typeof first === 'string' && first.trim()) return cleanPkgName(first);
    if (first && typeof first === 'object') {
      const name = first.package || first.name || first.value;
      if (typeof name === 'string' && name.trim()) return cleanPkgName(name);
    }
  }
  if (typeof entities === 'object') {
    const name = entities.package || entities.name || entities.primary || entities.target;
    if (typeof name === 'string' && name.trim()) return cleanPkgName(name);
  }
  return null;
}

// ==========================================
// 5. PACKAGE HUB DATA DERIVATION ENGINE
// ==========================================

export const GENERIC_PROFILE_WORDS = new Set([
  'javascript',
  'js',
  'node',
  'nodejs',
  'npm',
  'library',
  'framework',
  'typescript',
  'utility',
  'util',
  'tool',
  'tools',
  'package',
  'module',
  'es6',
  'es2015',
  'ts'
]);

export const DESCRIPTION_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'fast', 'simple', 'easy', 'lightweight', 'modern',
  'zero', 'flexible', 'small', 'tiny', 'popular', 'great', 'best', 'native', 'support', 'using',
  'based', 'provide', 'provides', 'written', 'high', 'performance', 'like', 'next', 'generation'
]);

/**
 * Step B: Extract up to 4 clean profile terms from keywords or description.
 */
export function extractProfileTerms(pkgData) {
  if (!pkgData) return [];
  const primaryName = (pkgData.name || '').toLowerCase().trim();
  const rawKeywords = Array.isArray(pkgData.keywords) ? pkgData.keywords : [];

  const validKw = [];
  for (const kw of rawKeywords) {
    if (typeof kw !== 'string') continue;
    const clean = kw.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (clean.length >= 2 && !GENERIC_PROFILE_WORDS.has(clean) && clean !== primaryName) {
      if (!validKw.includes(clean)) {
        validKw.push(clean);
      }
    }
    if (validKw.length >= 4) break;
  }

  if (validKw.length > 0) {
    return validKw;
  }

  // Extract from description by stopword filtering
  const desc = (pkgData.description || '').toLowerCase();
  const words = desc.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  const descTerms = [];
  for (const w of words) {
    const clean = w.trim();
    if (
      clean.length >= 3 &&
      !DESCRIPTION_STOPWORDS.has(clean) &&
      !GENERIC_PROFILE_WORDS.has(clean) &&
      clean !== primaryName &&
      !descTerms.includes(clean)
    ) {
      descTerms.push(clean);
      if (descTerms.length >= 4) break;
    }
  }

  if (descTerms.length > 0) {
    return descTerms;
  }

  // Fallback to package name alone
  return primaryName ? [primaryName] : [];
}

/**
 * Step C: Fetch live candidate packages matching profile terms from npm search.
 */
export async function fetchLiveCandidates(profileTerms, primaryPkgData, primaryDownloads = 0, signal = null) {
  if (!profileTerms || profileTerms.length === 0 || !primaryPkgData?.name) {
    return [];
  }

  const primaryName = (primaryPkgData.name || '').toLowerCase().trim();
  const primaryKeywords = (primaryPkgData.keywords || []).map((k) => String(k).toLowerCase());

  const searchPhrase = profileTerms.slice(0, 3).join(' ');
  const kwSearchPhrase = `keywords:${profileTerms[0]}`;

  const [s1, s2] = await Promise.all([
    fetchUseCaseSearch(searchPhrase, 15, signal),
    fetchUseCaseSearch(kwSearchPhrase, 15, signal)
  ]);

  if (signal?.aborted) return [];

  const rawList = [...(s1 || []), ...(s2 || [])];
  const seenNames = new Set();
  const deduped = [];

  for (const item of rawList) {
    const pkg = item?.package || item;
    const name = (pkg?.name || '').toLowerCase().trim();
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    deduped.push(pkg);
  }

  // Filtering:
  // 1. remove primary
  // 2. remove @types/
  // 3. remove prefix/suffix variations (react-foo, foo-react) unless sharing >= 3 keywords
  // 4. remove deprecated
  const filtered = [];
  for (const cand of deduped) {
    const cName = (cand.name || '').toLowerCase().trim();
    if (cName === primaryName) continue;
    if (cName.startsWith('@types/')) continue;
    if (cand.deprecated) continue;

    const candKeywords = (cand.keywords || []).map((k) => String(k).toLowerCase());
    const sharedKwCount = candKeywords.filter((k) => primaryKeywords.includes(k)).length;

    const isPrefixOrSuffix =
      cName.startsWith(`${primaryName}-`) ||
      cName.startsWith(`${primaryName}_`) ||
      cName.endsWith(`-${primaryName}`) ||
      cName.endsWith(`_${primaryName}`);

    if (isPrefixOrSuffix && sharedKwCount < 3) {
      continue;
    }

    filtered.push({
      ...cand,
      sharedKwCount
    });
  }

  if (signal?.aborted) return [];

  // Fetch weekly downloads for survivors
  const dlResults = await Promise.allSettled(
    filtered.map((c) => fetchWeeklyDownloads(c.name, signal))
  );

  const withDownloads = filtered.map((c, i) => {
    const res = dlResults[i];
    const dl = res.status === 'fulfilled' ? res.value : null;
    return {
      ...c,
      weeklyDownloads: dl
    };
  });

  // Remove candidates with 0 downloads
  const activeUsage = withDownloads.filter((c) => c.weeklyDownloads !== null && c.weeklyDownloads > 0);

  // Remove low usage under 1% of primary's downloads, unless fewer than 3 candidates remain
  const threshold = (primaryDownloads || 0) * 0.01;
  const popularCandidates = activeUsage.filter((c) => c.weeklyDownloads >= threshold);

  return popularCandidates.length >= 3 ? popularCandidates : activeUsage;
}

/**
 * Step D: Rank alternatives by shared keyword count, then weekly downloads.
 */
export function rankAlternatives(candidates, primaryPkgData) {
  if (!candidates || candidates.length === 0) return [];
  const primaryKeywords = (primaryPkgData?.keywords || []).map((k) => String(k).toLowerCase());

  const scored = candidates.map((cand) => {
    const candKeywords = (cand.keywords || []).map((k) => String(k).toLowerCase());
    const sharedCount = candKeywords.filter((k) => primaryKeywords.includes(k)).length;
    return {
      ...cand,
      score: sharedCount,
      isWeakMatch: sharedCount === 0,
      weeklyDownloads: cand.weeklyDownloads || 0
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.weeklyDownloads - a.weeklyDownloads;
  });

  return scored.slice(0, 5);
}

// ==========================================
// 6. RAW DATA FETCHERS WITH PROMISE.ALLSETTLED
// ==========================================

export async function fetchPackageInfo(pkgQuery, signal = null) {
  if (!pkgQuery || typeof pkgQuery !== 'string' || !pkgQuery.trim()) {
    return {
      name: 'unknown',
      version: 'latest',
      description: 'No package specified.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: 'Missing package query'
    };
  }

  const rawTrimmed = pkgQuery.trim();
  let [name, requestedVersion] = rawTrimmed.startsWith('@')
    ? [
        `@${rawTrimmed.slice(1).split('@')[0]}`,
        rawTrimmed.slice(1).split('@')[1] || null
      ]
    : rawTrimmed.split('@');

  name = (name || '').toLowerCase().trim();
  if (!name) {
    return {
      name: 'unknown',
      version: 'latest',
      description: 'Invalid package name.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: 'Invalid package name'
    };
  }

  const encoded = encodeURIComponent(name);
  const dev = isDevEnvironment();

  try {
    let pkgData = null;
    let fullPkgData = null;

    if (requestedVersion) {
      const packumentUrls = dev
        ? [
            `/proxy/npm-registry/${encoded}`,
            `https://registry.npmmirror.com/${encoded}`,
            `https://registry.npmjs.org/${encoded}`
          ]
        : [
            `https://registry.npmmirror.com/${encoded}`,
            `https://registry.npmjs.org/${encoded}`
          ];

      fullPkgData = await fetchWithFallback(packumentUrls, null, 4000, signal);

      if (fullPkgData && fullPkgData.versions) {
        if (fullPkgData.versions[requestedVersion]) {
          pkgData = fullPkgData.versions[requestedVersion];
        } else {
          const matching = Object.keys(fullPkgData.versions).filter(
            (v) => v.startsWith(`${requestedVersion}.`) || v === requestedVersion
          );
          if (matching.length > 0) {
            const resolvedVer = matching[matching.length - 1];
            pkgData = fullPkgData.versions[resolvedVer];
          }
        }
      }
    }

    if (!pkgData) {
      const latestUrls = dev
        ? [
            `/proxy/npm-registry/${encoded}/latest`,
            `https://registry.npmmirror.com/${encoded}/latest`,
            `https://registry.npmjs.org/${encoded}/latest`
          ]
        : [
            `https://registry.npmmirror.com/${encoded}/latest`,
            `https://registry.npmjs.org/${encoded}/latest`
          ];

      pkgData = await fetchWithFallback(latestUrls, null, 4000, signal);
    }

    if (!pkgData) {
      return {
        name,
        version: requestedVersion || 'latest',
        description: 'Package information unavailable or not found.',
        license: 'N/A',
        dependenciesCount: 0,
        unpackedSize: null,
        deprecated: null,
        keywords: [],
        error: 'Package not found'
      };
    }

    let deprecationMessage = pkgData?.deprecated || null;
    if (!deprecationMessage && fullPkgData?.versions?.[pkgData?.version]?.deprecated) {
      deprecationMessage = fullPkgData.versions[pkgData.version].deprecated;
    }

    return {
      name: pkgData.name || name,
      version: pkgData.version || requestedVersion || 'latest',
      description: pkgData.description || 'No description provided.',
      license: pkgData.license || 'N/A',
      homepage: pkgData.homepage || null,
      repository: typeof pkgData.repository === 'object' ? pkgData.repository?.url : pkgData.repository,
      dependenciesCount: Object.keys(pkgData.dependencies || {}).length,
      unpackedSize: pkgData.dist?.unpackedSize || null,
      types: pkgData.types || pkgData.typings || null,
      type: pkgData.type || null,
      keywords: pkgData.keywords || [],
      deprecated: deprecationMessage,
      releaseDate: pkgData.time?.[pkgData.version] || pkgData.publish_time || null,
      raw: pkgData
    };
  } catch (err) {
    return {
      name,
      version: requestedVersion || 'latest',
      description: 'Package information unavailable or not found.',
      license: 'N/A',
      dependenciesCount: 0,
      unpackedSize: null,
      deprecated: null,
      keywords: [],
      error: err?.message || 'Failed to load'
    };
  }
}

export async function fetchWeeklyDownloads(pkgName, signal = null) {
  const clean = cleanPkgName(pkgName);
  if (!clean) return null;

  const encoded = encodeURIComponent(clean);
  const dev = isDevEnvironment();
  const urls = dev
    ? [
        `/proxy/npm-downloads/point/last-week/${encoded}`,
        `https://registry.npmmirror.com/downloads/point/last-week/${encoded}`,
        `https://api.npmjs.org/downloads/point/last-week/${encoded}`
      ]
    : [
        `https://registry.npmmirror.com/downloads/point/last-week/${encoded}`,
        `https://api.npmjs.org/downloads/point/last-week/${encoded}`
      ];

  try {
    const data = await fetchWithFallback(urls, null, 3000, signal);
    return data?.downloads ?? null;
  } catch {
    return null;
  }
}

export async function fetchMonthlyDownloadsRange(pkgName, signal = null) {
  const clean = cleanPkgName(pkgName);
  if (!clean) return null;

  const encoded = encodeURIComponent(clean);
  const dev = isDevEnvironment();
  const urls = dev
    ? [
        `/proxy/npm-downloads/range/last-month/${encoded}`,
        `https://registry.npmmirror.com/downloads/range/last-month/${encoded}`,
        `https://api.npmjs.org/downloads/range/last-month/${encoded}`
      ]
    : [
        `https://registry.npmmirror.com/downloads/range/last-month/${encoded}`,
        `https://api.npmjs.org/downloads/range/last-month/${encoded}`
      ];

  try {
    const data = await fetchWithFallback(urls, null, 3000, signal);
    if (data?.downloads && Array.isArray(data.downloads)) {
      return data.downloads.map((item) => (typeof item === 'object' ? item.downloads : item));
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchBundleSize(pkgQuery, rawPkgData = null, signal = null) {
  const clean = cleanPkgName(pkgQuery);
  if (!clean) return { size: null, gzip: null, dependencyCount: null };

  const encoded = encodeURIComponent(clean);
  const dev = isDevEnvironment();
  const urls = dev
    ? [
        `/proxy/bundlephobia/size?package=${encoded}`,
        `https://bundlephobia.com/api/size?package=${encoded}`
      ]
    : [
        `https://bundlephobia.com/api/size?package=${encoded}`
      ];

  try {
    const data = await fetchWithFallback(urls, null, 3500, signal);
    if (data && (data.size != null || data.gzip != null)) {
      return {
        size: data.size ?? null,
        gzip: data.gzip ?? null,
        dependencyCount: data.dependencyCount ?? null
      };
    }
  } catch {
    // Continue to fallback
  }

  // Fallback 1: Curated known package sizes
  const known = KNOWN_BUNDLE_SIZES[clean.toLowerCase()];
  if (known) {
    return {
      size: known.size,
      gzip: known.gzip,
      dependencyCount: known.dependencyCount
    };
  }

  // Fallback 2: Heuristic estimation from unpackedSize
  const unpackedSize = rawPkgData?.unpackedSize || rawPkgData?.dist?.unpackedSize;
  if (unpackedSize && typeof unpackedSize === 'number') {
    return {
      size: Math.round(unpackedSize * 0.75),
      gzip: Math.round(unpackedSize * 0.28),
      dependencyCount: rawPkgData?.dependenciesCount || 0
    };
  }

  return { size: null, gzip: null, dependencyCount: null };
}

export async function fetchUseCaseSearch(text, size = 5, signal = null) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return [];
  }
  const encoded = encodeURIComponent(text.trim());
  const dev = isDevEnvironment();
  const urls = dev
    ? [
        `/proxy/npm-registry/-/v1/search?text=${encoded}&size=${size}`,
        `https://registry.npmmirror.com/-/v1/search?text=${encoded}&size=${size}`,
        `https://registry.npmjs.org/-/v1/search?text=${encoded}&size=${size}`
      ]
    : [
        `https://registry.npmmirror.com/-/v1/search?text=${encoded}&size=${size}`,
        `https://registry.npmjs.org/-/v1/search?text=${encoded}&size=${size}`
      ];

  try {
    const data = await fetchWithFallback(urls, null, 4000, signal);
    return data?.objects || [];
  } catch {
    return [];
  }
}

// ==========================================
// 7. UI HELPERS & SPARKLINE
// ==========================================

function MissingValue({ tooltip = 'Not published, rate limited, or network restricted' }) {
  return (
    <Tooltip title={tooltip}>
      <Typography
        component="span"
        variant="inherit"
        sx={{
          color: 'text.disabled',
          fontVariantNumeric: 'tabular-nums',
          cursor: 'help'
        }}
      >
        N/A
      </Typography>
    </Tooltip>
  );
}

function DownloadSparkline({
  data,
  customMin,
  customMax,
  width = 100,
  height = 24,
  strokeColor
}) {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        No trend data
      </Typography>
    );
  }

  const min = customMin !== undefined ? customMin : Math.min(...data);
  const max = customMax !== undefined ? customMax : Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  let pctChange = 0;
  if (data.length >= 14) {
    const last7 = data.slice(-7);
    const prev7 = data.slice(-14, -7);
    const avgLast7 = last7.reduce((a, b) => a + b, 0) / 7;
    const avgPrev7 = prev7.reduce((a, b) => a + b, 0) / 7;
    if (avgPrev7 > 0) {
      pctChange = Math.round(((avgLast7 - avgPrev7) / avgPrev7) * 100);
    }
  } else {
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half);
    const secondHalf = data.slice(half);
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    pctChange = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
  }

  const arrow = pctChange >= 0 ? '↑' : '↓';
  const displayPct = `${Math.abs(pctChange)}%`;
  const tooltipText = `7-day average vs previous 7 days: ${pctChange >= 0 ? '+' : ''}${pctChange}%`;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor || 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Tooltip title={tooltipText}>
        <Typography
          variant="caption"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
            cursor: 'help',
            whiteSpace: 'nowrap'
          }}
        >
          {arrow} {displayPct}
        </Typography>
      </Tooltip>
    </Stack>
  );
}

// ==========================================
// 8. PROGRESSIVE SKELETON LOADERS
// ==========================================
function DetailsSkeleton({ accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '4px' }} />
      </Stack>
      <Skeleton variant="text" width="85%" height={22} sx={{ mb: 2.5 }} />
      <Grid container spacing={1.5} mb={2.5}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Skeleton variant="rounded" height={68} sx={{ borderRadius: '6px' }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={40} sx={{ mb: 2, borderRadius: '6px' }} />
      <Skeleton variant="rounded" height={36} width={280} sx={{ borderRadius: '6px' }} />
    </Card>
  );
}

function TableSkeleton({ cols = 2, accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Skeleton variant="text" width={220} height={30} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={1.5} mb={2}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={`${100 / cols}%`} height={60} sx={{ borderRadius: '6px' }} />
        ))}
      </Stack>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: '4px' }} />
      ))}
    </Card>
  );
}

function ListSkeleton({ accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Skeleton variant="text" width={240} height={30} sx={{ mb: 2 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1.5, borderRadius: '6px' }} />
      ))}
    </Card>
  );
}

// ==========================================
// 9. SHARED ROW COMPONENT (ALTERNATIVES & USE CASE)
// ==========================================

export function ResultRow({
  rank,
  item,
  primaryName,
  primaryKeywords = [],
  onInspect,
  tokens,
  accent,
  isSidebar
}) {
  const isTop = rank === 1;
  const isPrimary = item.isPrimary || item.name === primaryName;
  const rawKeywords = item.keywords || item.info?.keywords || [];
  const primaryKwLower = (primaryKeywords || []).map((k) => String(k).toLowerCase());

  const ts = detectTypeScript(item.raw || item.info?.raw);

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 2,
        borderRadius: '6px',
        bgcolor: tokens.background.paper,
        border: isTop ? `1px solid ${accent}` : `1px solid ${tokens.divider}`,
        transition: 'border-color 150ms ease',
        '&:hover': {
          borderColor: tokens.border
        }
      }}
    >
      <Stack
        direction={isSidebar ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isSidebar ? 'flex-start' : 'center'}
        spacing={1}
        mb={1}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap">
          {/* Monospace Rank number */}
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: tokens.text.secondary,
              fontWeight: 600,
              minWidth: 16
            }}
          >
            {rank}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>

          <Box
            sx={{
              px: 0.75,
              py: 0.2,
              borderRadius: '4px',
              border: '1px solid',
              borderColor: tokens.border,
              fontSize: '0.75rem',
              color: tokens.text.secondary
            }}
          >
            v{item.version}
          </Box>

          {isPrimary && (
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: `1px solid ${tokens.action.primary}`,
                bgcolor: tokens.background.subtle,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.primary
              }}
            >
              This package
            </Box>
          )}

          {item.isWeakMatch && !isPrimary && (
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                color: tokens.text.disabled
              }}
            >
              Weak match
            </Box>
          )}

          {ts.supported && (
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                color: tokens.text.secondary
              }}
            >
              {ts.label}
            </Box>
          )}
        </Stack>

        {/* Weekly Downloads & Bundle size */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <DownloadIcon sx={{ fontSize: 14, color: tokens.text.secondary }} />
            <Typography
              variant="caption"
              sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: tokens.text.primary }}
            >
              {item.weeklyDownloads !== null && item.weeklyDownloads !== undefined ? (
                formatNumber(item.weeklyDownloads)
              ) : (
                <MissingValue />
              )}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <SpeedIcon sx={{ fontSize: 14, color: tokens.text.secondary }} />
            <Typography
              variant="caption"
              sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: tokens.text.primary }}
            >
              {item.bundleSize?.size !== null && item.bundleSize?.size !== undefined ? (
                formatBytes(item.bundleSize.size)
              ) : (
                <MissingValue />
              )}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
        {item.description || 'No description provided.'}
      </Typography>

      {/* Keywords with shared ones highlighted */}
      {rawKeywords && rawKeywords.length > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1.5, rowGap: 0.75 }}>
          {rawKeywords.slice(0, isSidebar ? 4 : 6).map((kw) => {
            const isMatch = primaryKwLower.length > 0 && primaryKwLower.includes(String(kw).toLowerCase());
            return (
              <Box
                key={kw}
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: isMatch ? accent : tokens.divider,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: isMatch ? tokens.text.primary : tokens.text.secondary,
                  bgcolor: 'transparent'
                }}
              >
                {kw}
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Row Action Buttons: identical in all lists: Details (opens the shared sub-view), npm (external link) */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          onClick={() => onInspect(item.name)}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            minHeight: 32,
            borderRadius: '6px',
            borderColor: tokens.border,
            color: tokens.text.primary
          }}
        >
          Details
        </Button>
        <Button
          size="small"
          variant="text"
          startIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
          onClick={(e) => {
            e.preventDefault();
            const url = `https://www.npmjs.com/package/${encodeURIComponent(item.name).replace('%40', '@')}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            minHeight: 32,
            borderRadius: '4px',
            color: tokens.text.secondary,
            '&:hover': {
              color: tokens.text.primary
            }
          }}
        >
          npm
        </Button>
      </Stack>
    </Box>
  );
}

export const PackageHubRow = ResultRow;

// ==========================================
// 10. VIEW COMPONENTS
// ==========================================

// --- VIEW 1: DETAILS ---
function DetailsView({
  packageData,
  weeklyDownloads,
  bundleSize,
  downloadTrend,
  onSwitchTab,
  isSidebar,
  tokens
}) {
  const [copied, setCopied] = useState(false);
  const tsInfo = detectTypeScript(packageData.raw);
  const esmInfo = detectEsm(packageData.raw);
  const accent = tokens.modeAccents.details;

  const handleCopyInstall = () => {
    navigator.clipboard?.writeText(`npm i ${packageData.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanRepoUrl = useMemo(() => {
    if (!packageData.repository) return null;
    let url = typeof packageData.repository === 'object' ? packageData.repository?.url || '' : String(packageData.repository);
    if (!url) return null;
    url = url
      .replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/^ssh:\/\/git@github.com[:/]/, 'https://github.com/')
      .replace(/^git@github.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }, [packageData.repository]);

  const handleOpenNpm = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    const pkgTarget = (packageData.name || '').trim();
    const url = `https://www.npmjs.com/package/${encodeURIComponent(pkgTarget).replace('%40', '@')}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [packageData.name]);

  const handleOpenGitHub = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cleanRepoUrl && typeof window !== 'undefined') {
      window.open(cleanRepoUrl, '_blank', 'noopener,noreferrer');
    }
  }, [cleanRepoUrl]);

  if (packageData.error && !packageData.version) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: '8px',
          border: '1px solid',
          borderColor: tokens.border,
          borderTop: `3px solid ${accent}`,
          bgcolor: tokens.background.paper,
          p: { xs: 2, sm: 3 },
          boxShadow: 'none'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          No package named "{packageData.name}" on npm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check the package spelling or search for alternative topics.
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        borderTop: `3px solid ${accent}`,
        bgcolor: tokens.background.paper,
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Deprecation Alert: only red in the UI */}
      {packageData.deprecated && (
        <Alert
          severity="error"
          variant="standard"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: tokens.error.border,
            bgcolor: tokens.error.bg,
            color: tokens.error.text,
            '& .MuiAlert-icon': { color: tokens.error.main }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600, mb: 0.25 }}>Package Deprecated</AlertTitle>
          <Typography variant="body2" sx={{ wordBreak: 'break-word', color: 'inherit' }}>
            {packageData.deprecated}
          </Typography>
        </Alert>
      )}

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Title row */}
        <Stack
          direction={isSidebar ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isSidebar ? 'flex-start' : 'center'}
          spacing={1}
          mb={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {packageData.name}
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary
              }}
            >
              v{packageData.version}
            </Box>
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                color: tokens.text.secondary
              }}
            >
              {packageData.license || 'N/A'}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {tsInfo.supported && <VerifiedIcon sx={{ fontSize: 13, color: tokens.text.secondary }} />}
              {tsInfo.label}
            </Box>
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary
              }}
            >
              {esmInfo.label}
            </Box>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
          {packageData.description}
        </Typography>

        {/* Stat Tiles */}
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Box
              sx={{
                p: 1.5,
                textAlign: 'left',
                bgcolor: tokens.background.subtle,
                border: '1px solid',
                borderColor: tokens.border,
                borderRadius: '6px'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Weekly downloads
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {weeklyDownloads !== null ? formatNumber(weeklyDownloads) : <MissingValue />}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Box
              sx={{
                p: 1.5,
                textAlign: 'left',
                bgcolor: tokens.background.subtle,
                border: '1px solid',
                borderColor: tokens.border,
                borderRadius: '6px'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Bundle size (min / gzip)
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
                {bundleSize?.size !== null ? (
                  `${formatBytes(bundleSize?.size)} / ${formatBytes(bundleSize?.gzip)}`
                ) : (
                  <MissingValue />
                )}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Box
              sx={{
                p: 1.5,
                textAlign: 'left',
                bgcolor: tokens.background.subtle,
                border: '1px solid',
                borderColor: tokens.border,
                borderRadius: '6px'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Dependencies
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {packageData.dependenciesCount ?? <MissingValue />}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Box
              sx={{
                p: 1.5,
                textAlign: 'left',
                bgcolor: tokens.background.subtle,
                border: '1px solid',
                borderColor: tokens.border,
                borderRadius: '6px'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Released
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.25 }}>
                {formatDate(packageData.releaseDate)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 30-Day Download Sparkline Row */}
        {downloadTrend && (
          <Box
            sx={{
              p: 1.5,
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: tokens.background.subtle,
              border: '1px solid',
              borderColor: tokens.border,
              borderRadius: '6px'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUpIcon sx={{ fontSize: 16, color: tokens.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                30-day download trend
              </Typography>
            </Stack>
            <DownloadSparkline data={downloadTrend} strokeColor={tokens.sparkline} />
          </Box>
        )}

        {/* Monospace Install Command Block */}
        <Box
          sx={{
            p: 1,
            px: 1.5,
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: tokens.background.default,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600, fontFamily: 'monospace' }}>
              $
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              npm i {packageData.name}
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCopyInstall}
            startIcon={copied ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : <ContentCopyIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              minHeight: 28,
              py: 0.25,
              px: 1,
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: tokens.border,
              color: tokens.text.primary,
              bgcolor: tokens.background.paper
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </Box>

        {/* Action Buttons: Switch tabs internally */}
        <Stack
          direction={isSidebar ? 'column' : 'row'}
          spacing={1}
          flexWrap="wrap"
          alignItems={isSidebar ? 'stretch' : 'center'}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AltRouteIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => onSwitchTab('alternatives')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 36,
              borderRadius: '6px',
              bgcolor: tokens.action.primary,
              color: tokens.action.primaryText,
              border: `1px solid ${tokens.action.primary}`,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.action.hover,
                boxShadow: 'none'
              }
            }}
          >
            See alternatives
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrowsIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => onSwitchTab('compare')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 36,
              borderRadius: '6px',
              borderColor: tokens.border,
              color: tokens.text.primary,
              '&:hover': {
                borderColor: tokens.text.secondary,
                bgcolor: tokens.background.subtle
              }
            }}
          >
            Compare
          </Button>

          <Box
            sx={{
              ml: isSidebar ? 0 : 'auto',
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              width: isSidebar ? '100%' : 'auto'
            }}
          >
            {cleanRepoUrl && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GitHubIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleOpenGitHub}
                href={cleanRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 36,
                  borderRadius: '6px',
                  borderColor: tokens.border,
                  color: tokens.text.primary,
                  flexGrow: isSidebar ? 1 : 0,
                  '&:hover': {
                    borderColor: tokens.text.secondary,
                    bgcolor: tokens.background.subtle
                  }
                }}
              >
                GitHub
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon sx={{ fontSize: '15px !important' }} />}
              onClick={handleOpenNpm}
              href={`https://www.npmjs.com/package/${encodeURIComponent(packageData.name || '').replace('%40', '@')}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 36,
                borderRadius: '6px',
                borderColor: tokens.border,
                color: tokens.text.primary,
                flexGrow: isSidebar ? 1 : 0,
                '&:hover': {
                  borderColor: tokens.text.secondary,
                  bgcolor: tokens.background.subtle
                }
              }}
            >
              View on npm
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// --- VIEW 2: COMPARE ---
function CompareView({
  primaryPkg,
  packagesData,
  availableAlternatives = [],
  topAlternativeName,
  onPartnerChange,
  onAddPackage,
  onRemovePackage,
  onInspect,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents.compare;
  const partnerPkg = packagesData[1]?.info?.name || 'partner';
  const isTopAlt = topAlternativeName && partnerPkg.toLowerCase() === topAlternativeName.toLowerCase();

  const [customPkgInput, setCustomPkgInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const { sharedMin, sharedMax } = useMemo(() => {
    const allPoints = packagesData.flatMap((p) => p.downloadTrend || []);
    if (allPoints.length === 0) return { sharedMin: 0, sharedMax: 1 };
    return {
      sharedMin: Math.min(...allPoints),
      sharedMax: Math.max(...allPoints)
    };
  }, [packagesData]);

  // Factual takeaways: strictly facts, no winner language
  const takeaways = useMemo(() => {
    if (!packagesData || packagesData.length < 2) return [];
    const lines = [];

    const validDownloads = packagesData.filter((p) => p.weeklyDownloads !== null && p.weeklyDownloads !== undefined);
    if (validDownloads.length >= 2) {
      const sortedByDl = [...validDownloads].sort((a, b) => b.weeklyDownloads - a.weeklyDownloads);
      const top = sortedByDl[0];
      const second = sortedByDl[1];
      const ratio = second.weeklyDownloads > 0 ? (top.weeklyDownloads / second.weeklyDownloads).toFixed(1) : null;
      if (ratio && Number(ratio) > 1.1) {
        lines.push(
          `${top.info.name} recorded ${formatNumber(top.weeklyDownloads)} weekly downloads vs ${formatNumber(
            second.weeklyDownloads
          )} for ${second.info.name} (~${ratio}x volume).`
        );
      } else {
        lines.push(
          `${top.info.name} and ${second.info.name} have comparable weekly download volumes (${formatNumber(
            top.weeklyDownloads
          )} vs ${formatNumber(second.weeklyDownloads)}).`
        );
      }
    }

    const validSizes = packagesData.filter((p) => p.bundleSize?.size !== null && p.bundleSize?.size > 0);
    if (validSizes.length >= 2) {
      const sortedBySize = [...validSizes].sort((a, b) => a.bundleSize.size - b.bundleSize.size);
      const smallest = sortedBySize[0];
      const largest = sortedBySize[sortedBySize.length - 1];
      const diff = formatBytes(largest.bundleSize.size - smallest.bundleSize.size);
      lines.push(
        `Minified bundle size: ${smallest.info.name} is ${formatBytes(smallest.bundleSize.size)} compared to ${
          largest.info.name
        } at ${formatBytes(largest.bundleSize.size)} (${diff} difference).`
      );
    }

    const allHaveTs = packagesData.every((p) => detectTypeScript(p.info.raw).supported);
    const tsNames = packagesData.map((p) => `${p.info.name} (${detectTypeScript(p.info.raw).label})`);
    if (allHaveTs) {
      lines.push(`TypeScript support: All compared packages provide TypeScript declarations.`);
    } else {
      lines.push(`TypeScript support: ${tsNames.join(', ')}.`);
    }

    const esmNames = packagesData.map((p) => `${p.info.name} is ${detectEsm(p.info.raw).label}`);
    lines.push(`Module format: ${esmNames.join('; ')}.`);

    return lines;
  }, [packagesData]);

  const handleAddSubmit = (e) => {
    e?.preventDefault?.();
    if (customPkgInput.trim()) {
      onAddPackage(customPkgInput.trim());
      setCustomPkgInput('');
      setShowAddInput(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        borderTop: `3px solid ${accent}`,
        bgcolor: tokens.background.paper,
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Comparing {primaryPkg} with {partnerPkg}. {isTopAlt ? `${partnerPkg} is the top alternative for ${primaryPkg}.` : ''}
          </Typography>
        }
        subheader={
          <Stack direction={isSidebar ? 'column' : 'row'} spacing={1.5} alignItems={isSidebar ? 'flex-start' : 'center'} sx={{ mt: 1 }}>
            {/* Rectangular partner selector */}
            {availableAlternatives.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
                  Compare with:
                </Typography>
                <Select
                  size="small"
                  value={partnerPkg}
                  onChange={(e) => onPartnerChange(e.target.value)}
                  sx={{
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    height: 30,
                    bgcolor: tokens.background.paper,
                    borderColor: tokens.border,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: tokens.border
                    }
                  }}
                >
                  {availableAlternatives.map((alt) => (
                    <MenuItem key={alt.name} value={alt.name} sx={{ fontSize: '0.75rem' }}>
                      {alt.name} {alt.name === topAlternativeName ? '(top alternative)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            )}

            {/* Option to add a 3rd package (max 3 total) */}
            {packagesData.length < 3 && !showAddInput && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setShowAddInput(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  height: 30,
                  borderRadius: '6px',
                  borderColor: tokens.border,
                  color: tokens.text.primary
                }}
              >
                Add package (max 3)
              </Button>
            )}

            {showAddInput && (
              <Box component="form" onSubmit={handleAddSubmit} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="e.g. fastify"
                  value={customPkgInput}
                  onChange={(e) => setCustomPkgInput(e.target.value)}
                  sx={{
                    width: 140,
                    '& input': { py: 0.5, px: 1, fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border }
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  type="submit"
                  sx={{
                    minWidth: 44,
                    height: 30,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    bgcolor: tokens.action.primary,
                    color: tokens.action.primaryText
                  }}
                >
                  Add
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowAddInput(false)}
                  sx={{ minWidth: 30, height: 30, p: 0 }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </Button>
              </Box>
            )}
          </Stack>
        }
        sx={{ pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            mb: 2.5,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px',
            overflowX: 'auto',
            boxShadow: 'none'
          }}
        >
          <Table size="small" aria-label="comparison table" sx={{ minWidth: 440 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: tokens.background.subtle }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    width: isSidebar ? '35%' : '25%',
                    position: 'sticky',
                    left: 0,
                    bgcolor: tokens.background.subtle,
                    zIndex: 1,
                    borderColor: tokens.divider
                  }}
                >
                  Metric
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ fontWeight: 600, borderColor: tokens.divider }}>
                    <Stack alignItems="center" spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {pkg.info.name}
                        </Typography>
                        {idx >= 2 && (
                          <Tooltip title="Remove package">
                            <CloseIcon
                              onClick={() => onRemovePackage(pkg.info.name)}
                              sx={{ fontSize: 14, cursor: 'pointer', color: tokens.text.secondary }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                      <Box
                        sx={{
                          px: 0.75,
                          py: 0.2,
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: tokens.border,
                          fontSize: '0.75rem',
                          color: tokens.text.secondary
                        }}
                      >
                        v{pkg.info.version}
                      </Box>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Weekly Downloads */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  Weekly downloads
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {pkg.weeklyDownloads !== null ? formatNumber(pkg.weeklyDownloads) : <MissingValue />}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Download Sparklines with shared scale */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  30-day trend
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <DownloadSparkline
                        data={pkg.downloadTrend}
                        customMin={sharedMin}
                        customMax={sharedMax}
                        width={90}
                        height={24}
                        strokeColor={tokens.sparkline}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>

              {/* Bundle Size */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  Bundle size (min / gzip)
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pkg.bundleSize?.size !== null && pkg.bundleSize?.size !== undefined ? (
                        `${formatBytes(pkg.bundleSize?.size)} / ${formatBytes(pkg.bundleSize?.gzip)}`
                      ) : (
                        <MissingValue />
                      )}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Muted footnote */}
              <TableRow>
                <TableCell
                  colSpan={packagesData.length + 1}
                  sx={{
                    py: 1,
                    px: 2,
                    bgcolor: tokens.background.subtle,
                    borderColor: tokens.divider
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                    Size is for the package alone. Packages that need companions (for example react with react-dom) are not like-for-like.
                  </Typography>
                </TableCell>
              </TableRow>

              {/* TypeScript Support */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  TypeScript
                </TableCell>
                {packagesData.map((pkg, idx) => {
                  const ts = detectTypeScript(pkg.info.raw);
                  return (
                    <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: tokens.border,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: tokens.text.secondary
                        }}
                      >
                        {ts.label}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Module Type */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  Module support
                </TableCell>
                {packagesData.map((pkg, idx) => {
                  const esm = detectEsm(pkg.info.raw);
                  return (
                    <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: tokens.border,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: tokens.text.secondary
                        }}
                      >
                        {esm.label}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* License */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  License
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Typography variant="body2">{pkg.info.license || 'N/A'}</Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Dependencies count */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  Dependencies
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pkg.info.dependenciesCount ?? 0}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Actions */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                  Actions
                </TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => onInspect(pkg.info.name)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minHeight: 28,
                          borderRadius: '4px',
                          color: tokens.text.primary
                        }}
                      >
                        Inspect
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
                        onClick={(e) => {
                          e.preventDefault();
                          const url = `https://www.npmjs.com/package/${encodeURIComponent(pkg.info.name).replace('%40', '@')}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minHeight: 28,
                          borderRadius: '4px',
                          color: tokens.text.secondary,
                          '&:hover': {
                            color: tokens.text.primary
                          }
                        }}
                      >
                        npm
                      </Button>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Factual Takeaways */}
        <Box
          sx={{
            p: 2,
            bgcolor: tokens.background.subtle,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: tokens.text.primary }}>
            Factual Takeaways
          </Typography>
          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2.5,
              '& li': {
                mb: 0.5,
                color: tokens.text.secondary,
                fontSize: '0.85rem',
                lineHeight: 1.5
              }
            }}
          >
            {takeaways.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- VIEW 3: ALTERNATIVES ---
function AlternativesView({
  primaryPkg,
  primaryKeywords = [],
  alternativesList = [],
  onInspect,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents.alternatives;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        borderTop: `3px solid ${accent}`,
        bgcolor: tokens.background.paper,
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Alternatives to {primaryPkg}
          </Typography>
        }
        subheader="Ranked by shared keywords, then weekly downloads."
        sx={{ pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        {alternativesList.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No close matches found on npm.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {alternativesList.map((alt, index) => (
              <ResultRow
                key={alt.name}
                rank={index + 1}
                item={alt}
                primaryName={primaryPkg}
                primaryKeywords={primaryKeywords}
                onInspect={onInspect}
                tokens={tokens}
                accent={accent}
                isSidebar={isSidebar}
              />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// --- VIEW 4: USE-CASE ---
function UseCaseView({
  useCaseQuery,
  recommendations = [],
  primaryPkg,
  primaryKeywords = [],
  onInspect,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents['use-case'];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        borderTop: `3px solid ${accent}`,
        bgcolor: tokens.background.paper,
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {useCaseQuery ? `Recommended for "${useCaseQuery}"` : 'Use Case Recommendations'}
          </Typography>
        }
        subheader="Ranked by relevance and weekly downloads."
        sx={{ pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        {recommendations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No close matches found on npm.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {recommendations.map((item, index) => (
              <ResultRow
                key={item.name}
                rank={index + 1}
                item={item}
                primaryName={primaryPkg}
                primaryKeywords={primaryKeywords}
                onInspect={onInspect}
                tokens={tokens}
                accent={accent}
                isSidebar={isSidebar}
              />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// --- SHARED DETAILS SUB-VIEW (ALTERNATIVES, USE CASE & COMPARE) ---
function DetailsSubView({
  pkgName,
  data,
  loading,
  onBack,
  onSwitchTab,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents.details;

  return (
    <Box>
      <Button
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: '15px !important' }} />}
        onClick={onBack}
        sx={{
          mb: 1.5,
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 32,
          borderRadius: '6px',
          borderColor: tokens.border,
          color: tokens.text.secondary
        }}
      >
        Back to results
      </Button>

      {loading ? (
        <DetailsSkeleton accentColor={accent} />
      ) : data?.packageData ? (
        <DetailsView
          packageData={data.packageData}
          weeklyDownloads={data.weeklyDownloads}
          bundleSize={data.bundleSize}
          downloadTrend={data.downloadTrend}
          onSwitchTab={onSwitchTab}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      ) : (
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: tokens.border,
            bgcolor: tokens.background.paper
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Unable to load details for {pkgName}.
          </Typography>
        </Card>
      )}
    </Box>
  );
}

// --- UNMATCHED STATE ---
function UnmatchedView({ query, onQuickSearch, tokens }) {
  const suggestions = [
    'npm express',
    'compare react and vue',
    'express 4 vs 5',
    'npm alternatives to moment',
    'best npm package for date formatting'
  ];

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        textAlign: 'center',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        bgcolor: tokens.background.paper,
        boxShadow: 'none'
      }}
    >
      <SearchOffIcon sx={{ fontSize: 40, color: tokens.text.secondary, mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        No package named "{query || 'query'}" recognized on npm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 440, mx: 'auto' }}>
        Try searching for a specific package name, side-by-side comparison, alternatives, or use case.
      </Typography>

      <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.text.secondary, display: 'block', mb: 1 }}>
        SUGGESTED QUERIES
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {suggestions.map((s) => (
          <Button
            key={s}
            size="small"
            variant="outlined"
            onClick={() => onQuickSearch(s)}
            sx={{
              minHeight: 32,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderColor: tokens.border,
              color: tokens.text.primary,
              bgcolor: tokens.background.default
            }}
          >
            {s}
          </Button>
        ))}
      </Stack>
    </Card>
  );
}

// --- EMPTY SANDBOX VIEW ---
function EmptySandboxView({ onQuickSearch, tokens }) {
  const sampleQueries = [
    { label: 'Package Details: express', q: 'npm express' },
    { label: 'Compare: react vs vue', q: 'compare react and vue' },
    { label: 'Version Compare: express 4 vs 5', q: 'express 4 vs 5' },
    { label: 'Alternatives: moment', q: 'npm alternatives to moment' },
    { label: 'Use case: date formatting', q: 'best npm package for date formatting' },
    { label: 'Deprecated: request', q: 'npm request' }
  ];

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        textAlign: 'center',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        bgcolor: tokens.background.paper,
        boxShadow: 'none'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        hyperDart npm Package Component
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
        No search data provided yet. Select a sample query below to test intent routing, live metrics, and views.
      </Typography>

      <Grid container spacing={1.5} sx={{ maxWidth: 580, mx: 'auto' }}>
        {sampleQueries.map((item) => (
          <Grid item xs={12} sm={6} key={item.q}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => onQuickSearch(item.q)}
              sx={{
                textTransform: 'none',
                justifyContent: 'flex-start',
                py: 1,
                px: 1.5,
                borderRadius: '6px',
                borderColor: tokens.border,
                color: tokens.text.primary,
                minHeight: 36
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
}

// ==========================================
// 11. ERROR BOUNDARY
// ==========================================
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silently capture
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Something went wrong loading this component
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            An unexpected error occurred while rendering package metrics.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => this.setState({ hasError: false })}
            sx={{ minHeight: 36, borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}
          >
            Reload component
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 12. MAIN ROOT COMPONENT
// ==========================================
export default function NewComponent(props) {
  const themeName = props?.UIOptions?.themeName || 'light';
  const format = props?.UIOptions?.format || props?.format || 'mainline';
  const isSidebar = format === 'sidebar';
  const isDark = themeName === 'dark' || themeName === 'lightsOut';
  const tokens = isDark ? THEME_TOKENS.dark : THEME_TOKENS.light;

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: tokens.action.primary,
          contrastText: tokens.action.primaryText
        },
        background: {
          default: tokens.background.default,
          paper: tokens.background.paper
        },
        divider: tokens.divider,
        text: {
          primary: tokens.text.primary,
          secondary: tokens.text.secondary
        }
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ].join(','),
        fontWeightRegular: 400,
        fontWeightMedium: 600,
        fontWeightBold: 600
      },
      shape: {
        borderRadius: 6
      },
      components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true
          },
          styleOverrides: {
            root: {
              borderRadius: 6,
              minHeight: 36,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none !important',
                animation: 'none !important'
              },
              '&:focus-visible': {
                outline: `2px solid ${tokens.action.primary}`,
                outlineOffset: 2
              },
              '&:hover': {
                boxShadow: 'none'
              }
            }
          }
        },
        MuiCard: {
          defaultProps: {
            elevation: 0
          },
          styleOverrides: {
            root: {
              borderRadius: 8,
              boxShadow: 'none'
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              fontWeight: 600,
              boxShadow: 'none'
            }
          }
        }
      }
    });
  }, [isDark, tokens]);

  // Extract root query safely
  const rootQuery = useMemo(() => {
    if (!props.searchData) return null;
    if (typeof props.searchData === 'string') return props.searchData;
    if (Array.isArray(props.searchData)) {
      return props.searchData[0]?.query || props.searchData[0]?.component || null;
    }
    return props.searchData.query || null;
  }, [props.searchData]);

  // Intent parsing from root query
  const rootIntent = useMemo(() => {
    return parseIntent(rootQuery);
  }, [rootQuery]);

  // Entity package priority
  const entityPackage = useMemo(() => {
    return extractEntityPackage(props.searchData);
  }, [props.searchData]);

  // Determine initial hub state & primary package
  const initialHubSetup = useMemo(() => {
    let primary = entityPackage || null;
    let initialTab = 'details';
    let isHub = true;
    let initialPartner = null;
    let explicitPackages = null;

    if (rootIntent.view === 'empty' || rootIntent.view === 'unmatched') {
      return { isHub: false, primary: null, initialTab: rootIntent.view, initialPartner: null };
    }

    if (rootIntent.view === 'use-case' && !primary) {
      // Pure use-case query without a primary package
      return { isHub: false, primary: null, initialTab: 'use-case', useCaseQuery: rootIntent.useCase };
    }

    if (rootIntent.view === 'compare') {
      initialTab = 'compare';
      explicitPackages = rootIntent.packages || [];
      if (!primary && explicitPackages.length > 0) {
        primary = cleanPkgName(explicitPackages[0]);
      }
      if (explicitPackages.length > 1) {
        initialPartner = cleanPkgName(explicitPackages[1]);
      }
    } else if (rootIntent.view === 'alternatives') {
      initialTab = 'alternatives';
      if (!primary) primary = cleanPkgName(rootIntent.package);
    } else if (rootIntent.view === 'details') {
      initialTab = 'details';
      if (!primary) primary = cleanPkgName(rootIntent.package);
    }

    if (!primary) {
      primary = 'react';
    }

    return {
      isHub: true,
      primary,
      initialTab,
      initialPartner,
      explicitPackages
    };
  }, [rootIntent, entityPackage]);

  // Local navigation state
  const [activeTab, setActiveTab] = useState(initialHubSetup.initialTab);
  const [currentPrimary, setCurrentPrimary] = useState(initialHubSetup.primary);
  const [comparePackages, setComparePackages] = useState(
    initialHubSetup.explicitPackages || (initialHubSetup.primary ? [initialHubSetup.primary] : [])
  );
  const [comparePartner, setComparePartner] = useState(initialHubSetup.initialPartner);

  // Shared drill-in subView state
  const [subView, setSubView] = useState(null);
  const [subViewData, setSubViewData] = useState(null);
  const [loadingSubView, setLoadingSubView] = useState(false);
  const subViewCacheRef = useRef(new Map());
  const savedScrollPosRef = useRef(0);

  // Data states
  const [primaryDetails, setPrimaryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [profileTerms, setProfileTerms] = useState([]);
  const [alternativesList, setAlternativesList] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(true);

  const [compareList, setCompareList] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(true);

  const [useCaseList, setUseCaseList] = useState([]);
  const [useCasePhrase, setUseCasePhrase] = useState('');
  const [loadingUseCase, setLoadingUseCase] = useState(true);

  // Sync state whenever root query or entity changes
  useEffect(() => {
    setActiveTab(initialHubSetup.initialTab);
    setCurrentPrimary(initialHubSetup.primary);
    setComparePackages(
      initialHubSetup.explicitPackages || (initialHubSetup.primary ? [initialHubSetup.primary] : [])
    );
    setComparePartner(initialHubSetup.initialPartner);
    setSubView(null);
    setSubViewData(null);
    subViewCacheRef.current.clear();
  }, [initialHubSetup]);

  // AbortController ref to cancel stale requests when primary changes
  const abortControllerRef = useRef(null);

  // ==========================================
  // PIPELINE: STEPS A - F (DERIVATION)
  // ==========================================
  useEffect(() => {
    if (!initialHubSetup.isHub || !currentPrimary) {
      setLoadingDetails(false);
      setLoadingAlternatives(false);
      setLoadingCompare(false);
      setLoadingUseCase(false);
      props?.messageHandlers?.componentLoaded?.();
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setLoadingDetails(true);
    setLoadingAlternatives(true);
    setLoadingCompare(true);
    setLoadingUseCase(true);

    async function runDerivation() {
      try {
        // STEP A: Fetch primary details, weekly downloads, 30-day range
        const [infoRes, dlRes, trendRes] = await Promise.allSettled([
          fetchPackageInfo(currentPrimary, signal),
          fetchWeeklyDownloads(currentPrimary, signal),
          fetchMonthlyDownloadsRange(currentPrimary, signal)
        ]);

        if (signal.aborted) return;

        const pkgInfo = infoRes.status === 'fulfilled' ? infoRes.value : { name: currentPrimary };
        const weeklyDl = dlRes.status === 'fulfilled' ? dlRes.value : null;
        const trend = trendRes.status === 'fulfilled' ? trendRes.value : null;

        const sizeRes = await fetchBundleSize(currentPrimary, pkgInfo, signal);
        if (signal.aborted) return;

        setPrimaryDetails({
          packageData: pkgInfo,
          weeklyDownloads: weeklyDl,
          downloadTrend: trend,
          bundleSize: sizeRes || { size: null, gzip: null }
        });
        setLoadingDetails(false);
        props?.messageHandlers?.componentLoaded?.();

        // STEP B: Profile terms extraction (pure JS)
        const terms = extractProfileTerms(pkgInfo);
        setProfileTerms(terms);

        const derivedPhrase = terms.slice(0, 2).join(' ') || currentPrimary;
        const activePhrase = initialHubSetup.useCaseQuery || derivedPhrase;
        setUseCasePhrase(activePhrase);

        // STEP C & D: Fetch live candidates and rank alternatives
        const candidates = await fetchLiveCandidates(terms, pkgInfo, weeklyDl || 0, signal);
        if (signal.aborted) return;

        const rankedAlts = rankAlternatives(candidates, pkgInfo);

        // Lazily fetch bundle sizes for displayed alternatives
        const altsWithSizes = await Promise.all(
          rankedAlts.map(async (alt) => {
            const bSize = await fetchBundleSize(alt.name, alt, signal);
            return {
              ...alt,
              bundleSize: bSize || { size: null, gzip: null }
            };
          })
        );
        if (signal.aborted) return;

        setAlternativesList(altsWithSizes);
        setLoadingAlternatives(false);

        // STEP E: Compare partner setup
        const topAltName = altsWithSizes[0]?.name || null;
        const targetPartner = comparePartner || topAltName || (currentPrimary === 'react' ? 'vue' : 'express');

        const packagesToCompare = [currentPrimary];
        if (targetPartner && targetPartner !== currentPrimary) {
          packagesToCompare.push(targetPartner);
        }
        if (comparePackages.length >= 3) {
          const third = comparePackages[2];
          if (third && third !== currentPrimary && third !== targetPartner) {
            packagesToCompare.push(third);
          }
        }

        const compResults = await Promise.all(
          packagesToCompare.map(async (pkgName) => {
            if (pkgName === currentPrimary && primaryDetails) {
              return {
                info: pkgInfo,
                weeklyDownloads: weeklyDl,
                downloadTrend: trend,
                bundleSize: sizeRes || { size: null, gzip: null }
              };
            }
            const [cinfoRes, cdlRes, ctrendRes] = await Promise.allSettled([
              fetchPackageInfo(pkgName, signal),
              fetchWeeklyDownloads(pkgName, signal),
              fetchMonthlyDownloadsRange(pkgName, signal)
            ]);
            const cinfo = cinfoRes.status === 'fulfilled' ? cinfoRes.value : { name: pkgName };
            const cbundle = await fetchBundleSize(pkgName, cinfo, signal);
            return {
              info: cinfo,
              weeklyDownloads: cdlRes.status === 'fulfilled' ? cdlRes.value : null,
              downloadTrend: ctrendRes.status === 'fulfilled' ? ctrendRes.value : null,
              bundleSize: cbundle || { size: null, gzip: null }
            };
          })
        );
        if (signal.aborted) return;

        setCompareList(compResults);
        setLoadingCompare(false);

        // STEP F: Use case search with phrase
        if (activePhrase) {
          const searchItems = await fetchUseCaseSearch(activePhrase, 10, signal);
          if (signal.aborted) return;

          const rawPkgs = searchItems.map((item) => item.package || item);
          const dedupedPkgs = [];
          const seen = new Set();

          for (const p of rawPkgs) {
            const pName = (p.name || '').toLowerCase().trim();
            if (!pName || seen.has(pName) || pName.startsWith('@types/')) continue;
            seen.add(pName);
            dedupedPkgs.push(p);
          }

          // Make sure primary package is kept and marked
          let primaryIncluded = false;
          const mapped = dedupedPkgs.map((p) => {
            const isPrim = (p.name || '').toLowerCase() === currentPrimary.toLowerCase();
            if (isPrim) primaryIncluded = true;
            return {
              ...p,
              isPrimary: isPrim
            };
          });

          if (!primaryIncluded && pkgInfo && pkgInfo.name) {
            mapped.unshift({
              name: pkgInfo.name,
              version: pkgInfo.version,
              description: pkgInfo.description,
              keywords: pkgInfo.keywords,
              isPrimary: true
            });
          }

          // Fetch downloads & sizes for displayed use case items
          const useCaseWithMetrics = await Promise.all(
            mapped.slice(0, 5).map(async (item) => {
              const [udlRes, usizeRes] = await Promise.allSettled([
                fetchWeeklyDownloads(item.name, signal),
                fetchBundleSize(item.name, item, signal)
              ]);
              return {
                ...item,
                weeklyDownloads: udlRes.status === 'fulfilled' ? udlRes.value : null,
                bundleSize: usizeRes.status === 'fulfilled' ? usizeRes.value : { size: null, gzip: null }
              };
            })
          );
          if (signal.aborted) return;

          // Rank by downloads
          useCaseWithMetrics.sort((a, b) => (b.weeklyDownloads || 0) - (a.weeklyDownloads || 0));

          setUseCaseList(useCaseWithMetrics);
        } else {
          setUseCaseList([]);
        }
        setLoadingUseCase(false);
      } catch {
        if (!signal.aborted) {
          setLoadingDetails(false);
          setLoadingAlternatives(false);
          setLoadingCompare(false);
          setLoadingUseCase(false);
        }
      }
    }

    runDerivation();

    return () => {
      controller.abort();
    };
  }, [currentPrimary, comparePartner, comparePackages.length, initialHubSetup.isHub, initialHubSetup.useCaseQuery]);

  // Non-hub pure use case fetch
  useEffect(() => {
    if (initialHubSetup.isHub || initialHubSetup.initialTab !== 'use-case') return;

    let isCancelled = false;
    setLoadingUseCase(true);

    async function loadNonHubUseCase() {
      try {
        const phrase = initialHubSetup.useCaseQuery || 'date formatting';
        setUseCasePhrase(phrase);
        const searchItems = await fetchUseCaseSearch(phrase, 10);
        if (isCancelled) return;

        const rawPkgs = searchItems.map((item) => item.package || item);
        const mapped = await Promise.all(
          rawPkgs.slice(0, 5).map(async (item) => {
            const [udlRes, usizeRes] = await Promise.allSettled([
              fetchWeeklyDownloads(item.name),
              fetchBundleSize(item.name, item)
            ]);
            return {
              ...item,
              weeklyDownloads: udlRes.status === 'fulfilled' ? udlRes.value : null,
              bundleSize: usizeRes.status === 'fulfilled' ? usizeRes.value : { size: null, gzip: null }
            };
          })
        );
        if (isCancelled) return;
        mapped.sort((a, b) => (b.weeklyDownloads || 0) - (a.weeklyDownloads || 0));
        setUseCaseList(mapped);
      } catch {
        // Silently handle
      } finally {
        if (!isCancelled) {
          setLoadingUseCase(false);
          props?.messageHandlers?.componentLoaded?.();
        }
      }
    }

    loadNonHubUseCase();

    return () => {
      isCancelled = true;
    };
  }, [initialHubSetup]);

  // Shared drill-in & back handlers
  const handleOpenSubView = useCallback((pkgName) => {
    if (!pkgName) return;
    const clean = cleanPkgName(pkgName);
    if (!clean) return;

    if (typeof window !== 'undefined') {
      savedScrollPosRef.current = window.scrollY || window.pageYOffset || 0;
    }

    setSubView(clean);

    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ subView: clean }, '');
    }

    if (clean === currentPrimary && primaryDetails) {
      setSubViewData(primaryDetails);
      setLoadingSubView(false);
      return;
    }

    if (subViewCacheRef.current.has(clean)) {
      setSubViewData(subViewCacheRef.current.get(clean));
      setLoadingSubView(false);
      return;
    }

    setLoadingSubView(true);
    let isCancelled = false;

    (async () => {
      try {
        const [infoRes, dlRes, trendRes] = await Promise.allSettled([
          fetchPackageInfo(clean),
          fetchWeeklyDownloads(clean),
          fetchMonthlyDownloadsRange(clean)
        ]);

        const pkgInfo = infoRes.status === 'fulfilled' ? infoRes.value : { name: clean };
        const weeklyDl = dlRes.status === 'fulfilled' ? dlRes.value : null;
        const trend = trendRes.status === 'fulfilled' ? trendRes.value : null;
        const bSize = await fetchBundleSize(clean, pkgInfo);

        const loadedObj = {
          packageData: pkgInfo,
          weeklyDownloads: weeklyDl,
          downloadTrend: trend,
          bundleSize: bSize || { size: null, gzip: null }
        };

        subViewCacheRef.current.set(clean, loadedObj);
        if (!isCancelled) {
          setSubViewData(loadedObj);
          setLoadingSubView(false);
        }
      } catch {
        if (!isCancelled) {
          setLoadingSubView(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [currentPrimary, primaryDetails]);

  const handleBackToResults = useCallback((fromPopState = false) => {
    setSubView(null);
    setSubViewData(null);

    if (!fromPopState && typeof window !== 'undefined' && window.history?.state?.subView) {
      window.history.back();
    }

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedScrollPosRef.current || 0,
          behavior: 'instant'
        });
      });
    }
  }, []);

  const handleSwitchTabFromSubView = useCallback((tabId) => {
    if (subView) {
      setCurrentPrimary(subView);
      setSubView(null);
      setSubViewData(null);
      if (typeof window !== 'undefined' && window.history?.state?.subView) {
        window.history.back();
      }
    }
    setActiveTab(tabId);
  }, [subView]);

  // Escape key listener to close subView
  useEffect(() => {
    if (!subView) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBackToResults(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subView, handleBackToResults]);

  // Browser Back popstate listener
  useEffect(() => {
    const handlePopState = () => {
      if (subView) {
        handleBackToResults(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [subView, handleBackToResults]);

  const handleTabClick = (tabId) => {
    if (subView) {
      setSubView(null);
      setSubViewData(null);
      if (typeof window !== 'undefined' && window.history?.state?.subView) {
        window.history.back();
      }
    }
    setActiveTab(tabId);
  };

  const handlePartnerChange = (newPartner) => {
    setComparePartner(newPartner);
    setComparePackages((prev) => [prev[0], newPartner, ...(prev.slice(2) || [])]);
  };

  const handleAddThirdPackage = (newPkg) => {
    setComparePackages((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, newPkg];
    });
  };

  const handleRemoveComparePackage = (pkgName) => {
    setComparePackages((prev) => prev.filter((p) => p !== pkgName));
  };

  // Mode helpers & labels
  const MODES = [
    { id: 'details', label: 'Details', helper: 'Details: metadata, versions, and installation for a single package', loading: loadingDetails },
    { id: 'compare', label: 'Compare', helper: 'Compare: side-by-side facts for 2 to 3 packages', loading: loadingCompare },
    { id: 'alternatives', label: 'Alternatives', helper: 'Alternatives: ranked modern replacements with weekly downloads and bundle size', loading: loadingAlternatives },
    { id: 'use-case', label: 'Use case', helper: 'Use case: package recommendations matching search query', loading: loadingUseCase }
  ];

  const activeModeObj = MODES.find((m) => m.id === activeTab);
  const activeHelperText =
    activeModeObj?.helper ||
    (activeTab === 'empty'
      ? 'Sandbox: select a sample query to inspect package metrics'
      : 'Unmatched: search query did not match an npm package or pattern');

  // Content Renderer
  const renderTabContent = () => {
    if (subView) {
      return (
        <DetailsSubView
          pkgName={subView}
          data={subViewData}
          loading={loadingSubView}
          onBack={() => handleBackToResults(false)}
          onSwitchTab={handleSwitchTabFromSubView}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      );
    }

    if (activeTab === 'empty') {
      return (
        <EmptySandboxView
          tokens={tokens}
          onQuickSearch={(queryStr) => {
            const parsed = parseIntent(queryStr);
            if (parsed.view === 'details') {
              setCurrentPrimary(parsed.package);
              setActiveTab('details');
            } else if (parsed.view === 'compare') {
              setCurrentPrimary(parsed.packages[0]);
              setComparePackages(parsed.packages);
              setComparePartner(parsed.packages[1]);
              setActiveTab('compare');
            } else if (parsed.view === 'alternatives') {
              setCurrentPrimary(parsed.package);
              setActiveTab('alternatives');
            } else if (parsed.view === 'use-case') {
              setActiveTab('use-case');
            }
          }}
        />
      );
    }

    if (activeTab === 'unmatched') {
      return (
        <UnmatchedView
          query={rootQuery}
          tokens={tokens}
          onQuickSearch={(queryStr) => {
            const parsed = parseIntent(queryStr);
            if (parsed.view === 'details') {
              setCurrentPrimary(parsed.package);
              setActiveTab('details');
            } else if (parsed.view === 'compare') {
              setCurrentPrimary(parsed.packages[0]);
              setComparePackages(parsed.packages);
              setComparePartner(parsed.packages[1]);
              setActiveTab('compare');
            } else if (parsed.view === 'alternatives') {
              setCurrentPrimary(parsed.package);
              setActiveTab('alternatives');
            } else if (parsed.view === 'use-case') {
              setActiveTab('use-case');
            }
          }}
        />
      );
    }

    if (activeTab === 'details') {
      if (loadingDetails) {
        return <DetailsSkeleton accentColor={tokens.modeAccents.details} />;
      }
      if (primaryDetails) {
        return (
          <DetailsView
            packageData={primaryDetails.packageData}
            weeklyDownloads={primaryDetails.weeklyDownloads}
            bundleSize={primaryDetails.bundleSize}
            downloadTrend={primaryDetails.downloadTrend}
            onSwitchTab={handleTabClick}
            isSidebar={isSidebar}
            tokens={tokens}
          />
        );
      }
    }

    if (activeTab === 'compare') {
      if (loadingCompare) {
        return <TableSkeleton cols={comparePackages.length || 2} accentColor={tokens.modeAccents.compare} />;
      }
      return (
        <CompareView
          primaryPkg={currentPrimary}
          packagesData={compareList}
          availableAlternatives={alternativesList}
          topAlternativeName={alternativesList[0]?.name}
          onPartnerChange={handlePartnerChange}
          onAddPackage={handleAddThirdPackage}
          onRemovePackage={handleRemoveComparePackage}
          onInspect={handleOpenSubView}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      );
    }

    if (activeTab === 'alternatives') {
      if (loadingAlternatives) {
        return <ListSkeleton accentColor={tokens.modeAccents.alternatives} />;
      }
      return (
        <AlternativesView
          primaryPkg={currentPrimary}
          primaryKeywords={primaryDetails?.packageData?.keywords || []}
          alternativesList={alternativesList}
          onInspect={handleOpenSubView}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      );
    }

    if (activeTab === 'use-case') {
      if (loadingUseCase) {
        return <ListSkeleton accentColor={tokens.modeAccents['use-case']} />;
      }
      return (
        <UseCaseView
          useCaseQuery={useCasePhrase}
          recommendations={useCaseList}
          primaryPkg={currentPrimary}
          primaryKeywords={primaryDetails?.packageData?.keywords || []}
          onInspect={handleOpenSubView}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      );
    }

    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ComponentErrorBoundary>
        <Box sx={{ width: '100%', maxWidth: isSidebar ? 420 : 960, mx: 'auto' }}>
          {/* Mode Indicator Tabs Row */}
          {initialHubSetup.isHub && (
            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  p: 0.5,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: tokens.border,
                  bgcolor: tokens.background.paper,
                  width: 'fit-content',
                  maxWidth: '100%',
                  overflowX: 'auto'
                }}
              >
                {MODES.map((m) => {
                  const isActive = activeTab === m.id;
                  const accentColor = tokens.modeAccents[m.id];
                  return (
                    <Button
                      key={m.id}
                      size="small"
                      onClick={() => handleTabClick(m.id)}
                      sx={{
                        minHeight: 28,
                        px: 1.25,
                        py: 0.25,
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        color: isActive ? tokens.action.primaryText : tokens.text.secondary,
                        bgcolor: isActive ? accentColor : 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: isActive ? accentColor : tokens.background.subtle,
                          color: isActive ? tokens.action.primaryText : tokens.text.primary,
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {m.label} {m.loading ? '(Loading)' : ''}
                    </Button>
                  );
                })}
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.75,
                  color: tokens.text.secondary,
                  fontSize: '0.75rem',
                  lineHeight: 1.4
                }}
              >
                {activeHelperText}
              </Typography>
            </Box>
          )}

          {/* Active Tab Content */}
          {renderTabContent()}
        </Box>
      </ComponentErrorBoundary>
    </ThemeProvider>
  );
}