import React from 'react';
import { Card, Stack, Skeleton, Grid } from '@mui/material';

export function DetailsSkeleton({ accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '4px' }} />
      </Stack>
      <Skeleton variant="text" width="85%" height={22} sx={{ mb: 2.5 }} />
      <Grid container spacing={1.5} mb={2.5}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Skeleton variant="rounded" height={68} sx={{ borderRadius: '6px' }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={40} sx={{ mb: 2, borderRadius: '6px' }} />
      <Skeleton variant="rounded" height={36} width={280} sx={{ borderRadius: '6px' }} />
    </Card>
  );
}

export function TableSkeleton({ cols = 2, accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Skeleton variant="text" width={220} height={30} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={1.5} mb={2}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={`${100 / cols}%`} height={60} sx={{ borderRadius: '6px' }} />
        ))}
      </Stack>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: '4px' }} />
      ))}
    </Card>
  );
}

export function ListSkeleton({ accentColor }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: 'none'
      }}
    >
      <Skeleton variant="text" width={240} height={30} sx={{ mb: 2 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1.5, borderRadius: '6px' }} />
      ))}
    </Card>
  );
}
