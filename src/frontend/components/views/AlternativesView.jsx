import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  List
} from '@mui/material';
import ResultRow from '../ResultRow.jsx';

export default function AlternativesView({
  primaryPkg,
  primaryKeywords = [],
  alternativesList = [],
  onInspect,
  isSidebar,
  tokens
}) {
  const accent = tokens.modeAccents.alternatives;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '8px',
        border: '1px solid',
        borderColor: tokens.border,
        borderTop: `3px solid ${accent}`,
        bgcolor: tokens.background.paper,
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Alternatives to {primaryPkg}
          </Typography>
        }
        subheader="Ranked by shared keywords, then weekly downloads."
        sx={{ pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        {alternativesList.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No close matches found on npm.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {alternativesList.map((alt, index) => (
              <ResultRow
                key={alt.name}
                rank={index + 1}
                item={alt}
                primaryName={primaryPkg}
                primaryKeywords={primaryKeywords}
                onInspect={onInspect}
                tokens={tokens}
                accent={accent}
                isSidebar={isSidebar}
              />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
