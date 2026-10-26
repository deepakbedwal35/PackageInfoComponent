import React from 'react';
import { Box, Button, Typography, Card, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { DetailsSkeleton } from '../skeletons.jsx';
import DetailsView from './DetailsView.jsx';

export default function DetailsSubView({
  pkgName,
  data,
  loading,
  onBack,
  onSwitchTab,
  onSetAsPrimary,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents.details;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon sx={{ fontSize: '15px !important' }} />}
          onClick={onBack}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 32,
            borderRadius: '6px',
            borderColor: tokens.border,
            color: tokens.text.secondary
          }}
        >
          Back to results
        </Button>

        {onSetAsPrimary && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onSetAsPrimary(pkgName)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 32,
              borderRadius: '6px',
              borderColor: tokens.border,
              color: tokens.text.primary,
              '&:hover': {
                borderColor: tokens.action.primary,
                bgcolor: tokens.background.subtle
              }
            }}
          >
            Set as primary
          </Button>
        )}
      </Stack>

      {loading ? (
        <DetailsSkeleton accentColor={accent} />
      ) : data?.packageData ? (
        <DetailsView
          packageData={data.packageData}
          weeklyDownloads={data.weeklyDownloads}
          bundleSize={data.bundleSize}
          downloadTrend={data.downloadTrend}
          onSwitchTab={onSwitchTab}
          isSidebar={isSidebar}
          tokens={tokens}
        />
      ) : (
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: tokens.border,
            bgcolor: tokens.background.paper
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Unable to load details for {pkgName}.
          </Typography>
        </Card>
      )}
    </Box>
  );
}
