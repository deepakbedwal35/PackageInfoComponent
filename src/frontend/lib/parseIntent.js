import { cleanPkgName } from './packageName.js';

/**
 * Deterministic intent parsing engine (regex based).
 *
 * Ordered rule priority:
 * 1. Alternatives
 * 2. Compare (including version-compare)
 * 3. Latest-version
 * 4. Use-case
 * 5. Details
 * 6. Fallback (empty / unmatched)
 *
 * @param {string|null} query
 * @param {string[]} [entityNames=[]] Authoritative package entities from platform
 */
export function parseIntent(query, entityNames = []) {
  if (!query || typeof query !== 'string') {
    return { view: 'empty', rawQuery: '' };
  }

  // Normalise: trim, collapse whitespace, strip trailing ? . !
  const clean = query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?.!]+$/, '')
    .trim();

  if (!clean) {
    return { view: 'empty', rawQuery: '' };
  }

  const safeEntities = Array.isArray(entityNames)
    ? entityNames.filter((e) => typeof e === 'string' && e.trim()).map(cleanPkgName)
    : [];

  // =========================================================================
  // 1. ALTERNATIVES INTENTS
  // =========================================================================
  // - "npm alternatives to moment", "alternatives for axios"
  // - "moment alternatives", "alternatives to axios"
  // - "packages like axios", "npm packages similar to moment"
  // - "replacements for axios", "what can i use instead of axios"
  const altPatterns = [
    /^(?:(?:npm|top|best)\s+)?(?:alternatives?|replacements?|competitors?)\s+(?:to|for)\s+([@a-z0-9_.-]+(?:\s+npm)?)/i,
    /^([@a-z0-9_.-]+)\s+(?:alternatives?|replacements?)(?:\s+npm)?$/i,
    /^(?:(?:npm\s+)?(?:packages?|libraries?|libs?)\s+)?(?:like|similar\s+to)\s+([@a-z0-9_.-]+)/i,
    /^(?:npm\s+)?packages?\s+similar\s+to\s+([@a-z0-9_.-]+)/i,
    /^(?:what\s+(?:can\s+i|to)\s+use\s+instead\s+of)\s+([@a-z0-9_.-]+)/i
  ];

  for (const pat of altPatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      let pkg = m[1].replace(/\s+npm$/i, '').trim();
      if (safeEntities.length > 0) {
        pkg = safeEntities[0];
      }
      return { view: 'alternatives', package: pkg, rawQuery: clean };
    }
  }

  // =========================================================================
  // 2. COMPARE INTENTS (including Version-Compare)
  // =========================================================================

  // Helper to normalize version spec token: strip leading 'v' only if followed by a digit
  const cleanVersionSpec = (v) => {
    const s = String(v || '').trim();
    return /^v\d/i.test(s) ? s.slice(1) : s;
  };

  // 2A. Version compare: runs BEFORE standard compare
  let versionCompareResult = null;

  // Single entity override check (e.g. entities=[{sourceID:'express'}], query='4 vs 5' or 'express 4 vs 5')
  if (safeEntities.length === 1 && /\b(?:vs\.?|versus|and)\b/i.test(clean)) {
    const singleBase = safeEntities[0];
    const verMatches = clean.match(/\b(v?\d+(?:\.[0-9a-z*x_-]+)*)\b/gi);
    if (verMatches && verMatches.length >= 2) {
      const uniqueVers = [];
      const seenVer = new Set();
      for (const vm of verMatches) {
        const cv = cleanVersionSpec(vm);
        if (!seenVer.has(cv)) {
          seenVer.add(cv);
          uniqueVers.push(cv);
          if (uniqueVers.length >= 3) break;
        }
      }
      if (uniqueVers.length >= 2) {
        versionCompareResult = {
          view: 'compare',
          isVersionCompare: true,
          basePackage: singleBase,
          packages: uniqueVers.map((v) => `${singleBase}@${v}`),
          rawQuery: clean
        };
      }
    }
  }

  // Regex-based version-compare pattern
  // Matches: "express 4 vs 5", "react 17 vs 18", "@babel/core 7 vs 8", "express v4 vs v5", "express 4.x vs 5.x", "express 3 vs 4 vs 5"
  if (!versionCompareResult) {
    const vPat = /^(?:compare\s+(?:packages?\s+|npm\s+)?)?(@?[a-z0-9_.-]+(?:\/[a-z0-9_.-]+)?)(?:@|\s+)(v?\d+(?:\.[0-9a-z*x_-]+)*)\s+(?:vs\.?|versus|and)\s+(?:\1(?:@|\s+))?(v?\d+(?:\.[0-9a-z*x_-]+)*)(?:\s+(?:vs\.?|versus|and)\s+(?:\1(?:@|\s+))?(v?\d+(?:\.[0-9a-z*x_-]+)*))?$/i;
    const vm = clean.match(vPat);
    if (vm) {
      const base = vm[1].trim();
      const vers = [cleanVersionSpec(vm[2]), cleanVersionSpec(vm[3])];
      if (vm[4]) vers.push(cleanVersionSpec(vm[4]));
      versionCompareResult = {
        view: 'compare',
        isVersionCompare: true,
        basePackage: base,
        packages: vers.map((v) => `${base}@${v}`),
        rawQuery: clean
      };
    }
  }

  if (versionCompareResult) {
    return versionCompareResult;
  }

  // 2B. Standard Compare:
  // - Starts with "compare" (optionally "npm", "packages")
  // - "A vs B [vs C]", "A versus B"
  // - "A with B after compare"
  if (/^compare\b/i.test(clean) && safeEntities.length >= 2) {
    return {
      view: 'compare',
      packages: safeEntities.slice(0, 3),
      rawQuery: clean
    };
  }

  let compareListStr = null;

  const comparePrefixMatch = clean.match(/^compare\s+(?:npm\s+)?(?:packages?\s+)?(.+)$/i);
  const afterCompareMatch = clean.match(/^(.+)\s+after\s+compare$/i);
  const vsMatch = clean.match(/[@a-z0-9_.-]+(?:\s+vs\.?|\s+versus)\s+[@a-z0-9_.-]+/i);

  if (comparePrefixMatch) {
    compareListStr = comparePrefixMatch[1].trim();
  } else if (afterCompareMatch) {
    compareListStr = afterCompareMatch[1].trim();
  } else if (vsMatch) {
    compareListStr = clean;
  }

  if (compareListStr) {
    // Split on commas, "vs.", "vs", "versus", "and", "with", "&"
    let parts = compareListStr
      .split(/(?:,|\bvs\.?\b|\bversus\b|\band\b|\bwith\b|&)/i)
      .map((p) => p.replace(/^(?:npm|packages?)\s+/i, '').replace(/\s+(?:npm|packages?)$/i, '').trim())
      .filter(Boolean);

    // If only one part resulted, fallback to whitespace split (e.g. "compare npm packages react vue")
    if (parts.length === 1) {
      parts = parts[0].split(/\s+/).filter(Boolean);
    }

    if (parts.length >= 2) {
      let finalPackages = parts.slice(0, 3).map((p) => p.replace(/\s+/g, '@'));
      if (safeEntities.length >= 2) {
        finalPackages = safeEntities.slice(0, 3);
      }
      return {
        view: 'compare',
        packages: finalPackages,
        rawQuery: clean
      };
    }
  }

  // =========================================================================
  // 3. LATEST / CURRENT VERSION INTENT
  // =========================================================================
  // - "latest version of react", "current version of react", "what is the latest version of react"
  const latestVerMatch = clean.match(
    /^(?:(?:what\s+is|what's)\s+)?(?:the\s+)?(?:latest|current)\s+version\s+of\s+([@a-z0-9_.-]+)$/i
  );

  if (latestVerMatch && latestVerMatch[1]) {
    let pkg = latestVerMatch[1].trim();
    if (safeEntities.length > 0) {
      pkg = safeEntities[0];
    }
    return {
      view: 'details',
      package: pkg,
      focus: 'version',
      rawQuery: clean
    };
  }

  // =========================================================================
  // 4. USE-CASE INTENTS
  // =========================================================================
  // - "best npm package for date formatting", "library for parsing csv"
  // - Never treat a query that starts with "latest/current version of" as use-case
  const useCasePatterns = [
    /^(?:best|top|recommended)?\s*(?:npm\s+)?(?:packages?|library|libraries|libs?|modules?)\s+(?:for|to)\s+(.+)$/i,
    /^(?:what\s+is\s+the\s+best\s+npm\s+package\s+for)\s+(.+)$/i,
    /^(?:packages?|library|libraries|libs?|modules?)\s+(?:for|to)\s+(.+)$/i
  ];

  for (const ucPat of useCasePatterns) {
    const ucm = clean.match(ucPat);
    if (ucm && ucm[1]) {
      const rawCase = ucm[1].trim().replace(/\s+npm$/i, '');
      return { view: 'use-case', useCase: rawCase, rawQuery: clean };
    }
  }

  // =========================================================================
  // 5. DETAILS INTENT (single package)
  // =========================================================================
  // - "npm express", "package info lodash", "npm request", "npm zzzz-not-a-package"
  let pkgCandidate = clean
    .replace(/^npm\s+package\s+/i, '')
    .replace(/^package\s+info\s+/i, '')
    .replace(/^package\s+details\s+/i, '')
    .replace(/^npm\s+info\s+/i, '')
    .replace(/^npm\s+view\s+/i, '')
    .replace(/^npm\s+show\s+/i, '')
    .replace(/^npm\s+/i, '')
    .replace(/\s+npm$/i, '')
    .replace(/\s+package$/i, '')
    .trim();

  // If entity is provided and single word query or npm prefix, prioritize entity
  if (safeEntities.length > 0 && (clean.startsWith('npm ') || !clean.includes(' '))) {
    return { view: 'details', package: safeEntities[0], rawQuery: clean };
  }

  // Valid npm package name or scoped name, with optional @version
  if (/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(?:@[0-9a-zA-Z.-]+)?$/i.test(pkgCandidate)) {
    return { view: 'details', package: pkgCandidate, rawQuery: clean };
  }

  // =========================================================================
  // 6. MULTI-WORD GENERAL USE-CASE FALLBACK
  // =========================================================================
  // If multiple words and not invalid symbols, treat as general use-case
  if (clean.split(/\s+/).length >= 2 && !clean.includes('/') && /^[a-zA-Z0-9\s-]+$/.test(clean)) {
    return { view: 'use-case', useCase: clean.replace(/^npm\s+/i, ''), rawQuery: clean };
  }

  // =========================================================================
  // 7. UNMATCHED FALLBACK
  // =========================================================================
  return { view: 'unmatched', rawQuery: clean };
}

/**
 * Extract an ordered, de-duplicated array (max 3) of package names from platform searchData.
 * Package names are derived from entities[].sourceID (with fallback to word, package, name).
 *
 * @param {object|array|null} searchData
 * @returns {string[]}
 */
export function extractEntityPackages(searchData) {
  if (!searchData) return [];

  const rawEntitiesList = [];

  const extractFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.entities) {
      if (Array.isArray(obj.entities)) {
        rawEntitiesList.push(...obj.entities);
      } else {
        rawEntitiesList.push(obj.entities);
      }
    } else if (obj.sourceID || obj.word) {
      rawEntitiesList.push(obj);
    }
  };

  if (Array.isArray(searchData)) {
    for (const item of searchData) {
      extractFromObject(item);
    }
  } else if (typeof searchData === 'object') {
    extractFromObject(searchData);
  }

  const results = [];
  const seen = new Set();

  for (const ent of rawEntitiesList) {
    let candidate = null;
    if (typeof ent === 'string') {
      candidate = ent;
    } else if (ent && typeof ent === 'object') {
      candidate =
        ent.sourceID ||
        ent.word ||
        ent.package ||
        ent.name ||
        ent.primary ||
        ent.target ||
        ent.value ||
        ent.id ||
        null;
    }
    if (candidate && typeof candidate === 'string') {
      const cleaned = cleanPkgName(candidate);
      if (cleaned && !seen.has(cleaned.toLowerCase())) {
        seen.add(cleaned.toLowerCase());
        results.push(cleaned);
        if (results.length >= 3) break;
      }
    }
  }

  return results;
}

/**
 * Backward-compatible single package entity extractor.
 */
export function extractEntityPackage(searchData) {
  const pkgs = extractEntityPackages(searchData);
  return pkgs.length > 0 ? pkgs[0] : null;
}

/**
 * Compute stable query key from normalized query string + entities.
 * Identical for array vs object searchData with same query and entities.
 */
export function computeQueryKey(searchData, searchQuery = '') {
  let rawQuery = '';
  if (typeof searchData === 'string') {
    rawQuery = searchData;
  } else if (Array.isArray(searchData) && searchData.length > 0) {
    rawQuery = searchData[0]?.query || searchData[0]?.component || searchQuery || '';
  } else if (searchData && typeof searchData === 'object') {
    rawQuery = searchData.query || searchQuery || '';
  } else {
    rawQuery = searchQuery || '';
  }

  const normQuery = String(rawQuery).toLowerCase().trim().replace(/\s+/g, ' ');
  const entityNames = extractEntityPackages(searchData);
  const entitiesKey = entityNames.map((e) => e.toLowerCase()).join('|');

  return `${normQuery}::${entitiesKey}`;
}

