import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { detectTypeScript, detectEsm } from '../../lib/detect.js';
import { formatDate } from '../../lib/formatters.js';
import DownloadSparkline from '../DownloadSparkline.jsx';
import DetailsStatTiles from './DetailsStatTiles.jsx';

export default function DetailsView({
  packageData,
  weeklyDownloads,
  bundleSize,
  downloadTrend,
  onSwitchTab,
  isSidebar,
  tokens,
  focus
}) {
  const [copied, setCopied] = useState(false);
  const tsInfo = detectTypeScript(packageData.raw);
  const esmInfo = detectEsm(packageData.raw);
  const accent = tokens.modeAccents.details;

  const handleCopyInstall = () => {
    navigator.clipboard?.writeText(`npm i ${packageData.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanRepoUrl = useMemo(() => {
    if (!packageData.repository) return null;
    let url = typeof packageData.repository === 'object' ? packageData.repository?.url || '' : String(packageData.repository);
    if (!url) return null;
    url = url
      .replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/^ssh:\/\/git@github.com[:/]/, 'https://github.com/')
      .replace(/^git@github.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }, [packageData.repository]);

  const handleOpenNpm = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    const pkgTarget = (packageData.name || '').trim();
    const url = `https://www.npmjs.com/package/${encodeURIComponent(pkgTarget).replace('%40', '@')}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [packageData.name]);

  const handleOpenGitHub = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cleanRepoUrl && typeof window !== 'undefined') {
      window.open(cleanRepoUrl, '_blank', 'noopener,noreferrer');
    }
  }, [cleanRepoUrl]);

  if (packageData.error && !packageData.version) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: '8px',
          border: '1px solid',
          borderColor: tokens.border,
          borderTop: `3px solid ${accent}`,
          bgcolor: tokens.background.paper,
          p: { xs: 2, sm: 3 },
          boxShadow: 'none'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          No package named "{packageData.name}" on npm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check the package spelling or search for alternative topics.
        </Typography>
      </Card>
    );
  }

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
      {/* Deprecation Alert: only red in the UI */}
      {packageData.deprecated && (
        <Alert
          severity="error"
          variant="standard"
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: tokens.error.border,
            bgcolor: tokens.error.bg,
            color: tokens.error.text,
            '& .MuiAlert-icon': { color: tokens.error.main }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600, mb: 0.25 }}>Package Deprecated</AlertTitle>
          <Typography variant="body2" sx={{ wordBreak: 'break-word', color: 'inherit' }}>
            {packageData.deprecated}
          </Typography>
        </Alert>
      )}

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Prominent Version Line for focus: version queries */}
        {focus === 'version' && packageData.version && (
          <Box
            sx={{
              mb: 1.5,
              p: 1.25,
              borderRadius: '6px',
              bgcolor: tokens.background.subtle,
              border: '1px solid',
              borderColor: tokens.border
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text.primary }}>
              Latest version v{packageData.version}, released {formatDate(packageData.releaseDate)}
            </Typography>
          </Box>
        )}

        {/* Title row */}
        <Stack
          direction={isSidebar ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isSidebar ? 'flex-start' : 'center'}
          spacing={1}
          mb={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {packageData.name}
            </Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary
              }}
            >
              v{packageData.version}
            </Box>
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
              {packageData.license || 'N/A'}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {tsInfo.supported && <VerifiedIcon sx={{ fontSize: 13, color: tokens.text.secondary }} />}
              {tsInfo.label}
            </Box>
            <Box
              sx={{
                px: 0.75,
                py: 0.2,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: tokens.border,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: tokens.text.secondary
              }}
            >
              {esmInfo.label}
            </Box>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
          {packageData.description}
        </Typography>

        {/* Stat Tiles */}
        <DetailsStatTiles
          packageData={packageData}
          weeklyDownloads={weeklyDownloads}
          bundleSize={bundleSize}
          isSidebar={isSidebar}
          tokens={tokens}
        />

        {/* 30-Day Download Sparkline Row */}
        {downloadTrend && (
          <Box
            sx={{
              p: 1.5,
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: tokens.background.subtle,
              border: '1px solid',
              borderColor: tokens.border,
              borderRadius: '6px'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUpIcon sx={{ fontSize: 16, color: tokens.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                30-day download trend
              </Typography>
            </Stack>
            <DownloadSparkline data={downloadTrend} strokeColor={tokens.sparkline} />
          </Box>
        )}

        {/* Monospace Install Command Block */}
        <Box
          sx={{
            p: 1,
            px: 1.5,
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: tokens.background.default,
            border: '1px solid',
            borderColor: tokens.border,
            borderRadius: '6px'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600, fontFamily: 'monospace' }}>
              $
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              npm i {packageData.name}
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCopyInstall}
            startIcon={copied ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : <ContentCopyIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              minHeight: 28,
              py: 0.25,
              px: 1,
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: tokens.border,
              color: tokens.text.primary,
              bgcolor: tokens.background.paper
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </Box>

        {/* Action Buttons: Switch tabs internally */}
        <Stack
          direction={isSidebar ? 'column' : 'row'}
          spacing={1}
          flexWrap="wrap"
          alignItems={isSidebar ? 'stretch' : 'center'}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AltRouteIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => onSwitchTab('alternatives')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 36,
              borderRadius: '6px',
              bgcolor: tokens.action.primary,
              color: tokens.action.primaryText,
              border: `1px solid ${tokens.action.primary}`,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.action.hover,
                boxShadow: 'none'
              }
            }}
          >
            See alternatives
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrowsIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => onSwitchTab('compare')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 36,
              borderRadius: '6px',
              borderColor: tokens.border,
              color: tokens.text.primary,
              '&:hover': {
                borderColor: tokens.text.secondary,
                bgcolor: tokens.background.subtle
              }
            }}
          >
            Compare
          </Button>

          <Box
            sx={{
              ml: isSidebar ? 0 : 'auto',
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              width: isSidebar ? '100%' : 'auto'
            }}
          >
            {cleanRepoUrl && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GitHubIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleOpenGitHub}
                href={cleanRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 36,
                  borderRadius: '6px',
                  borderColor: tokens.border,
                  color: tokens.text.primary,
                  flexGrow: isSidebar ? 1 : 0,
                  '&:hover': {
                    borderColor: tokens.text.secondary,
                    bgcolor: tokens.background.subtle
                  }
                }}
              >
                GitHub
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon sx={{ fontSize: '15px !important' }} />}
              onClick={handleOpenNpm}
              href={`https://www.npmjs.com/package/${encodeURIComponent(packageData.name || '').replace('%40', '@')}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 36,
                borderRadius: '6px',
                borderColor: tokens.border,
                color: tokens.text.primary,
                flexGrow: isSidebar ? 1 : 0,
                '&:hover': {
                  borderColor: tokens.text.secondary,
                  bgcolor: tokens.background.subtle
                }
              }}
            >
              View on npm
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
