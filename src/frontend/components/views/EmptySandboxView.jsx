import React from 'react';
import { Card, Typography, Grid, Button } from '@mui/material';

export default function EmptySandboxView({ onQuickSearch, tokens }) {
  const sampleQueries = [
    { label: 'Package Details: express', q: 'npm express' },
    { label: 'Compare: react vs vue', q: 'compare react and vue' },
    { label: 'Version Compare: express 4 vs 5', q: 'express 4 vs 5' },
    { label: 'Alternatives: moment', q: 'npm alternatives to moment' },
    { label: 'Use case: date formatting', q: 'best npm package for date formatting' },
    { label: 'Deprecated: request', q: 'npm request' }
  ];

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        textAlign: 'center',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        bgcolor: tokens.background.paper,
        boxShadow: 'none'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        hyperDart npm Package Component
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
        No search data provided yet. Select a sample query below to test intent routing, live metrics, and views.
      </Typography>

      <Grid container spacing={1.5} sx={{ maxWidth: 580, mx: 'auto' }}>
        {sampleQueries.map((item) => (
          <Grid item xs={12} sm={6} key={item.q}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => onQuickSearch(item.q)}
              sx={{
                textTransform: 'none',
                justifyContent: 'flex-start',
                py: 1,
                px: 1.5,
                borderRadius: '6px',
                borderColor: tokens.border,
                color: tokens.text.primary,
                minHeight: 36
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
}
