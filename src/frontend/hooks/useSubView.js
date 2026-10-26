import { useState, useRef, useEffect, useCallback } from 'react';
import { cleanPkgName } from '../lib/packageName.js';
import {
  fetchPackageInfo,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange
} from '../api/npm.js';
import { fetchBundleSize } from '../api/bundleSize.js';

export function useSubView({
  currentPrimary,
  primaryDetails,
  setCurrentPrimary,
  setActiveTab
}) {
  const [subView, setSubView] = useState(null);
  const [subViewData, setSubViewData] = useState(null);
  const [loadingSubView, setLoadingSubView] = useState(false);
  const subViewCacheRef = useRef(new Map());
  const savedScrollPosRef = useRef(0);

  const resetSubView = useCallback(() => {
    setSubView(null);
    setSubViewData(null);
    subViewCacheRef.current.clear();
  }, []);

  const closeSubView = useCallback(() => {
    setSubView(null);
    setSubViewData(null);
    if (typeof window !== 'undefined' && window.history?.state?.subView) {
      window.history.back();
    }
  }, []);

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
  }, [subView, setCurrentPrimary, setActiveTab]);

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

  return {
    subView,
    subViewData,
    loadingSubView,
    handleOpenSubView,
    handleBackToResults,
    handleSwitchTabFromSubView,
    closeSubView,
    resetSubView
  };
}
