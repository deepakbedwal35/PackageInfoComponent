import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box
} from '@mui/material';

// ==========================================
// 1. CONSTANTS & LIB RE-EXPORTS
// ==========================================
import { THEME_TOKENS } from './constants/theme.js';
import { KNOWN_BUNDLE_SIZES } from './constants/bundleSizes.js';
import { GENERIC_PROFILE_WORDS, DESCRIPTION_STOPWORDS } from './constants/words.js';
import { formatBytes, formatNumber, formatDate } from './lib/formatters.js';
import { cleanPkgName, isDevEnvironment } from './lib/packageName.js';
import { detectTypeScript, detectEsm } from './lib/detect.js';
import { parseIntent, extractEntityPackage, extractEntityPackages, computeQueryKey } from './lib/parseIntent.js';
import {
  extractProfileTerms,
  rankAlternatives,
  rankUseCaseCandidates,
  isTabBarVisible,
  buildModeTabs
} from './lib/ranking.js';
import { buildTakeaways, calculateSparklineTrend } from './lib/takeaways.js';
import { specsToFetch, validatePkgInput, buildCompareHeading } from './lib/compareHelpers.js';

export {
  THEME_TOKENS,
  KNOWN_BUNDLE_SIZES,
  GENERIC_PROFILE_WORDS,
  DESCRIPTION_STOPWORDS,
  formatBytes,
  formatNumber,
  formatDate,
  cleanPkgName,
  isDevEnvironment,
  detectTypeScript,
  detectEsm,
  parseIntent,
  extractEntityPackage,
  extractEntityPackages,
  computeQueryKey,
  extractProfileTerms,
  rankAlternatives,
  rankUseCaseCandidates,
  isTabBarVisible,
  buildModeTabs,
  buildTakeaways,
  calculateSparklineTrend,
  specsToFetch,
  validatePkgInput,
  buildCompareHeading
};

// =======
// ===================================
// 2. API IMPORTS & RE-EXPORTS
// ==========================================
import { apiCache, cachedFetch, fetchWithFallback } from './api/cache.js';
import {
  fetchPackageInfo,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchUseCaseSearch,
  fetchLiveCandidates
} from './api/npm.js';
import { fetchBundleSize } from './api/bundleSize.js';

export {
  apiCache,
  cachedFetch,
  fetchWithFallback,
  fetchPackageInfo,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchBundleSize,
  fetchUseCaseSearch,
  fetchLiveCandidates
};

// ==========================================
// 3. COMPONENT IMPORTS & RE-EXPORTS
// ==========================================
import MissingValue from './components/MissingValue.jsx';
import DownloadSparkline from './components/DownloadSparkline.jsx';
import ResultRow, { PackageHubRow } from './components/ResultRow.jsx';
import { DetailsSkeleton, TableSkeleton, ListSkeleton } from './components/skeletons.jsx';
import ComponentErrorBoundary from './components/ErrorBoundary.jsx';
import ModeTabs from './components/ModeTabs.jsx';

export {
  MissingValue,
  DownloadSparkline,
  ResultRow,
  PackageHubRow,
  DetailsSkeleton,
  TableSkeleton,
  ListSkeleton,
  ComponentErrorBoundary,
  ModeTabs
};

// ==========================================
// 4. VIEW IMPORTS & RE-EXPORTS
// ==========================================
import {
  DetailsView,
  CompareView,
  buildPartnerOptions,
  AlternativesView,
  UseCaseView,
  DetailsSubView,
  UnmatchedView,
  EmptySandboxView
} from './components/views/index.js';

export {
  DetailsView,
  CompareView,
  buildPartnerOptions,
  AlternativesView,
  UseCaseView,
  DetailsSubView,
  UnmatchedView,
  EmptySandboxView
};

// ==========================================
// 5. HOOKS IMPORTS & RE-EXPORTS
// ==========================================
import { usePackageHub, useSubView } from './hooks/index.js';

export { usePackageHub, useSubView };

