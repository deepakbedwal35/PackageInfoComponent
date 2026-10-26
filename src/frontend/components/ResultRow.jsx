import React from 'react';
import { Box, Typography, Button, Stack, Skeleton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SpeedIcon from '@mui/icons-material/Speed';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { formatNumber, formatBytes } from '../lib/formatters.js';
import { detectTypeScript } from '../lib/detect.js';
import MissingValue from './MissingValue.jsx';

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
              {item.bundleSize?.pending ? (
                <Skeleton variant="text" width={40} sx={{ display: 'inline-block' }} />
              ) : item.bundleSize?.size !== null && item.bundleSize?.size !== undefined ? (
                <>
                  {formatBytes(item.bundleSize.size)}
                  {item.bundleSize?.estimated && (
                    <Typography component="span" variant="caption" sx={{ ml: 0.5, fontSize: '0.7em', color: 'text.secondary', fontWeight: 600 }}>
                      est.
                    </Typography>
                  )}
                </>
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
export default ResultRow;
