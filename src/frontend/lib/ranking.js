import { GENERIC_PROFILE_WORDS, DESCRIPTION_STOPWORDS } from '../constants/words.js';

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

/**
 * Pure helper to build options for the Compare-with dropdown.
 * Always includes the current partner first (even if not in alternativesList),
 * then appends alternatives (de-duplicated, excluding the primary package).
 */
export function buildPartnerOptions(currentPartner, alternativesList = [], primaryPkgOrExcluded = '') {
  const options = [];
  const seen = new Set();
  const excluded = new Set();

  if (Array.isArray(primaryPkgOrExcluded)) {
    primaryPkgOrExcluded.forEach((p) => {
      if (p) excluded.add(String(p).toLowerCase().trim());
    });
  } else if (primaryPkgOrExcluded) {
    excluded.add(String(primaryPkgOrExcluded).toLowerCase().trim());
  }

  if (currentPartner && typeof currentPartner === 'string' && currentPartner.trim()) {
    const cleanPartner = currentPartner.trim();
    options.push({
      name: cleanPartner,
      isCurrent: true
    });
    seen.add(cleanPartner.toLowerCase());
  }

  if (Array.isArray(alternativesList)) {
    for (const alt of alternativesList) {
      const name = typeof alt === 'string' ? alt.trim() : (alt?.name || '').trim();
      const lower = name.toLowerCase();
      if (!name || seen.has(lower) || excluded.has(lower)) {
        continue;
      }
      seen.add(lower);
      options.push({
        name,
        isCurrent: false,
        raw: typeof alt === 'object' ? alt : null
      });
    }
  }

  return options;
}

/**
 * Rank use-case candidates by a transparent blend:
 * - npm search score (candidate.score?.final, if present) normalised to 0-1
 * - log10 of weekly downloads normalised to 0-1
 * - average of the two: (normSearch + normLogDl) / 2
 * Drops @types and deprecated packages, returns top 5. Never claims any winner.
 */
export function rankUseCaseCandidates(rawCandidates = []) {
  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) return [];

  // Drop @types, deprecated, duplicates
  const filtered = [];
  const seen = new Set();
  for (const item of rawCandidates) {
    const pkg = item?.package || item;
    const name = (pkg?.name || '').toLowerCase().trim();
    if (!name || seen.has(name)) continue;
    if (name.startsWith('@types/')) continue;
    if (pkg.deprecated || item.deprecated) continue;
    seen.add(name);

    const rawSearchScore =
      typeof item?.score?.final === 'number'
        ? item.score.final
        : (typeof item?.searchScore === 'number' ? item.searchScore / 1000 : 0.5);

    filtered.push({
      ...pkg,
      rawSearchScore,
      weeklyDownloads: item.weeklyDownloads ?? pkg.weeklyDownloads ?? null
    });
  }

  if (filtered.length === 0) return [];

  const maxSearch = Math.max(...filtered.map((c) => c.rawSearchScore || 0), 0.0001);
  const maxLogDl = Math.max(
    ...filtered.map((c) => Math.log10(Math.max(c.weeklyDownloads || 0, 1))),
    1
  );

  const scored = filtered.map((c) => {
    const normSearch = Math.min(Math.max((c.rawSearchScore || 0) / maxSearch, 0), 1);
    const logDl = Math.log10(Math.max(c.weeklyDownloads || 0, 1));
    const normLogDl = Math.min(Math.max(logDl / maxLogDl, 0), 1);
    const blendScore = (normSearch + normLogDl) / 2;
    return {
      ...c,
      normSearch,
      normLogDl,
      blendScore
    };
  });

  scored.sort((a, b) => (b.blendScore || 0) - (a.blendScore || 0));
  return scored.slice(0, 5);
}

/**
 * Pure helper for tab bar visibility. Hidden only for 'empty' and 'unmatched'.
 */
export function isTabBarVisible(activeTab) {
  return activeTab !== 'empty' && activeTab !== 'unmatched';
}

/**
 * Pure helper for building ModeTabs config based on primary package existence.
 */
export function buildModeTabs(currentPrimary, loadingStates = {}) {
  const hasPrimary = Boolean(currentPrimary && String(currentPrimary).trim());
  return [
    {
      id: 'details',
      label: 'Details',
      helper: 'Details: metadata, versions, and installation for a single package',
      loading: hasPrimary ? Boolean(loadingStates.details) : false,
      disabled: !hasPrimary,
      tooltip: !hasPrimary ? 'Pick a package first' : undefined
    },
    {
      id: 'compare',
      label: 'Compare',
      helper: 'Compare: side-by-side facts for 2 to 3 packages',
      loading: hasPrimary ? Boolean(loadingStates.compare) : false,
      disabled: !hasPrimary,
      tooltip: !hasPrimary ? 'Pick a package first' : undefined
    },
    {
      id: 'alternatives',
      label: 'Alternatives',
      helper: 'Alternatives: ranked modern replacements with weekly downloads and bundle size',
      loading: hasPrimary ? Boolean(loadingStates.alternatives) : false,
      disabled: !hasPrimary,
      tooltip: !hasPrimary ? 'Pick a package first' : undefined
    },
    {
      id: 'use-case',
      label: 'Use case',
      helper: 'Use case: package recommendations matching search query',
      loading: Boolean(loadingStates.useCase),
      disabled: false
    }
  ];
}


