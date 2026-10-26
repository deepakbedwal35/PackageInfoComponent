import NewComponent, {
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm,
  cleanPkgName,
  cachedFetch,
  fetchWithFallback,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchBundleSize,
  fetchPackageInfo,
  fetchUseCaseSearch,
  KNOWN_BUNDLE_SIZES,
  THEME_TOKENS,
  GENERIC_PROFILE_WORDS,
  DESCRIPTION_STOPWORDS,
  extractProfileTerms,
  extractEntityPackage,
  fetchLiveCandidates,
  rankAlternatives
} from "./NewComponent";
import { withHD } from '@hyperdart/frontend';

export {
  NewComponent,
  parseIntent,
  formatBytes,
  formatNumber,
  formatDate,
  detectTypeScript,
  detectEsm,
  cleanPkgName,
  cachedFetch,
  fetchWithFallback,
  fetchWeeklyDownloads,
  fetchMonthlyDownloadsRange,
  fetchBundleSize,
  fetchPackageInfo,
  fetchUseCaseSearch,
  KNOWN_BUNDLE_SIZES,
  THEME_TOKENS,
  GENERIC_PROFILE_WORDS,
  DESCRIPTION_STOPWORDS,
  extractProfileTerms,
  extractEntityPackage,
  fetchLiveCandidates,
  rankAlternatives
};

export default withHD(NewComponent);
