import React from 'react';
import { Box, Stack, Button, Typography, Tooltip } from '@mui/material';

export default function ModeTabs({
  modes,
  activeTab,
  onTabClick,
  tokens,
  helperText,
  activeHelperText
}) {
  const displayText = helperText || activeHelperText;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{
          p: 0.5,
          borderRadius: '6px',
          border: '1px solid',
          borderColor: tokens.border,
          bgcolor: tokens.background.paper,
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          '&::-webkit-scrollbar': { height: 4 }
        }}
      >
        {modes.map((m) => {
          const isActive = activeTab === m.id;
          const accentColor = tokens.modeAccents[m.id];
          const isDisabled = Boolean(m.disabled);

          const btn = (
            <Button
              key={m.id}
              size="small"
              disabled={isDisabled}
              onClick={() => !isDisabled && onTabClick(m.id)}
              sx={{
                minHeight: 28,
                px: 1.25,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                color: isActive ? tokens.action.primaryText : tokens.text.secondary,
                bgcolor: isActive ? accentColor : 'transparent',
                border: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: isActive ? accentColor : tokens.background.subtle,
                  color: isActive ? tokens.action.primaryText : tokens.text.primary,
                  boxShadow: 'none'
                },
                '&.Mui-disabled': {
                  color: tokens.text.secondary,
                  opacity: 0.45,
                  cursor: 'not-allowed'
                }
              }}
            >
              {m.label} {m.loading ? '(Loading)' : ''}
            </Button>
          );

          if (m.tooltip) {
            return (
              <Tooltip key={m.id} title={m.tooltip} arrow enterTouchDelay={50}>
                <span
                  style={{
                    display: 'inline-flex',
                    flexShrink: 0,
                    cursor: isDisabled ? 'not-allowed' : 'default'
                  }}
                >
                  {btn}
                </span>
              </Tooltip>
            );
          }

          return btn;
        })}
      </Stack>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.75,
          color: tokens.text.secondary,
          fontSize: '0.75rem',
          lineHeight: 1.4
        }}
      >
        {displayText}
      </Typography>
    </Box>
  );
}
export { ModeTabs };

