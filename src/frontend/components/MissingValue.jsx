import React from 'react';
import { Tooltip, Typography } from '@mui/material';

export default function MissingValue({ tooltip = 'Not published, rate limited, or network restricted' }) {
  return (
    <Tooltip title={tooltip}>
      <Typography
        component="span"
        variant="inherit"
        sx={{
          color: 'text.disabled',
          fontVariantNumeric: 'tabular-nums',
          cursor: 'help'
        }}
      >
        N/A
      </Typography>
    </Tooltip>
  );
}
export { MissingValue };
