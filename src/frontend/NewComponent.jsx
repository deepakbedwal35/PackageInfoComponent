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
  IconButton,
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
  Divider,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Link as MuiLink,
  Snackbar
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
import StorageIcon from '@mui/icons-material/Storage';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GitHubIcon from '@mui/icons-material/GitHub';
import CodeIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// ==========================================
// 1. IN-MEMORY CACHE & FETCH HELPERS
// ==========================================
const apiCache = new Map();

/**
 * Concurrently fetch JSON with in-memory caching and timeout.
 * Reuses identical inflight promises and caches resolved data.
 */
async function cachedFetch(url, timeoutMs = 8000) {
  if (apiCache.has(url)) {
    return apiCache.get(url);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  })();

  apiCache.set(url, promise);
  // Retain promise in cache; if failed, don't crash callers
  return promise.catch((err) => {
    // Evict on network error so subsequent tries can retry
    apiCache.delete(url);
    throw err;
  });
}

// Fallback mirror if registry.npmjs.org is blocked or offline
async function fetchWithFallback(primaryUrl, fallbackUrl) {
  try {
    return await cachedFetch(primaryUrl, 4500);
  } catch (errPrimary) {
    if (fallbackUrl) {
      try {
        return await cachedFetch(fallbackUrl, 5000);
      } catch (errFallback) {
        throw errFallback;
      }
    }
    throw errPrimary;
  }
}

// ==========================================
// 2. FORMATTING & MATH UTILITIES
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
    'superagent'
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
// 3. INTENT PARSING ENGINE (DETERMINISTIC REGEX)
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
      p1 = `${baseName}@${ver1}`;
      if (/^\d+(?:\.\d+)*$/.test(p2)) {
        p2 = `${baseName}@${p2}`;
      } else if (p2.startsWith(`${baseName} `)) {
        p2 = `${baseName}@${p2.split(' ')[1]}`;
      }
    }

    const packages = [p1, p2, p3].filter(Boolean).map((p) => p.replace(/\s+/g, '@'));
    return { view: 'compare', packages, rawQuery: clean };
  }

  // 3. Use-case: e.g. "best npm package for date formatting", "npm package for state management"
  const useCaseMatch =
    clean.match(/^(?:(?:the\s+)?(?:best|top|recommended|popular|good)\s+)?(?:npm\s+)?(?:package|packages|lib|libs|library|libraries|tools?|modules?)\s+(?:for|to|handling)\s+(.+)$/i) ||
    clean.match(/^(?:find|search|suggest|recommend)\s+(?:an?\s+)?(?:npm\s+)?(?:package|library)\s+for\s+(.+)$/i);

  if (useCaseMatch && useCaseMatch[1] && !clean.match(/\b(?:vs|versus|compare)\b/i)) {
    const topic = useCaseMatch[1].replace(/^(?:handling|doing|processing)\s+/i, '').trim();
    return { view: 'use-case', useCase: topic, rawQuery: clean };
  }

  // 4. Details (fallback):
  // e.g. "npm express", "package info lodash", "react@18.2.0", "request", "@mui/material"
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

// ==========================================
// 4. DATA FETCHERS WITH PROMISE.ALLSETTLED
// ==========================================

/**
 * Fetch package metadata (handles specific versions and latest).
 */
