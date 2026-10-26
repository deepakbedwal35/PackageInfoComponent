import React from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { formatNumber, formatBytes, formatDate } from '../../lib/formatters.js';
import MissingValue from '../MissingValue.jsx';

export default function DetailsStatTiles({
  packageData,
  weeklyDownloads,
  bundleSize,
  isSidebar,
  tokens
}) {
  return (
    <Grid container spacing={1.5} mb={2.5}>
      <Grid item xs={6} sm={isSidebar ? 6 : 3}>
        <Box
          sx={{
            p: 1.5,
            textAlign: 'left',
            bgcolor: tokens.background.subtle,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Weekly downloads
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {weeklyDownloads !== null ? formatNumber(weeklyDownloads) : <MissingValue />}
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={6} sm={isSidebar ? 6 : 3}>
        <Box
          sx={{
            p: 1.5,
            textAlign: 'left',
            bgcolor: tokens.background.subtle,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Bundle size (min / gzip)
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
            {bundleSize?.pending ? (
              <Skeleton variant="text" width={80} sx={{ display: 'inline-block' }} />
            ) : bundleSize?.size !== null && bundleSize?.size !== undefined ? (
              <>
                {`${formatBytes(bundleSize?.size)} / ${formatBytes(bundleSize?.gzip)}`}
                {bundleSize?.estimated && (
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
        </Box>
      </Grid>

      <Grid item xs={6} sm={isSidebar ? 6 : 3}>
        <Box
          sx={{
            p: 1.5,
            textAlign: 'left',
            bgcolor: tokens.background.subtle,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Dependencies
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {packageData.dependenciesCount ?? <MissingValue />}
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={6} sm={isSidebar ? 6 : 3}>
        <Box
          sx={{
            p: 1.5,
            textAlign: 'left',
            bgcolor: tokens.background.subtle,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Released
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.25 }}>
            {formatDate(packageData.releaseDate)}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}
