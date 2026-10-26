import React from 'react';
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Typography,
  Box,
  Tooltip,
  Button,
  Skeleton,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { formatNumber, formatBytes, formatDate } from '../../lib/formatters.js';
import { cleanPkgName } from '../../lib/packageName.js';
import { detectTypeScript, detectEsm } from '../../lib/detect.js';
import MissingValue from '../MissingValue.jsx';
import DownloadSparkline from '../DownloadSparkline.jsx';

function formatRelativeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diffDays = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months ago`;
  const years = (diffDays / 365).toFixed(1);
  return `${years} years ago`;
}

export default function CompareTable({
  packagesData,
  primaryPkg,
  sharedMin,
  sharedMax,
  onRemovePackage,
  onRetryPackage,
  onInspect,
  isSidebar,
  tokens,
  isVersionCompare = false
}) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: tokens.border,
        borderRadius: '6px',
        mb: 2.5,
        overflowX: 'auto',
        bgcolor: tokens.background.paper
      }}
    >
      <Table size="small" sx={{ minWidth: isSidebar ? 320 : 500 }}>
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
            {packagesData.map((pkg, idx) => {
              const displayName = isVersionCompare
                ? (primaryPkg || cleanPkgName(pkg.requestedName) || pkg.name || '...')
                : (pkg.requestedName || pkg.info?.name || pkg.name || '...');

              const cleanReq = cleanPkgName(pkg.requestedName || '');
              const isDifferentName =
                !isVersionCompare &&
                pkg.info?.name &&
                cleanReq &&
                cleanReq.toLowerCase() !== pkg.info.name.toLowerCase();

              const requestedSpec = pkg.requestedName?.includes('@')
                ? pkg.requestedName.split('@')[1]
                : pkg.info?.requestedSpec || null;

              const isVersionNotFound = pkg.info && pkg.info.found === false;

              return (
                <TableCell key={idx} align="center" sx={{ fontWeight: 600, borderColor: tokens.divider }}>
                  <Stack alignItems="center" spacing={0.5}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {displayName}
                      </Typography>
                      {idx > 0 && packagesData.length > 2 && !pkg.pending && pkg.status !== 'error' && !isVersionCompare && (
                        <Tooltip title="Remove package">
                          <CloseIcon
                            onClick={() => onRemovePackage(displayName)}
                            sx={{ fontSize: 14, cursor: 'pointer', color: tokens.text.secondary }}
                          />
                        </Tooltip>
                      )}
                    </Stack>

                    {pkg.status === 'error' ? (
                      <Box sx={{ mt: 0.5, p: 1, bgcolor: tokens.background.subtle, borderRadius: '4px', maxWidth: 180 }}>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'block' }}>
                          {pkg.error || `Couldn't load ${displayName}`}
                        </Typography>
                        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
                          {onRetryPackage && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onRetryPackage(pkg.requestedName || displayName)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                height: 22,
                                px: 1,
                                minWidth: 0,
                                borderColor: tokens.border,
                                color: tokens.text.primary
                              }}
                            >
                              Retry
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => onRemovePackage(displayName)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.7rem',
                              height: 22,
                              px: 1,
                              minWidth: 0
                            }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Box>
                    ) : pkg.pending ? (
                      <Skeleton width={50} height={20} />
                    ) : isVersionNotFound ? (
                      <Box sx={{ mt: 0.5, p: 1, bgcolor: tokens.background.subtle, borderRadius: '4px', maxWidth: 180 }}>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'block' }}>
                          No version matching {requestedSpec || 'spec'} for {primaryPkg || cleanReq}
                        </Typography>
                        {pkg.info?.availableMajors && pkg.info.availableMajors.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                            Available majors: {pkg.info.availableMajors.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Stack alignItems="center" spacing={0.25}>
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
                          v{pkg.info?.version || 'latest'}
                        </Box>
                        {isVersionCompare && requestedSpec && requestedSpec !== pkg.info?.version && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                            requested: {requestedSpec}
                          </Typography>
                        )}
                      </Stack>
                    )}

                    {isDifferentName && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem', display: 'block', mt: 0.25 }}
                      >
                        registry returned: {pkg.info.name}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Released Row (Especially vital in version mode) */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Released
            </TableCell>
            {packagesData.map((pkg, idx) => {
              if (pkg.pending) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><Skeleton width={80} sx={{ mx: 'auto' }} /></TableCell>;
              if (!pkg.info || pkg.info.found === false) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><MissingValue /></TableCell>;
              const abs = formatDate(pkg.info.releaseDate);
              const rel = formatRelativeDate(pkg.info.releaseDate);
              return (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {abs !== 'N/A' ? abs : <MissingValue />}
                  </Typography>
                  {rel && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      ({rel})
                    </Typography>
                  )}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Node requirement (engines.node) in version mode */}
          {isVersionCompare && (
            <TableRow hover>
              <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                Node requirement
              </TableCell>
              {packagesData.map((pkg, idx) => (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  {pkg.pending ? (
                    <Skeleton width={60} sx={{ mx: 'auto' }} />
                  ) : pkg.info?.engines?.node ? (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {pkg.info.engines.node}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      not declared
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          )}

          {/* Dependencies count (with difference in version mode) */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Dependencies
            </TableCell>
            {packagesData.map((pkg, idx) => {
              if (pkg.pending) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><Skeleton width={40} sx={{ mx: 'auto' }} /></TableCell>;
              if (!pkg.info || pkg.info.found === false) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><MissingValue /></TableCell>;
              const count = pkg.info.dependenciesCount ?? 0;
              const baseCount = packagesData[0]?.info?.dependenciesCount;
              const diff = isVersionCompare && idx > 0 && typeof baseCount === 'number' ? count - baseCount : null;

              return (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {count}
                    {diff !== null && diff !== 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 0.75, color: diff > 0 ? 'text.secondary' : 'success.main', fontWeight: 600 }}
                      >
                        ({diff > 0 ? `+${diff}` : `${diff}`})
                      </Typography>
                    )}
                  </Typography>
                </TableCell>
              );
            })}
          </TableRow>

          {/* Unpacked size (in version mode) */}
          {isVersionCompare && (
            <TableRow hover>
              <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
                Unpacked size
              </TableCell>
              {packagesData.map((pkg, idx) => (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  {pkg.pending ? (
                    <Skeleton width={50} sx={{ mx: 'auto' }} />
                  ) : pkg.info?.unpackedSize ? (
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatBytes(pkg.info.unpackedSize)}
                    </Typography>
                  ) : (
                    <MissingValue />
                  )}
                </TableCell>
              ))}
            </TableRow>
          )}

          {/* Bundle Size */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Bundle size (min / gzip)
            </TableCell>
            {packagesData.map((pkg, idx) => (
              <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {pkg.pending || pkg.bundleSize?.pending ? (
                    <Skeleton variant="text" width={70} sx={{ display: 'inline-block' }} />
                  ) : pkg.bundleSize?.size !== null && pkg.bundleSize?.size !== undefined ? (
                    <>
                      {`${formatBytes(pkg.bundleSize?.size)} / ${formatBytes(pkg.bundleSize?.gzip)}`}
                      {pkg.bundleSize?.estimated && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 0.5, fontSize: '0.7em', color: 'text.secondary', fontWeight: 600 }}
                        >
                          est.
                        </Typography>
                      )}
                    </>
                  ) : (
                    <MissingValue />
                  )}
                </Typography>
              </TableCell>
            ))}
          </TableRow>

          {/* TypeScript Support */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              TypeScript
            </TableCell>
            {packagesData.map((pkg, idx) => {
              if (pkg.pending) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><Skeleton width={50} height={24} sx={{ mx: 'auto' }} /></TableCell>;
              if (!pkg.info || pkg.info.found === false) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><MissingValue /></TableCell>;
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
              if (pkg.pending) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><Skeleton width={50} height={24} sx={{ mx: 'auto' }} /></TableCell>;
              if (!pkg.info || pkg.info.found === false) return <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}><MissingValue /></TableCell>;
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
                {pkg.pending ? (
                  <Skeleton width={40} sx={{ mx: 'auto' }} />
                ) : pkg.info?.license ? (
                  <Typography variant="body2">{pkg.info.license}</Typography>
                ) : (
                  <MissingValue />
                )}
              </TableCell>
            ))}
          </TableRow>

          {/* Deprecated Row */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Deprecated
            </TableCell>
            {packagesData.map((pkg, idx) => (
              <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                {pkg.pending ? (
                  <Skeleton width={40} sx={{ mx: 'auto' }} />
                ) : pkg.info?.deprecated ? (
                  <Chip
                    size="small"
                    color="error"
                    label={pkg.info.deprecated.length > 25 ? `${pkg.info.deprecated.slice(0, 25)}...` : pkg.info.deprecated}
                    title={pkg.info.deprecated}
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No
                  </Typography>
                )}
              </TableCell>
            ))}
          </TableRow>

          {/* Weekly Downloads (Merged row in version compare) */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Weekly downloads
            </TableCell>
            {isVersionCompare ? (
              <TableCell colSpan={packagesData.length} align="center" sx={{ borderColor: tokens.divider }}>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {packagesData[0]?.weeklyDownloads !== null && packagesData[0]?.weeklyDownloads !== undefined ? (
                      formatNumber(packagesData[0].weeklyDownloads)
                    ) : (
                      <MissingValue />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (package-wide, not per version)
                  </Typography>
                </Stack>
              </TableCell>
            ) : (
              packagesData.map((pkg, idx) => (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  {pkg.pending ? (
                    <Skeleton width={50} sx={{ mx: 'auto' }} />
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {pkg.weeklyDownloads !== null ? formatNumber(pkg.weeklyDownloads) : <MissingValue />}
                    </Typography>
                  )}
                </TableCell>
              ))
            )}
          </TableRow>

          {/* 30-day Trend Sparkline (Merged row in version compare) */}
          <TableRow hover>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              30-day trend
            </TableCell>
            {isVersionCompare ? (
              <TableCell colSpan={packagesData.length} align="center" sx={{ borderColor: tokens.divider }}>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <DownloadSparkline
                      data={packagesData[0]?.downloadTrend}
                      customMin={sharedMin}
                      customMax={sharedMax}
                      color={tokens.sparkline.primary}
                      height={24}
                      width={100}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    (package-wide, not per version)
                  </Typography>
                </Stack>
              </TableCell>
            ) : (
              packagesData.map((pkg, idx) => (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  {pkg.pending ? (
                    <Skeleton width={80} height={24} sx={{ mx: 'auto' }} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <DownloadSparkline
                        data={pkg.downloadTrend}
                        customMin={sharedMin}
                        customMax={sharedMax}
                        color={idx === 0 ? tokens.sparkline.primary : tokens.sparkline.secondary}
                        height={24}
                        width={80}
                      />
                    </Box>
                  )}
                </TableCell>
              ))
            )}
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
                {isVersionCompare
                  ? 'Version comparison: downloads and 30-day trends are reported package-wide by npm. Size, dependencies, and requirements are per version.'
                  : 'Size is for the package alone. Packages that need companions (for example react with react-dom) are not like-for-like.'}
              </Typography>
            </TableCell>
          </TableRow>

          {/* Actions */}
          <TableRow>
            <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: tokens.background.paper, borderColor: tokens.divider }}>
              Actions
            </TableCell>
            {packagesData.map((pkg, idx) => {
              if (pkg.pending || !pkg.info || pkg.info.found === false) {
                return (
                  <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                    {pkg.pending ? <Skeleton width={80} height={28} sx={{ mx: 'auto' }} /> : <MissingValue />}
                  </TableCell>
                );
              }
              const targetName = isVersionCompare ? primaryPkg || cleanPkgName(pkg.requestedName) : pkg.info.name;
              const resolvedVer = pkg.info.version;
              const inspectTarget = isVersionCompare ? `${targetName}@${resolvedVer}` : pkg.info.name;
              const npmUrl = isVersionCompare
                ? `https://www.npmjs.com/package/${encodeURIComponent(targetName).replace('%40', '@')}/v/${encodeURIComponent(resolvedVer)}`
                : `https://www.npmjs.com/package/${encodeURIComponent(pkg.info.name).replace('%40', '@')}`;

              return (
                <TableCell key={idx} align="center" sx={{ borderColor: tokens.divider }}>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => onInspect(inspectTarget)}
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
                        window.open(npmUrl, '_blank', 'noopener,noreferrer');
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
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