async function fetchPackageInfo(pkgQuery) {
  let [name, requestedVersion] = pkgQuery.startsWith('@')
    ? [
        `@${pkgQuery.slice(1).split('@')[0]}`,
        pkgQuery.slice(1).split('@')[1] || null
      ]
    : pkgQuery.split('@');

  name = name.toLowerCase().trim();

  try {
    let pkgData = null;
    let fullPkgData = null;

    if (requestedVersion) {
      // First fetch the full packument to resolve version ranges like "4" -> latest 4.x
      const fullUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
      const fullFallback = `https://registry.npmmirror.com/${encodeURIComponent(name)}`;
      fullPkgData = await fetchWithFallback(fullUrl, fullFallback);

      if (fullPkgData && fullPkgData.versions) {
        if (fullPkgData.versions[requestedVersion]) {
          pkgData = fullPkgData.versions[requestedVersion];
        } else {
          // Find latest matching semver prefix e.g. "4" -> "4.21.2"
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
      const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
      const fallbackUrl = `https://registry.npmmirror.com/${encodeURIComponent(name)}/latest`;
      pkgData = await fetchWithFallback(url, fallbackUrl);
    }

    // Check deprecation from packument if available
    let deprecationMessage = pkgData?.deprecated || null;
    if (!deprecationMessage && fullPkgData?.versions?.[pkgData?.version]?.deprecated) {
      deprecationMessage = fullPkgData.versions[pkgData.version].deprecated;
    }

    return {
      name: pkgData.name,
      version: pkgData.version,
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
      error: err.message
    };
  }
}

/**
 * Fetch weekly download counts.
 */
async function fetchWeeklyDownloads(pkgName) {
  const clean = pkgName.split('@')[0].trim();
  const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(clean)}`;
  try {
    const data = await cachedFetch(url, 4000);
    return data?.downloads ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch 30-day download range for sparkline.
 */
async function fetchMonthlyDownloadsRange(pkgName) {
  const clean = pkgName.split('@')[0].trim();
  const url = `https://api.npmjs.org/downloads/range/last-month/${encodeURIComponent(clean)}`;
  try {
    const data = await cachedFetch(url, 4000);
    if (data?.downloads && Array.isArray(data.downloads)) {
      return data.downloads.map((item) => item.downloads);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch bundle size from Bundlephobia.
 */
async function fetchBundleSize(pkgQuery) {
  const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkgQuery)}`;
  try {
    const data = await cachedFetch(url, 4500);
    return {
      size: data?.size ?? null,
      gzip: data?.gzip ?? null,
      dependencyCount: data?.dependencyCount ?? null
    };
  } catch {
    return { size: null, gzip: null, dependencyCount: null };
  }
}

/**
 * Fetch use-case search results.
 */
async function fetchUseCaseSearch(text, size = 5) {
  const primaryUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`;
  const fallbackUrl = `https://registry.npmmirror.com/-/v1/search?text=${encodeURIComponent(text)}&size=${size}`;
  try {
    const data = await fetchWithFallback(primaryUrl, fallbackUrl);
    return data?.objects || [];
  } catch {
    return [];
  }
}

// Curated modern alternative maps for high-frequency queries
const CURATED_ALTERNATIVES = {
  moment: ['date-fns', 'dayjs', 'luxon', 'js-joda'],
  lodash: ['radash', 'ramda', 'remeda', 'es-toolkit'],
  axios: ['ky', 'got', 'ofetch', 'wretch'],
  request: ['axios', 'got', 'node-fetch', 'undici'],
  chalk: ['colorette', 'picocolors', 'kleur', 'nanocolors'],
  express: ['fastify', 'koa', 'hono', 'polka'],
  redux: ['zustand', 'jotai', 'mobx', 'recoil'],
  webpack: ['vite', 'esbuild', 'rollup', 'rspack'],
  uuid: ['nanoid', 'cuid2', 'ulid']
};

// ==========================================
// 5. SVG DOWNLOAD SPARKLINES COMPONENT
// ==========================================
function DownloadSparkline({ data, width = 110, height = 28, strokeColor = '#3b82f6', isDark = false }) {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        No trend data
      </Typography>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${(width - padding).toFixed(1)},${(height - padding).toFixed(1)} L ${padding.toFixed(1)},${(height - padding).toFixed(1)} Z`;
  const gradId = `sparkGrad-${Math.random().toString(36).substr(2, 6)}`;

  // Calculate 30-day percentage trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const pctChange = Math.round(((avgSecond - avgFirst) / (avgFirst || 1)) * 100);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? 0.45 : 0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Tooltip title={`30-day trend (${pctChange >= 0 ? '+' : ''}${pctChange}%)`}>
        <Chip
          label={`${pctChange >= 0 ? '+' : ''}${pctChange}%`}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: pctChange >= 0 ? 'success.dark' : 'error.dark',
            color: '#fff'
          }}
        />
      </Tooltip>
    </Stack>
  );
}

// ==========================================
// 6. PROGRESSIVE SKELETON LOADERS (~1-15ms)
// ==========================================
function DetailsSkeleton() {
  return (
    <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Skeleton variant="text" width={180} height={38} />
        <Skeleton variant="rounded" width={80} height={28} />
      </Stack>
      <Skeleton variant="text" width="90%" height={24} sx={{ mb: 2 }} />
      <Grid container spacing={2} mb={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Skeleton variant="rounded" height={60} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={42} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Card>
  );
}

function TableSkeleton({ cols = 2 }) {
  return (
    <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width={240} height={32} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={2} mb={2}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={`${100 / cols}%`} height={80} />
        ))}
      </Stack>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
      ))}
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width={220} height={32} sx={{ mb: 2 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={70} sx={{ mb: 1.5 }} />
      ))}
    </Card>
  );
}

// ==========================================
// 7. VIEW COMPONENTS
// ==========================================

// --- VIEW 1: DETAILS (FALLBACK) ---
function DetailsView({
  packageData,
  weeklyDownloads,
  bundleSize,
  downloadTrend,
  onNavigate,
  isSidebar,
  isDark
}) {
  const [copied, setCopied] = useState(false);
  const tsInfo = detectTypeScript(packageData.raw);
  const esmInfo = detectEsm(packageData.raw);

  const handleCopyInstall = () => {
    navigator.clipboard?.writeText(`npm i ${packageData.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {/* Deprecation Banner */}
      {packageData.deprecated && (
        <Alert
          severity="error"
          variant="filled"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{
            borderRadius: 0,
            alignItems: 'center',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>Package Deprecated</AlertTitle>
          <Typography variant="body2" sx={{ wordBreak: 'break-word', color: 'inherit' }}>
            {packageData.deprecated}
          </Typography>
        </Alert>
      )}

      <CardContent sx={{ p: isSidebar ? 2 : 3 }}>
        {/* Header row */}
        <Stack
          direction={isSidebar ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isSidebar ? 'flex-start' : 'center'}
          spacing={1}
          mb={1.5}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                {packageData.name}
              </Typography>
              <Chip
                label={`v${packageData.version}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={packageData.license}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>
          </Box>

          {/* TS & ESM Badges */}
          <Stack direction="row" spacing={0.8} flexWrap="wrap">
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
              label={tsInfo.label}
              size="small"
              color={tsInfo.supported ? 'info' : 'default'}
              variant={tsInfo.supported ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
            <Chip
              label={esmInfo.label}
              size="small"
              color={esmInfo.isEsm ? 'success' : 'default'}
              variant={esmInfo.isEsm ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Stack>
        </Stack>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
          {packageData.description}
        </Typography>

        {/* Key Metrics Grid */}
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'background.default' : '#f8fafc' }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Weekly Downloads
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatNumber(weeklyDownloads)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'background.default' : '#f8fafc' }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Bundle Size (Min / Gzip)
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.8 }}>
                {formatBytes(bundleSize?.size)} / {formatBytes(bundleSize?.gzip)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'background.default' : '#f8fafc' }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Dependencies
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                {packageData.dependenciesCount}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={isSidebar ? 6 : 3}>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', bgcolor: isDark ? 'background.default' : '#f8fafc' }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Released
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.8 }}>
                {formatDate(packageData.releaseDate)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* 30-Day Download Sparkline */}
        {downloadTrend && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: isDark ? 'background.default' : '#f8fafc'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUpIcon color="primary" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                30-Day Download Trend
              </Typography>
            </Stack>
            <DownloadSparkline data={downloadTrend} isDark={isDark} />
          </Paper>
        )}

        {/* Install Command snippet */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.2,
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDark ? '#0f172a' : '#f1f5f9',
            fontFamily: 'monospace'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
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
          <Tooltip title={copied ? 'Copied!' : 'Copy install command'}>
            <IconButton size="small" onClick={handleCopyInstall} color={copied ? 'success' : 'default'}>
              {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Action Buttons (Local state navigation) */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="contained"
            size="small"
            startIcon={<AltRouteIcon />}
            onClick={() => onNavigate('alternatives', { package: packageData.name })}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            See Alternatives
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrowsIcon />}
            onClick={() => {
              const defaultPeer =
                CURATED_ALTERNATIVES[packageData.name]?.[0] ||
                (packageData.name === 'react' ? 'vue' : packageData.name === 'vue' ? 'react' : 'express');
              onNavigate('compare', { packages: [packageData.name, defaultPeer] });
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Compare
          </Button>

          {/* External links */}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {packageData.repository && (
              <Tooltip title="View GitHub Repository">
                <IconButton
                  size="small"
                  component="a"
                  href={packageData.repository.replace(/^git\+/, '').replace(/\.git$/, '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="View on npm">
              <IconButton
                size="small"
                component="a"
                href={`https://www.npmjs.com/package/${packageData.name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// --- VIEW 2: COMPARE (2-3 PACKAGES, VERSION-AWARE) ---
function CompareView({ packagesData, onNavigate, isSidebar, isDark }) {
  // Factual takeaway lines generation: STRICTLY FACTS, NO INVENTED WINNER
  const takeaways = useMemo(() => {
    if (!packagesData || packagesData.length < 2) return [];
    const lines = [];

    const validDownloads = packagesData.filter((p) => p.weeklyDownloads !== null);
    if (validDownloads.length >= 2) {
      const sortedByDl = [...validDownloads].sort((a, b) => b.weeklyDownloads - a.weeklyDownloads);
      const top = sortedByDl[0];
      const second = sortedByDl[1];
      const ratio = second.weeklyDownloads > 0 ? (top.weeklyDownloads / second.weeklyDownloads).toFixed(1) : null;
      if (ratio && Number(ratio) > 1.1) {
        lines.push(
          `• ${top.info.name} recorded ${formatNumber(top.weeklyDownloads)} weekly downloads vs ${formatNumber(
            second.weeklyDownloads
          )} for ${second.info.name} (~${ratio}x volume).`
        );
      } else {
        lines.push(
          `• ${top.info.name} and ${second.info.name} have comparable weekly download volumes (${formatNumber(
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
        `• Minified bundle size: ${smallest.info.name} is ${formatBytes(smallest.bundleSize.size)} compared to ${
          largest.info.name
        } at ${formatBytes(largest.bundleSize.size)} (${diff} difference).`
      );
    }

    const allHaveTs = packagesData.every((p) => detectTypeScript(p.info.raw).supported);
    const tsNames = packagesData.map((p) => `${p.info.name} (${detectTypeScript(p.info.raw).label})`);
    if (allHaveTs) {
      lines.push(`• TypeScript support: All compared packages provide TypeScript declarations.`);
    } else {
      lines.push(`• TypeScript support: ${tsNames.join(', ')}.`);
    }

    const esmNames = packagesData.map((p) => `${p.info.name} is ${detectEsm(p.info.raw).label}`);
    lines.push(`• Module format: ${esmNames.join('; ')}.`);

    return lines;
  }, [packagesData]);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <CompareArrowsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Package Comparison
            </Typography>
          </Stack>
        }
        subheader="Side-by-side technical and operational metrics"
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: isSidebar ? 1.5 : 2.5, pt: 0 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
          <Table size="small" aria-label="comparison table">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, width: isSidebar ? '30%' : '20%' }}>Metric</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center" sx={{ fontWeight: 700 }}>
                    <Stack alignItems="center" spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {pkg.info.name}
                      </Typography>
                      <Chip label={`v${pkg.info.version}`} size="small" variant="outlined" sx={{ height: 20 }} />
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Weekly Downloads */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Weekly Downloads</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatNumber(pkg.weeklyDownloads)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Download Sparklines */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>30-Day Trend</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <DownloadSparkline data={pkg.downloadTrend} width={90} height={24} isDark={isDark} />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>

              {/* Bundle Size */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Bundle Size (Min / Gzip)</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Typography variant="body2">
                      {formatBytes(pkg.bundleSize?.size)} / {formatBytes(pkg.bundleSize?.gzip)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* TypeScript Support */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>TypeScript</TableCell>
                {packagesData.map((pkg, idx) => {
                  const ts = detectTypeScript(pkg.info.raw);
                  return (
                    <TableCell key={idx} align="center">
                      <Chip
                        label={ts.label}
                        size="small"
                        color={ts.supported ? 'info' : 'default'}
                        variant={ts.supported ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Module Type */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Module Support</TableCell>
                {packagesData.map((pkg, idx) => {
                  const esm = detectEsm(pkg.info.raw);
                  return (
                    <TableCell key={idx} align="center">
                      <Chip
                        label={esm.label}
                        size="small"
                        color={esm.isEsm ? 'success' : 'default'}
                        variant={esm.isEsm ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* License */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>License</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Typography variant="body2">{pkg.info.license}</Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Dependencies count */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Dependencies</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Typography variant="body2">{pkg.info.dependenciesCount}</Typography>
                  </TableCell>
                ))}
              </TableRow>

              {/* Actions row */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                {packagesData.map((pkg, idx) => (
                  <TableCell key={idx} align="center">
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => onNavigate('details', { package: pkg.info.name })}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Factual Takeaway Lines (STRICTLY FACTS, NO INVENTED WINNER) */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: isDark ? 'background.default' : '#f8fafc',
            borderLeft: '4px solid',
            borderColor: 'primary.main'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <InfoOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Factual Takeaways
            </Typography>
          </Stack>
          <Stack spacing={0.8}>
            {takeaways.map((line, i) => (
              <Typography key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {line}
              </Typography>
            ))}
          </Stack>
        </Paper>
      </CardContent>
    </Card>
  );
}

// --- VIEW 3: ALTERNATIVES ---
function AlternativesView({ targetPackage, alternativesList, onNavigate, isSidebar, isDark }) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <AltRouteIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Alternatives to {targetPackage}
            </Typography>
          </Stack>
        }
        subheader="Ranked modern replacements with weekly download volume and bundle size"
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: isSidebar ? 1.5 : 2.5, pt: 0 }}>
        <List disablePadding>
          {alternativesList.map((alt, index) => {
            const ts = detectTypeScript(alt.info.raw);
            const esm = detectEsm(alt.info.raw);

            return (
              <Paper
                key={alt.info.name}
                variant="outlined"
                sx={{
                  mb: 1.5,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: isDark ? 'background.default' : '#f8fafc',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                <Stack
                  direction={isSidebar ? 'column' : 'row'}
                  justifyContent="space-between"
                  alignItems={isSidebar ? 'flex-start' : 'center'}
                  spacing={1}
                  mb={1}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, height: 22, minWidth: 28 }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {alt.info.name}
                    </Typography>
                    <Chip label={`v${alt.info.version}`} size="small" variant="outlined" sx={{ height: 20 }} />
                    <Chip
                      label={ts.label}
                      size="small"
                      color={ts.supported ? 'info' : 'default'}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Weekly downloads">
                      <Chip
                        icon={<DownloadIcon sx={{ fontSize: '13px !important' }} />}
                        label={formatNumber(alt.weeklyDownloads)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Tooltip>
                    <Tooltip title="Minified bundle size">
                      <Chip
                        icon={<SpeedIcon sx={{ fontSize: '13px !important' }} />}
                        label={formatBytes(alt.bundleSize?.size)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Tooltip>
                  </Stack>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                  {alt.info.description}
                </Typography>

                {/* Shared Keywords Chips */}
                {alt.info.keywords && alt.info.keywords.length > 0 && (
                  <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mb: 1.5 }}>
                    {alt.info.keywords.slice(0, isSidebar ? 4 : 7).map((kw) => (
                      <Chip
                        key={kw}
                        label={kw}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                    ))}
                  </Stack>
                )}

                {/* Action buttons */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CompareArrowsIcon />}
                    onClick={() => onNavigate('compare', { packages: [targetPackage, alt.info.name] })}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Compare with {targetPackage}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onNavigate('details', { package: alt.info.name })}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    View Details
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

// --- VIEW 4: USE-CASE ---
function UseCaseView({ useCaseQuery, recommendations, onNavigate, isSidebar, isDark }) {
  const topPick = recommendations[0];

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recommended Packages for "{useCaseQuery}"
            </Typography>
          </Stack>
        }
        subheader="Algorithmic scoring based on downloads, quality, maintenance, and relevance"
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: isSidebar ? 1.5 : 2.5, pt: 0 }}>
        {/* Top Recommendation Highlight Card */}
        {topPick && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: isDark ? 'background.default' : '#f0fdf4',
              borderColor: 'success.main',
              position: 'relative'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label="Top Pick"
                  color="success"
                  size="small"
                  icon={<VerifiedIcon />}
                  sx={{ fontWeight: 700 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {topPick.package.name}
                </Typography>
                <Chip label={`v${topPick.package.version}`} size="small" variant="outlined" />
              </Stack>

              <Button
                variant="contained"
                size="small"
                onClick={() => onNavigate('details', { package: topPick.package.name })}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Inspect
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {topPick.package.description}
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Quality: {Math.round((topPick.score?.detail?.quality || 0) * 100)}%
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Popularity: {Math.round((topPick.score?.detail?.popularity || 0) * 100)}%
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Maintenance: {Math.round((topPick.score?.detail?.maintenance || 0) * 100)}%
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Other candidate packages */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Other Strong Candidates
        </Typography>

        <List disablePadding>
          {recommendations.slice(1).map((item, idx) => (
            <Paper
              key={item.package.name}
              variant="outlined"
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: isDark ? 'background.default' : '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Box sx={{ maxWidth: isSidebar ? '100%' : '70%' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Chip label={`#${idx + 2}`} size="small" sx={{ height: 20, fontWeight: 700 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {item.package.name}
                  </Typography>
                  <Chip label={`v${item.package.version}`} size="small" variant="outlined" sx={{ height: 18 }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" noWrap={!isSidebar}>
                  {item.package.description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                {topPick && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CompareArrowsIcon />}
                    onClick={() => onNavigate('compare', { packages: [topPick.package.name, item.package.name] })}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Compare
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onNavigate('details', { package: item.package.name })}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Details
                </Button>
              </Stack>
            </Paper>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

// --- UNMATCHED STATE ---
function UnmatchedView({ query, onQuickSearch }) {
  const suggestions = [
    'npm express',
    'compare react and vue',
    'express 4 vs 5',
    'npm alternatives to moment',
    'best npm package for date formatting'
  ];

  return (
    <Card elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
      <SearchOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        No npm package query recognized
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 480, mx: 'auto' }}>
        We couldn't recognize an npm package name or pattern for "<strong>{query}</strong>". Try searching for a specific
        package, comparison, alternatives, or use-case.
      </Typography>

      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
        TRY ONE OF THESE QUERIES:
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {suggestions.map((s) => (
          <Chip
            key={s}
            label={s}
            clickable
            color="primary"
            variant="outlined"
            onClick={() => onQuickSearch(s)}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>
    </Card>
  );
}

// --- EMPTY / SANDBOX NOTICE ---
function EmptySandboxView({ onQuickSearch }) {
  const sampleQueries = [
    { label: 'Package Details (express)', q: 'npm express' },
    { label: 'Compare (react vs vue)', q: 'compare react and vue' },
    { label: 'Version Compare (express 4 vs 5)', q: 'express 4 vs 5' },
    { label: 'Alternatives (moment)', q: 'npm alternatives to moment' },
    { label: 'Use-case (date formatting)', q: 'best npm package for date formatting' },
    { label: 'Deprecated Package (request)', q: 'npm request' }
  ];

  return (
    <Card
      elevation={2}
      sx={{
        p: 3,
        textAlign: 'center',
        borderRadius: 2,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <CodeIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        hyperDart npm Package Explorer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
        No search data provided yet (Sandbox Mode). Click any preset below to preview views, latency, and live metrics.
      </Typography>

      <Grid container spacing={1.5} sx={{ maxWidth: 600, mx: 'auto' }}>
        {sampleQueries.map((item) => (
          <Grid item xs={12} sm={6} key={item.q}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => onQuickSearch(item.q)}
              sx={{ textTransform: 'none', justifyContent: 'flex-start', py: 1, px: 1.5 }}
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
// 8. MAIN ROOT COMPONENT
// ==========================================
export default function NewComponent(props) {
  // Extract UIOptions safely
  const themeName = props?.UIOptions?.themeName || 'light';
  const format = props?.UIOptions?.format || props?.format || 'mainline';
  const isSidebar = format === 'sidebar';
  const isDark = themeName === 'dark' || themeName === 'lightsOut';

  // Build MUI theme
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: '#cb3837' // npm red / vibrant brand
        },
        secondary: {
          main: '#3b82f6'
        },
        background: {
          default: isDark ? (themeName === 'lightsOut' ? '#000000' : '#0f172a') : '#f8fafc',
          paper: isDark ? (themeName === 'lightsOut' ? '#111111' : '#1e293b') : '#ffffff'
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
        ].join(',')
      },
      shape: {
        borderRadius: 8
      }
    });
  }, [isDark, themeName]);

  // Extract query from searchData safely (can be object, array, or null)
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

  // LOCAL state for navigation without triggering root search
  const [currentView, setCurrentView] = useState(rootIntent.view);
  const [viewParams, setViewParams] = useState(rootIntent);
  const [history, setHistory] = useState([]);

  // When rootQuery changes externally, sync state
  useEffect(() => {
    setCurrentView(rootIntent.view);
    setViewParams(rootIntent);
    setHistory([]);
  }, [rootIntent]);

  // Async data states
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const [error, setError] = useState(null);

  // Local navigation handler
  const handleNavigate = useCallback((newView, params) => {
    setHistory((prev) => [...prev, { view: currentView, params: viewParams }]);
    setCurrentView(newView);
    setViewParams(params);
  }, [currentView, viewParams]);

  const handleGoBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((old) => old.slice(0, -1));
      setCurrentView(prev.view);
      setViewParams(prev.params);
    } else {
      setCurrentView(rootIntent.view);
      setViewParams(rootIntent);
    }
  }, [history, rootIntent]);

  // Main data loader effect for active view
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadData() {
      try {
        if (currentView === 'empty' || currentView === 'unmatched') {
          setLoading(false);
          props?.messageHandlers?.componentLoaded?.();
          return;
        }

        // VIEW 1: DETAILS
        if (currentView === 'details') {
          const pkgName = viewParams.package;
          const [infoRes, dlRes, trendRes, sizeRes] = await Promise.allSettled([
            fetchPackageInfo(pkgName),
            fetchWeeklyDownloads(pkgName),
            fetchMonthlyDownloadsRange(pkgName),
            fetchBundleSize(pkgName)
          ]);

          if (isCancelled) return;
          setViewData({
            packageData: infoRes.status === 'fulfilled' ? infoRes.value : { name: pkgName },
            weeklyDownloads: dlRes.status === 'fulfilled' ? dlRes.value : null,
            downloadTrend: trendRes.status === 'fulfilled' ? trendRes.value : null,
            bundleSize: sizeRes.status === 'fulfilled' ? sizeRes.value : { size: null, gzip: null }
          });
        }

        // VIEW 2: COMPARE
        else if (currentView === 'compare') {
          const packages = viewParams.packages || [];
          const results = await Promise.all(
            packages.map(async (pkg) => {
              const [infoRes, dlRes, trendRes, sizeRes] = await Promise.allSettled([
                fetchPackageInfo(pkg),
                fetchWeeklyDownloads(pkg),
                fetchMonthlyDownloadsRange(pkg),
                fetchBundleSize(pkg)
              ]);
              return {
                info: infoRes.status === 'fulfilled' ? infoRes.value : { name: pkg },
                weeklyDownloads: dlRes.status === 'fulfilled' ? dlRes.value : null,
                downloadTrend: trendRes.status === 'fulfilled' ? trendRes.value : null,
                bundleSize: sizeRes.status === 'fulfilled' ? sizeRes.value : { size: null, gzip: null }
              };
            })
          );

          if (isCancelled) return;
          setViewData({ packagesData: results });
        }

        // VIEW 3: ALTERNATIVES
        else if (currentView === 'alternatives') {
          const targetPkg = viewParams.package;
          const curated = CURATED_ALTERNATIVES[targetPkg];
          let candidateNames = curated ? [...curated] : [];

          if (candidateNames.length < 3) {
            // Fetch related packages from npm search API
            const searchResults = await fetchUseCaseSearch(targetPkg, 6);
            for (const item of searchResults) {
              const n = item.package.name;
              if (n !== targetPkg && !candidateNames.includes(n)) {
                candidateNames.push(n);
              }
            }
          }

          // Concurrently fetch details, downloads, and sizes
          const altResults = await Promise.all(
            candidateNames.slice(0, 5).map(async (name) => {
              const [infoRes, dlRes, sizeRes] = await Promise.allSettled([
                fetchPackageInfo(name),
                fetchWeeklyDownloads(name),
                fetchBundleSize(name)
              ]);
              return {
                info: infoRes.status === 'fulfilled' ? infoRes.value : { name, description: '' },
                weeklyDownloads: dlRes.status === 'fulfilled' ? dlRes.value : null,
                bundleSize: sizeRes.status === 'fulfilled' ? sizeRes.value : { size: null, gzip: null }
              };
            })
          );

          // Sort by downloads
          altResults.sort((a, b) => (b.weeklyDownloads || 0) - (a.weeklyDownloads || 0));

          if (isCancelled) return;
          setViewData({
            targetPackage: targetPkg,
            alternativesList: altResults
          });
        }

        // VIEW 4: USE-CASE
        else if (currentView === 'use-case') {
          const useCase = viewParams.useCase;
          const searchItems = await fetchUseCaseSearch(useCase, 5);

          if (isCancelled) return;
          setViewData({
            useCaseQuery: useCase,
            recommendations: searchItems
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          // Signal to platform that component is rendered
          props?.messageHandlers?.componentLoaded?.();
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [currentView, viewParams, props?.messageHandlers]);

  // Render view router
  const renderContent = () => {
    // Sandbox Case 1: searchData is undefined or null
    if (currentView === 'empty') {
      return (
        <EmptySandboxView
          onQuickSearch={(queryStr) => {
            const parsed = parseIntent(queryStr);
            setCurrentView(parsed.view);
            setViewParams(parsed);
          }}
        />
      );
    }

    // Sandbox Case 2: query matches nothing
    if (currentView === 'unmatched') {
      return (
        <UnmatchedView
          query={viewParams?.rawQuery || rootQuery}
          onQuickSearch={(queryStr) => {
            const parsed = parseIntent(queryStr);
            setCurrentView(parsed.view);
            setViewParams(parsed);
          }}
        />
      );
    }

    // Progressive rendering Skeletons while loading
    if (loading) {
      if (currentView === 'details') return <DetailsSkeleton />;
      if (currentView === 'compare') return <TableSkeleton cols={viewParams.packages?.length || 2} />;
      if (currentView === 'alternatives') return <ListSkeleton />;
      if (currentView === 'use-case') return <TableSkeleton cols={1} />;
      return <DetailsSkeleton />;
    }

    // Render Loaded Views
    if (currentView === 'details' && viewData?.packageData) {
      return (
        <DetailsView
          packageData={viewData.packageData}
          weeklyDownloads={viewData.weeklyDownloads}
          bundleSize={viewData.bundleSize}
          downloadTrend={viewData.downloadTrend}
          onNavigate={handleNavigate}
          isSidebar={isSidebar}
          isDark={isDark}
        />
      );
    }

    if (currentView === 'compare' && viewData?.packagesData) {
      return (
        <CompareView
          packagesData={viewData.packagesData}
          onNavigate={handleNavigate}
          isSidebar={isSidebar}
          isDark={isDark}
        />
      );
    }

    if (currentView === 'alternatives' && viewData?.alternativesList) {
      return (
        <AlternativesView
          targetPackage={viewData.targetPackage}
          alternativesList={viewData.alternativesList}
          onNavigate={handleNavigate}
          isSidebar={isSidebar}
          isDark={isDark}
        />
      );
    }

    if (currentView === 'use-case' && viewData?.recommendations) {
      return (
        <UseCaseView
          useCaseQuery={viewData.useCaseQuery}
          recommendations={viewData.recommendations}
          onNavigate={handleNavigate}
          isSidebar={isSidebar}
          isDark={isDark}
        />
      );
    }

    return <UnmatchedView query={rootQuery} onQuickSearch={(q) => handleNavigate(parseIntent(q).view, parseIntent(q))} />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', maxWidth: isSidebar ? 420 : 960, mx: 'auto', p: isSidebar ? 1 : 2 }}>
        {/* Navigation Breadcrumb / Back button when user navigated locally */}
        {history.length > 0 && (
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ mb: 1.5, textTransform: 'none', fontWeight: 600 }}
          >
            Back
          </Button>
        )}

        {renderContent()}
      </Box>
    </ThemeProvider>
  );
}
