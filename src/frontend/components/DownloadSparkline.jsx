import React from 'react';
import { Stack, Typography, Tooltip } from '@mui/material';
import { calculateSparklineTrend } from '../lib/takeaways.js';

export default function DownloadSparkline({
  data,
  customMin,
  customMax,
  width = 100,
  height = 24,
  strokeColor
}) {
  if (!data || !Array.isArray(data) || data.length < 2) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        No trend data
      </Typography>
    );
  }

  const min = customMin !== undefined ? customMin : Math.min(...data);
  const max = customMax !== undefined ? customMax : Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const { arrow, displayPct, tooltipText } = calculateSparklineTrend(data);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor || 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Tooltip title={tooltipText}>
        <Typography
          variant="caption"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
            cursor: 'help',
            whiteSpace: 'nowrap'
          }}
        >
          {arrow} {displayPct}
        </Typography>
      </Tooltip>
    </Stack>
  );
}
export { DownloadSparkline };
