import React from 'react';
import { Card, Typography, Stack, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export default function UnmatchedView({ query, onQuickSearch, tokens }) {
  const suggestions = [
    'npm express',
    'compare react and vue',
    'express 4 vs 5',
    'npm alternatives to moment',
    'best npm package for date formatting'
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
      <SearchOffIcon sx={{ fontSize: 40, color: tokens.text.secondary, mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        No package named "{query || 'query'}" recognized on npm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 440, mx: 'auto' }}>
        Try searching for a specific package name, side-by-side comparison, alternatives, or use case.
      </Typography>

      <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.text.secondary, display: 'block', mb: 1 }}>
        SUGGESTED QUERIES
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {suggestions.map((s) => (
          <Button
            key={s}
            size="small"
            variant="outlined"
            onClick={() => onQuickSearch(s)}
            sx={{
              minHeight: 32,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderColor: tokens.border,
              color: tokens.text.primary,
              bgcolor: tokens.background.default
            }}
          >
            {s}
          </Button>
        ))}
      </Stack>
    </Card>
  );
}
