import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanPkgName } from '../lib/packageName.js';
import { extractProfileTerms, rankAlternatives, rankUseCaseCandidates } from '../lib/ranking.js';
import { specsToFetch } from '../lib/compareHelpers.js';
import {
  fetchPackageInfo,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchUseCaseSearch,
  fetchLiveCandidates
} from '../api/npm.js';
import { fetchBundleSize } from '../api/bundleSize.js';

const DEBUG_TIMING = false;

export function usePackageHub({
  currentPrimary,
  comparePartner,
  comparePackages,
  initialHubSetup,
  activeTab = 'details',
  componentLoaded
}) {
  const [primaryDetails, setPrimaryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [profileTerms, setProfileTerms] = useState([]);
  const [alternativesList, setAlternativesList] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [shouldLoadAlternatives, setShouldLoadAlternatives] = useState(false);

  // 1) PER-PACKAGE COMPARE CACHE: Map keyed by exact spec (e.g. 'react', 'express@5')
  // Entry: { status: 'loading' | 'ready' | 'error', data, error }
  const compareCacheRef = useRef(new Map());
  const [compareTick, setCompareTick] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const [useCaseList, setUseCaseList] = useState([]);
  const [useCasePhrase, setUseCasePhrase] = useState('');
  const [loadingUseCase, setLoadingUseCase] = useState(initialHubSetup?.initialTab === 'use-case');

  // References to prevent stale closures and avoid duplicate fetches
  const primaryDetailsRef = useRef(null);
  const alternativesCacheRef = useRef(new Map());
  const useCaseCacheRef = useRef(new Map());

  const detailsAbortRef = useRef(null);
  const altsAbortRef = useRef(null);
  const compareControllersRef = useRef(new Map());
  const comparePackagesRef = useRef(comparePackages);
  const useCaseAbortRef = useRef(null);

  useEffect(() => {
    comparePackagesRef.current = comparePackages;
  }, [comparePackages]);

  const comparePackagesKey = (comparePackages || []).join(',');

  // ==========================================
  // EFFECT 1: PRIMARY DETAILS & TERMS (+ PREFETCH ALTS)
  // Keyed ONLY on currentPrimary & isHub
  // ==========================================
  useEffect(() => {
    if (!initialHubSetup.isHub || !currentPrimary || !currentPrimary.trim()) {
      setLoadingDetails(false);
      setLoadingAlternatives(false);
      componentLoaded?.();
      return;
    }

    if (detailsAbortRef.current) {
      detailsAbortRef.current.abort();
    }
    const controller = new AbortController();
    detailsAbortRef.current = controller;
    const signal = controller.signal;

    setLoadingDetails(true);
    setShouldLoadAlternatives(false);

    if (DEBUG_TIMING) console.time('details-first-paint');

    async function loadPrimaryDetails() {
      try {
        const [infoRes, dlRes, trendRes] = await Promise.allSettled([
          fetchPackageInfo(currentPrimary, signal),
          fetchWeeklyDownloads(currentPrimary, signal),
          fetchMonthlyDownloadsRange(currentPrimary, signal)
        ]);

        if (signal.aborted) return;

        const pkgInfo = infoRes.status === 'fulfilled' ? infoRes.value : { name: currentPrimary };
        const weeklyDl = dlRes.status === 'fulfilled' ? dlRes.value : null;
        const trend = trendRes.status === 'fulfilled' ? trendRes.value : null;

        // Extract profile terms and active use case phrase
        const terms = extractProfileTerms(pkgInfo);
        setProfileTerms(terms);

        const derivedPhrase = terms.slice(0, 2).join(' ') || currentPrimary;
        const activePhrase = initialHubSetup.useCaseQuery || derivedPhrase;
        setUseCasePhrase(activePhrase);

        // 1) RENDER DETAILS FIRST: Call setPrimaryDetails with pending bundle size
        const initialDetails = {
          packageData: pkgInfo,
          weeklyDownloads: weeklyDl,
          downloadTrend: trend,
          bundleSize: { size: null, gzip: null, pending: true }
        };

        primaryDetailsRef.current = initialDetails;
        setPrimaryDetails(initialDetails);
        setLoadingDetails(false);

        // Seed compare cache entry for primary package if present in compare list
        if (!initialHubSetup.isVersionCompare && pkgInfo && pkgInfo.name) {
          const primLower = pkgInfo.name.toLowerCase();
          for (const spec of (comparePackagesRef.current || [])) {
            if (cleanPkgName(spec).toLowerCase() === primLower) {
              compareCacheRef.current.set(spec, {
                status: 'ready',
                error: null,
                data: {
                  requestedName: spec,
                  name: pkgInfo.name,
                  info: pkgInfo,
                  weeklyDownloads: weeklyDl,
                  downloadTrend: trend,
                  bundleSize: initialDetails.bundleSize,
                  pending: false
                }
              });
              setCompareTick((t) => t + 1);
            }
          }
        }



        if (activeTab === 'details') {
          componentLoaded?.();
        }
        if (DEBUG_TIMING) console.timeEnd('details-first-paint');

        // Fetch bundle size in the background and update primaryDetails
        fetchBundleSize(currentPrimary, pkgInfo, signal)
          .then((sizeRes) => {
            if (signal.aborted) return;
            const finalSize = sizeRes || { size: null, gzip: null };
            setPrimaryDetails((prev) => {
              if (!prev || prev.packageData.name !== pkgInfo.name) return prev;
              const updated = {
                ...prev,
                bundleSize: { ...finalSize, pending: false }
              };
              primaryDetailsRef.current = updated;
              return updated;
            });

            // Update bundle size in compare cache entry if present
            if (!initialHubSetup.isVersionCompare && pkgInfo?.name) {
              const primLower = pkgInfo.name.toLowerCase();
              for (const spec of (comparePackagesRef.current || [])) {
                if (cleanPkgName(spec).toLowerCase() === primLower) {
                  const entry = compareCacheRef.current.get(spec);
                  if (entry && entry.data) {
                    entry.data.bundleSize = { ...finalSize, pending: false };
                    setCompareTick((t) => t + 1);
                  }
                }
              }
            }
          })
          .catch(() => {
            if (signal.aborted) return;
            setPrimaryDetails((prev) => {
              if (!prev || prev.packageData.name !== pkgInfo.name) return prev;
              const updated = {
                ...prev,
                bundleSize: { size: null, gzip: null, pending: false }
              };
              primaryDetailsRef.current = updated;
              return updated;
            });

            if (!initialHubSetup.isVersionCompare && pkgInfo?.name) {
              const primLower = pkgInfo.name.toLowerCase();
              for (const spec of (comparePackagesRef.current || [])) {
                if (cleanPkgName(spec).toLowerCase() === primLower) {
                  const entry = compareCacheRef.current.get(spec);
                  if (entry && entry.data) {
                    entry.data.bundleSize = { size: null, gzip: null, pending: false };
                    setCompareTick((t) => t + 1);
                  }
                }
              }
            }
          });

        // 2) SILENT PREFETCH OF ALTERNATIVES: Trigger after 300ms
        const prefetchTimer = setTimeout(() => {
          if (!signal.aborted) {
            setShouldLoadAlternatives(true);
          }
        }, 300);

        signal.addEventListener('abort', () => clearTimeout(prefetchTimer), { once: true });
      } catch {
        if (!signal.aborted) {
          setLoadingDetails(false);
          setLoadingAlternatives(false);
          componentLoaded?.();
        }
      }
    }

    loadPrimaryDetails();

    return () => {
      controller.abort();
    };
  }, [currentPrimary, initialHubSetup.isHub, initialHubSetup.useCaseQuery]);

  // ==========================================
  // EFFECT 2: ALTERNATIVES (LAZY PER TAB / FAST RANKING)
  // Keyed on currentPrimary and demand
  // ==========================================
  const needsAlternatives =
    activeTab === 'alternatives' ||
    (activeTab === 'compare' && !comparePartner && (!comparePackages || comparePackages.length < 2)) ||
    shouldLoadAlternatives;

  useEffect(() => {
    if (!initialHubSetup.isHub || !currentPrimary || !needsAlternatives) {
      return;
    }

    // Check memory cache for instant tab return
    const cached = alternativesCacheRef.current.get(currentPrimary);
    if (cached) {
      setAlternativesList(cached);
      setLoadingAlternatives(false);
      return;
    }

    if (altsAbortRef.current) {
      altsAbortRef.current.abort();
    }
    const controller = new AbortController();
    altsAbortRef.current = controller;
    const signal = controller.signal;

    setLoadingAlternatives(true);
    if (DEBUG_TIMING) console.time('alternatives-ready');

    async function loadAlternatives() {
      try {
        let pkgInfo = primaryDetailsRef.current?.packageData;
        let weeklyDl = primaryDetailsRef.current?.weeklyDownloads;

        if (!pkgInfo) {
          const [infoRes, dlRes] = await Promise.allSettled([
            fetchPackageInfo(currentPrimary, signal),
            fetchWeeklyDownloads(currentPrimary, signal)
          ]);
          if (signal.aborted) return;
          pkgInfo = infoRes.status === 'fulfilled' ? infoRes.value : { name: currentPrimary };
          weeklyDl = dlRes.status === 'fulfilled' ? dlRes.value : null;
        }

        const terms = profileTerms.length > 0 ? profileTerms : extractProfileTerms(pkgInfo);

        // Fetch live candidates with pool sliced to 8 and concurrency capped at 4
        const candidates = await fetchLiveCandidates(terms, pkgInfo, weeklyDl || 0, signal);
        if (signal.aborted) return;

        const rankedAlts = rankAlternatives(candidates, pkgInfo);

        // 4b) Show ranked list immediately with row-level pending bundle sizes
        const initialList = rankedAlts.map((alt) => ({
          ...alt,
          bundleSize: { size: null, gzip: null, pending: true }
        }));

        setAlternativesList(initialList);
        setLoadingAlternatives(false);
        alternativesCacheRef.current.set(currentPrimary, initialList);

        if (activeTab === 'alternatives') {
          componentLoaded?.();
        }
        if (DEBUG_TIMING) console.timeEnd('alternatives-ready');

        // Fetch each row's bundle size in the background without blocking the list
        rankedAlts.forEach(async (alt) => {
          if (signal.aborted) return;
          const bSize = await fetchBundleSize(alt.name, alt, signal);
          if (signal.aborted) return;

          setAlternativesList((prev) => {
            const updated = prev.map((item) =>
              item.name === alt.name
                ? {
                    ...item,
                    bundleSize: {
                      ...(bSize || { size: null, gzip: null }),
                      pending: false
                    }
                  }
                : item
            );
            alternativesCacheRef.current.set(currentPrimary, updated);
            return updated;
          });
        });
      } catch {
        if (!signal.aborted) {
          setLoadingAlternatives(false);
        }
      }
    }

    loadAlternatives();

    return () => {
      controller.abort();
    };
  }, [currentPrimary, needsAlternatives, initialHubSetup.isHub, profileTerms]);

  // ==========================================
  // EFFECT 3: COMPARE - FETCH ONLY WHAT IS MISSING
  // Keyed on [comparePackagesKey, retryCount]
  // ==========================================
  useEffect(() => {
    if (!initialHubSetup.isHub || !comparePackages || comparePackages.length === 0) {
      return;
    }

    // Cancel in-flight requests for removed specs
    for (const [spec, controller] of compareControllersRef.current.entries()) {
      if (!comparePackages.includes(spec)) {
        controller.abort();
        compareControllersRef.current.delete(spec);
      }
    }

    // Check which specs already have 'ready' or 'loading' status
    const readyOrLoadingKeys = new Set();
    for (const [key, entry] of compareCacheRef.current.entries()) {
      if (entry.status === 'ready' || entry.status === 'loading') {
        readyOrLoadingKeys.add(key);
      }
    }

    const missingSpecs = specsToFetch(comparePackages, readyOrLoadingKeys);
    if (missingSpecs.length === 0) {
      return;
    }

    let sharedDl = primaryDetailsRef.current?.weeklyDownloads;
    let sharedTrend = primaryDetailsRef.current?.downloadTrend;

    missingSpecs.forEach((spec) => {
      // Check if this spec is the primary package and can be seeded from primaryDetailsRef immediately
      const isPrim = !initialHubSetup.isVersionCompare && Boolean(
        primaryDetailsRef.current?.packageData?.name &&
        (primaryDetailsRef.current.packageData.name.toLowerCase() === spec.toLowerCase() ||
         primaryDetailsRef.current.packageData.name.toLowerCase() === cleanPkgName(spec).toLowerCase())
      );

      if (isPrim) {
        compareCacheRef.current.set(spec, {
          status: 'ready',
          error: null,
          data: {
            requestedName: spec,
            name: primaryDetailsRef.current.packageData.name,
            info: primaryDetailsRef.current.packageData,
            weeklyDownloads: primaryDetailsRef.current.weeklyDownloads,
            downloadTrend: primaryDetailsRef.current.downloadTrend,
            bundleSize: primaryDetailsRef.current.bundleSize || { size: null, gzip: null, pending: true },
            pending: false
          }
        });
        setCompareTick((t) => t + 1);
        return;
      }

      // Mark this specific missing spec as loading
      compareCacheRef.current.set(spec, {
        status: 'loading',
        error: null,
        data: {
          requestedName: spec,
          name: spec,
          info: null,
          weeklyDownloads: initialHubSetup.isVersionCompare ? sharedDl : null,
          downloadTrend: initialHubSetup.isVersionCompare ? sharedTrend : null,
          bundleSize: { size: null, gzip: null, pending: true },
          pending: true
        }
      });
      setCompareTick((t) => t + 1);

      if (compareControllersRef.current.has(spec)) {
        compareControllersRef.current.get(spec).abort();
      }
      const controller = new AbortController();
      compareControllersRef.current.set(spec, controller);
      const signal = controller.signal;

      (async () => {
        try {
          let cdl = initialHubSetup.isVersionCompare ? sharedDl : null;
          let ctrend = initialHubSetup.isVersionCompare ? sharedTrend : null;

          if (initialHubSetup.isVersionCompare && (cdl == null || ctrend == null)) {
            const basePkg = currentPrimary?.split('@')[0] || currentPrimary;
            const [sdlRes, strendRes] = await Promise.allSettled([
              fetchWeeklyDownloads(basePkg, signal),
              fetchMonthlyDownloadsRange(basePkg, signal)
            ]);
            if (!signal.aborted) {
              cdl = sdlRes.status === 'fulfilled' ? sdlRes.value : null;
              ctrend = strendRes.status === 'fulfilled' ? strendRes.value : null;
            }
          }

          const fetchTasks = [fetchPackageInfo(spec, signal)];
          if (!initialHubSetup.isVersionCompare) {
            fetchTasks.push(fetchWeeklyDownloads(spec, signal));
            fetchTasks.push(fetchMonthlyDownloadsRange(spec, signal));
          }

          const results = await Promise.allSettled(fetchTasks);
          if (signal.aborted) return;
          if (!comparePackagesRef.current.includes(spec)) return;

          const infoRes = results[0];
          const cinfo = infoRes?.status === 'fulfilled' ? infoRes.value : null;

          if (!cinfo || cinfo.error || cinfo.found === false) {
            const isNotFound = cinfo?.error === 'Package not found' || cinfo?.found === false;
            const cleanName = cleanPkgName(spec) || spec;
            const errorMessage = isNotFound
              ? `No package named ${cleanName} on npm`
              : (cinfo?.error || `Couldn't load ${cleanName}`);

            compareCacheRef.current.set(spec, {
              status: 'error',
              error: errorMessage,
              data: {
                requestedName: spec,
                name: spec,
                info: cinfo || { name: spec, found: false },
                weeklyDownloads: null,
                downloadTrend: null,
                bundleSize: { size: null, gzip: null, pending: false },
                pending: false
              }
            });
            setCompareTick((t) => t + 1);
            return;
          }

          if (!initialHubSetup.isVersionCompare) {
            cdl = results[1]?.status === 'fulfilled' ? results[1].value : null;
            ctrend = results[2]?.status === 'fulfilled' ? results[2].value : null;
          }

          compareCacheRef.current.set(spec, {
            status: 'ready',
            error: null,
            data: {
              requestedName: spec,
              name: spec,
              info: cinfo,
              weeklyDownloads: cdl,
              downloadTrend: ctrend,
              bundleSize: { size: null, gzip: null, pending: true },
              pending: false
            }
          });
          setCompareTick((t) => t + 1);

          if (activeTab === 'compare') {
            componentLoaded?.();
          }

          // Background bundle size fetch
          fetchBundleSize(spec, cinfo, signal, Boolean(initialHubSetup.isVersionCompare))
            .then((cbundle) => {
              if (signal.aborted) return;
              if (!comparePackagesRef.current.includes(spec)) return;
              const entry = compareCacheRef.current.get(spec);
              if (entry && entry.status === 'ready' && entry.data) {
                entry.data.bundleSize = {
                  ...(cbundle || { size: null, gzip: null }),
                  pending: false
                };
                setCompareTick((t) => t + 1);
              }
            })
            .catch(() => {
              if (signal.aborted) return;
              if (!comparePackagesRef.current.includes(spec)) return;
              const entry = compareCacheRef.current.get(spec);
              if (entry && entry.status === 'ready' && entry.data) {
                entry.data.bundleSize = { size: null, gzip: null, pending: false };
                setCompareTick((t) => t + 1);
              }
            });
        } catch {
          if (signal.aborted) return;
          if (!comparePackagesRef.current.includes(spec)) return;
          const cleanName = cleanPkgName(spec) || spec;
          compareCacheRef.current.set(spec, {
            status: 'error',
            error: `Couldn't load ${cleanName}`,
            data: {
              requestedName: spec,
              name: spec,
              info: { name: spec, found: false },
              weeklyDownloads: null,
              downloadTrend: null,
              bundleSize: { size: null, gzip: null, pending: false },
              pending: false
            }
          });
          setCompareTick((t) => t + 1);
        }
      })();
    });
  }, [comparePackagesKey, retryCount, initialHubSetup.isHub, initialHubSetup.isVersionCompare, currentPrimary]);

  // Cleanup all compare controllers on unmount
  useEffect(() => {
    return () => {
      for (const controller of compareControllersRef.current.values()) {
        controller.abort();
      }
      compareControllersRef.current.clear();
    };
  }, []);

  // ==========================================
  // ==========================================
  // EFFECT 4: USE-CASE (RANKED BY RELEVANCE & WEEKLY DOWNLOADS)
  // Transparent blend: npm search score (0-1) and log10 downloads (0-1), average of the two
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'use-case') {
      setLoadingUseCase(false);
      return;
    }

    const phrase = (
      useCasePhrase ||
      initialHubSetup?.useCaseQuery ||
      (profileTerms.length > 0 ? profileTerms.slice(0, 2).join(' ') : (currentPrimary || ''))
    ).trim();

    if (!phrase) {
      setUseCaseList([]);
      setLoadingUseCase(false);
      componentLoaded?.();
      return;
    }

    // Check cache
    const cached = useCaseCacheRef.current.get(phrase);
    if (cached) {
      setUseCasePhrase(phrase);
      setUseCaseList(cached);
      setLoadingUseCase(false);
      componentLoaded?.();
      return;
    }

    if (useCaseAbortRef.current) {
      useCaseAbortRef.current.abort();
    }
    const controller = new AbortController();
    useCaseAbortRef.current = controller;
    const signal = controller.signal;

    setLoadingUseCase(true);

    async function loadUseCase() {
      try {
        setUseCasePhrase(phrase);
        // Fetch 10 candidates from npm search API
        const searchItems = await fetchUseCaseSearch(phrase, 10, signal);
        if (signal.aborted) return;

        // Drop @types, deprecated, and duplicate packages
        const candidates = [];
        const seen = new Set();
        for (const item of searchItems) {
          const pkg = item?.package || item;
          const name = (pkg?.name || '').toLowerCase().trim();
          if (!name || seen.has(name)) continue;
          if (name.startsWith('@types/')) continue;
          if (pkg.deprecated || item.deprecated) continue;
          seen.add(name);

          // Extract npm search score (candidate.score?.final if present)
          const rawSearchScore =
            typeof item?.score?.final === 'number'
              ? item.score.final
              : (typeof item?.searchScore === 'number' ? item.searchScore / 1000 : 0.5);

          candidates.push({
            ...pkg,
            rawSearchScore,
            isPrimary: currentPrimary ? name === currentPrimary.toLowerCase() : false
          });
        }

        if (candidates.length === 0) {
          if (!signal.aborted) {
            setUseCaseList([]);
            useCaseCacheRef.current.set(phrase, []);
          }
          return;
        }

        // Fetch weekly downloads with concurrency 4
        const dlResults = [];
        const CONCURRENCY = 4;
        for (let i = 0; i < candidates.length; i += CONCURRENCY) {
          if (signal.aborted) return;
          const batch = candidates.slice(i, i + CONCURRENCY);
          const batchRes = await Promise.allSettled(
            batch.map((c) => fetchWeeklyDownloads(c.name, signal))
          );
          dlResults.push(...batchRes);
        }

        if (signal.aborted) return;

        // Attach weekly downloads
        const withDownloads = candidates.map((c, i) => {
          const res = dlResults[i];
          const dl = res && res.status === 'fulfilled' ? res.value : null;
          return {
            ...c,
            weeklyDownloads: dl
          };
        });

        // Compute transparent blend ranking: top 5 candidates
        const top5 = rankUseCaseCandidates(withDownloads);

        // Fetch bundle sizes for the top 5 candidates
        const top5WithBundle = await Promise.all(
          top5.map(async (item) => {
            try {
              const bRes = await fetchBundleSize(item.name, item, signal);
              return {
                ...item,
                bundleSize: bRes || { size: null, gzip: null }
              };
            } catch {
              return {
                ...item,
                bundleSize: { size: null, gzip: null }
              };
            }
          })
        );

        if (signal.aborted) return;

        setUseCaseList(top5WithBundle);
        useCaseCacheRef.current.set(phrase, top5WithBundle);
      } catch {
        // Handled silently
      } finally {
        if (!signal.aborted) {
          setLoadingUseCase(false);
          componentLoaded?.();
        }
      }
    }

    loadUseCase();

    return () => {
      controller.abort();
    };
  }, [activeTab, useCasePhrase, initialHubSetup?.useCaseQuery, profileTerms, currentPrimary, componentLoaded]);

  // 1) DERIVED DURING RENDER: comparePackages.map(spec => cache.get(spec))
  const compareList = (comparePackages || []).map((spec) => {
    const entry = compareCacheRef.current.get(spec);
    if (entry) {
      return {
        requestedName: spec,
        name: spec,
        status: entry.status,
        error: entry.error,
        ...(entry.data || {}),
        pending: entry.status === 'loading'
      };
    }
    return {
      requestedName: spec,
      name: spec,
      status: 'loading',
      error: null,
      info: null,
      weeklyDownloads: null,
      downloadTrend: null,
      bundleSize: { size: null, gzip: null, pending: true },
      pending: true
    };
  });

  const hasReadyColumn = compareList.some((col) => col.status === 'ready' && !col.pending);
  const loadingCompare = (comparePackages || []).length > 0 && !hasReadyColumn;

  const retryComparePackage = useCallback((spec) => {
    if (!spec) return;
    compareCacheRef.current.delete(spec);
    setRetryCount((c) => c + 1);
  }, []);

  return {
    primaryDetails,
    loadingDetails,
    profileTerms,
    alternativesList,
    loadingAlternatives,
    compareList,
    loadingCompare,
    retryComparePackage,
    useCaseList,
    useCasePhrase,
    loadingUseCase
  };
}
