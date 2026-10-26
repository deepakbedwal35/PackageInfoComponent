import { formatNumber, formatBytes } from './formatters.js';
import { detectTypeScript, detectEsm } from './detect.js';

/**
 * Factual takeaways builder for CompareView: strictly facts, no winner language.
 */
export function buildTakeaways(packagesData) {
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
}

/**
 * Factual takeaways builder for Version-Compare mode: Changes between versions.
 * Strictly neutral facts, no winner language.
 */
export function buildVersionTakeaways(packagesData) {
  if (!packagesData || packagesData.length < 2) return [];
  const lines = [];
  const p1 = packagesData[0];
  const p2 = packagesData[1];

  if (!p1.info || !p2.info) return [];

  // 1. Major version gap
  const v1 = p1.info.version;
  const v2 = p2.info.version;
  if (v1 && v2) {
    const maj1 = parseInt(v1.split('.')[0], 10);
    const maj2 = parseInt(v2.split('.')[0], 10);
    if (Number.isFinite(maj1) && Number.isFinite(maj2)) {
      const gap = Math.abs(maj2 - maj1);
      lines.push(
        `Major version gap: v${maj1} to v${maj2}${
          gap === 0 ? ' (same major version)' : ` (${gap} major version${gap === 1 ? '' : 's'} difference)`
        }.`
      );
    } else {
      lines.push('Major version gap: not available.');
    }
  }

  // 2. Release date gap
  const d1 = p1.info.releaseDate ? new Date(p1.info.releaseDate) : null;
  const d2 = p2.info.releaseDate ? new Date(p2.info.releaseDate) : null;
  if (d1 && d2 && !isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
    const diffDays = Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    let diffStr = `${diffDays} days`;
    if (diffDays >= 365) {
      diffStr = `~${(diffDays / 365).toFixed(1)} years`;
    } else if (diffDays >= 30) {
      diffStr = `~${Math.round(diffDays / 30)} months`;
    }
    const d1Str = d1.toISOString().slice(0, 10);
    const d2Str = d2.toISOString().slice(0, 10);
    lines.push(
      `Release date gap: ${diffStr} between v${v1 || '1'} (${d1Str}) and v${v2 || '2'} (${d2Str}).`
    );
  } else {
    lines.push('Release date gap: not available.');
  }

  // 3. Change in dependency count
  const c1 = p1.info.dependenciesCount;
  const c2 = p2.info.dependenciesCount;
  if (c1 !== undefined && c2 !== undefined && c1 !== null && c2 !== null) {
    const diff = c2 - c1;
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;
    lines.push(`Dependencies: changed from ${c1} in v${v1 || '1'} to ${c2} in v${v2 || '2'} (${diffSign}).`);
  } else {
    lines.push('Dependencies: not available.');
  }

  // 4. Change in engines.node requirement
  const n1 = p1.info.engines?.node || 'not declared';
  const n2 = p2.info.engines?.node || 'not declared';
  lines.push(`Node requirement: ${n1} in v${v1 || '1'} vs ${n2} in v${v2 || '2'}.`);

  // 5. Change in module format
  const esm1 = detectEsm(p1.info.raw);
  const esm2 = detectEsm(p2.info.raw);
  lines.push(`Module format: v${v1 || '1'} is ${esm1.label}; v${v2 || '2'} is ${esm2.label}.`);

  // 6. Change in size
  const s1 = p1.bundleSize?.size || p1.info.unpackedSize;
  const s2 = p2.bundleSize?.size || p2.info.unpackedSize;
  if (s1 && s2) {
    const sDiff = formatBytes(Math.abs(s2 - s1));
    lines.push(
      `Size: ${formatBytes(s1)} (v${v1 || '1'}) vs ${formatBytes(s2)} (v${v2 || '2'}) (${sDiff} difference).`
    );
  } else {
    lines.push('Size comparison: not available.');
  }

  return lines;
}

/**
 * 7-day trend math used in DownloadSparkline.
 */
export function calculateSparklineTrend(data) {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return { pctChange: 0, arrow: '↑', displayPct: '0%', tooltipText: '7-day average vs previous 7 days: +0%' };
  }

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

  return { pctChange, arrow, displayPct, tooltipText };
}