// ==========================================
// 6. MAIN HUB COMPONENT
// ==========================================
export function PackageHub(props) {
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

  // Extract entity packages from platform searchData
  const entityNames = useMemo(() => {
    return extractEntityPackages(props.searchData);
  }, [props.searchData]);

  const entityPackage = entityNames[0] || null;

  // Intent parsing from root query and authoritative entityNames
  const rootIntent = useMemo(() => {
    return parseIntent(rootQuery, entityNames);
  }, [rootQuery, entityNames]);

  // Determine initial hub state & primary package
  const initialHubSetup = useMemo(() => {
    let primary = entityPackage || null;
    let initialTab = 'details';
    let isHub = true;
    let initialPartner = null;
    let explicitPackages = null;
    const isVersionCompare = Boolean(rootIntent.isVersionCompare);

    if (rootIntent.view === 'empty' || rootIntent.view === 'unmatched') {
      return { isHub: false, primary: null, initialTab: rootIntent.view, initialPartner: null };
    }

    if (rootIntent.view === 'use-case' && !primary) {
      // Pure use-case query without a primary package
      return { isHub: false, primary: null, initialTab: 'use-case', useCaseQuery: rootIntent.useCase };
    }

    if (rootIntent.view === 'compare') {
      initialTab = 'compare';
      if (!isVersionCompare && entityNames.length >= 2) {
        explicitPackages = entityNames.slice(0, 3);
      } else {
        explicitPackages = rootIntent.packages || [];
      }

      if (isVersionCompare) {
        primary = explicitPackages[0] || 'express@4';
        initialPartner = explicitPackages[1] || 'express@5';
      } else {
        if (!primary && explicitPackages.length > 0) {
          primary = cleanPkgName(explicitPackages[0]);
        }
        if (explicitPackages.length > 1) {
          initialPartner = cleanPkgName(explicitPackages[1]);
        }
      }
    } else if (rootIntent.view === 'alternatives') {
      initialTab = 'alternatives';
      if (!primary) primary = cleanPkgName(rootIntent.package);
    } else if (rootIntent.view === 'details') {
      initialTab = 'details';
      if (!primary) primary = cleanPkgName(rootIntent.package);
    }

    return {
      isHub: Boolean(primary),
      primary: primary || null,
      initialTab,
      initialPartner,
      explicitPackages,
      isVersionCompare
    };
  }, [rootIntent, entityPackage, entityNames]);

  // Local navigation state
  const [hubActive, setHubActive] = useState(Boolean(initialHubSetup.isHub));
  const [activeTab, setActiveTab] = useState(initialHubSetup.initialTab);
  const [currentPrimary, setCurrentPrimary] = useState(initialHubSetup.primary);
  const [comparePackages, setComparePackages] = useState(
    initialHubSetup.explicitPackages || (initialHubSetup.primary ? [initialHubSetup.primary] : [])
  );
  const [comparePartner, setComparePartner] = useState(
    initialHubSetup.isVersionCompare ? initialHubSetup.initialPartner : cleanPkgName(initialHubSetup.initialPartner)
  );

  // Data fetching hook
  const {
    primaryDetails,
    loadingDetails,
    alternativesList,
    loadingAlternatives,
    compareList,
    loadingCompare,
    retryComparePackage,
    useCaseList,
    useCasePhrase,
    loadingUseCase
  } = usePackageHub({
    currentPrimary,
    comparePartner,
    comparePackages,
    initialHubSetup: {
      ...initialHubSetup,
      isHub: hubActive
    },
    activeTab,
    componentLoaded: props?.messageHandlers?.componentLoaded
  });

  // Pick top alternative ONCE when Compare tab opens without a partner
  const autoPartnerPickedRef = useRef(false);
  useEffect(() => {
    if (autoPartnerPickedRef.current) return;
    if (initialHubSetup.isVersionCompare) return;
    if (comparePackages.length === 1 && alternativesList && alternativesList.length > 0) {
      const topAlt = alternativesList[0]?.name;
      if (topAlt && topAlt.toLowerCase() !== comparePackages[0]?.toLowerCase()) {
        autoPartnerPickedRef.current = true;
        const clean = cleanPkgName(topAlt);
        setComparePackages((prev) => (prev.length === 1 ? [...prev, clean] : prev));
        setComparePartner(clean);
      }
    }
  }, [alternativesList, comparePackages.length, initialHubSetup.isVersionCompare]);

  // Drill-in SubView hook
  const {
    subView,
    subViewData,
    loadingSubView,
    handleOpenSubView,
    handleBackToResults,
    closeSubView,
    resetSubView
  } = useSubView({
    currentPrimary,
    primaryDetails,
    setCurrentPrimary,
    setActiveTab
  });

  const handleSwitchTabFromSubView = useCallback((tabId) => {
    if (subView) {
      const chosen = subView;
      setCurrentPrimary(chosen);
      setComparePackages([chosen]);
      setHubActive(true);
      closeSubView();
    }
    setActiveTab(tabId);
  }, [subView, closeSubView]);

  const handleSetAsPrimary = useCallback((pkgName) => {
    const chosen = pkgName || subView;
    if (!chosen) return;
    setCurrentPrimary(chosen);
    setComparePackages([chosen]);
    setHubActive(true);
    closeSubView();
    setActiveTab('details');
  }, [subView, closeSubView]);

  // Local UI actions (state is freshly initialized on remount when query changes)

  const handleTabClick = (tabId) => {
    if (subView) {
      closeSubView();
    }
    setActiveTab(tabId);
  };

  const handlePartnerChange = useCallback((newPartner) => {
    const clean = initialHubSetup.isVersionCompare ? newPartner : cleanPkgName(newPartner);
    setComparePartner(clean);
    setComparePackages((prev) => {
      const next = [...prev];
      if (next.length >= 2) {
        next[1] = clean;
      } else {
        next.push(clean);
      }
      return next;
    });
  }, [initialHubSetup.isVersionCompare]);

  const handleAddThirdPackage = useCallback((newPkg) => {
    const clean = initialHubSetup.isVersionCompare ? newPkg : cleanPkgName(newPkg);
    setComparePackages((prev) => {
      if (prev.length >= 3) return prev;
      const isDup = prev.some((p) => cleanPkgName(p).toLowerCase() === cleanPkgName(clean).toLowerCase());
      if (isDup) return prev;
      return [...prev, clean];
    });
  }, [initialHubSetup.isVersionCompare]);

  const handleRemoveComparePackage = useCallback((pkgName) => {
    setComparePackages((prev) => {
      const target = cleanPkgName(pkgName).toLowerCase();
      const idx = prev.findIndex((p) => cleanPkgName(p).toLowerCase() === target || p.toLowerCase() === target);
      if (idx <= 0) return prev; // Cannot remove primary (idx 0) or not found
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  // Version-compare: swap positions 0 and 1
  const handleSwapVersions = useCallback(() => {
    setComparePackages((prev) => {
      if (prev.length < 2) return prev;
      const next = [prev[1], prev[0], ...prev.slice(2)];
      setComparePartner(next[1]);
      return next;
    });
  }, []);

  // Version-compare: replace position `idx` with `basePackage@major`
  const handleSelectMajor = useCallback((major, idx) => {
    const base = initialHubSetup.isVersionCompare
      ? initialHubSetup.primary?.split('@')[0] || initialHubSetup.primary
      : currentPrimary;
    const newSpec = `${base}@${major}`;
    setComparePackages((prev) => {
      const next = [...prev];
      next[idx] = newSpec;
      if (idx === 1) setComparePartner(newSpec);
      return next;
    });
  }, [initialHubSetup, currentPrimary]);

  const handleQuickSearch = useCallback((queryStr) => {
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
  }, []);

  // Mode helpers & labels
  const MODES = buildModeTabs(currentPrimary, {
    details: loadingDetails,
    compare: loadingCompare,
    alternatives: loadingAlternatives,
    useCase: loadingUseCase
  });

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
          onSetAsPrimary={handleSetAsPrimary}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      );
    }

    if (activeTab === 'empty') {
      return (
        <EmptySandboxView
          tokens={tokens}
          onQuickSearch={handleQuickSearch}
        />
      );
    }

    if (activeTab === 'unmatched') {
      return (
        <UnmatchedView
          query={rootQuery}
          tokens={tokens}
          onQuickSearch={handleQuickSearch}
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
            focus={rootIntent.focus}
          />
        );
      }
    }

    if (activeTab === 'compare') {
      const readyCount = (compareList || []).filter((p) => p.status === 'ready' && !p.pending).length;
      if (loadingCompare && readyCount === 0) {
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
          onRetryPackage={retryComparePackage}
          onSwapVersions={initialHubSetup.isVersionCompare ? handleSwapVersions : undefined}
          onSelectMajor={initialHubSetup.isVersionCompare ? handleSelectMajor : undefined}
          onInspect={handleOpenSubView}
          isSidebar={isSidebar}
          tokens={tokens}
          isVersionCompare={Boolean(initialHubSetup.isVersionCompare)}
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

  const showTabs = isTabBarVisible(activeTab);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', maxWidth: isSidebar ? 420 : 960, mx: 'auto' }}>
        {showTabs && (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              bgcolor: tokens.background.default,
              pt: 1,
              pb: 0.5
            }}
          >
            <ModeTabs
              modes={MODES}
              activeTab={activeTab}
              onTabClick={handleTabClick}
              tokens={tokens}
              activeHelperText={activeHelperText}
            />
          </Box>
        )}

        <ComponentErrorBoundary>
          {renderTabContent()}
        </ComponentErrorBoundary>
      </Box>
    </ThemeProvider>
  );
}

// ==========================================
// 7. THIN WRAPPER: REMOUNT ON QUERY CHANGE
// ==========================================
export default function NewComponent(props) {
  const queryKey = useMemo(() => {
    return computeQueryKey(props?.searchData, props?.searchQuery);
  }, [props?.searchData, props?.searchQuery]);

  return <PackageHub key={queryKey} {...props} />;
}