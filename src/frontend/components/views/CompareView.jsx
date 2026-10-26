import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Select,
  MenuItem,
  Button,
  Box,
  TextField,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { buildTakeaways, buildVersionTakeaways } from '../../lib/takeaways.js';
import { buildPartnerOptions } from '../../lib/ranking.js';
import { buildCompareHeading, validatePkgInput } from '../../lib/compareHelpers.js';
import CompareTable from './CompareTable.jsx';

export { buildPartnerOptions };

export default function CompareView({
  primaryPkg,
  packagesData,
  availableAlternatives = [],
  topAlternativeName,
  onPartnerChange,
  onAddPackage,
  onRemovePackage,
  onRetryPackage,
  onSwapVersions,
  onSelectMajor,
  onInspect,
  isSidebar,
  tokens,
  isVersionCompare = false
}) {
  const accent = tokens.modeAccents.compare;
  const partnerPkg =
    packagesData[1]?.requestedName ||
    packagesData[1]?.info?.name ||
    packagesData[1]?.name ||
    'partner';
  const isTopAlt = topAlternativeName && partnerPkg.toLowerCase() === topAlternativeName.toLowerCase();

  const [customPkgInput, setCustomPkgInput] = useState('');
  const [addError, setAddError] = useState(null);
  const [showAddInput, setShowAddInput] = useState(false);

  // Sparkline shared min/max computed from READY columns only
  const { sharedMin, sharedMax } = useMemo(() => {
    const readyData = packagesData.filter(
      (p) => p.status === 'ready' && !p.pending && Array.isArray(p.downloadTrend) && p.downloadTrend.length > 0
    );
    const allPoints = readyData.flatMap((p) => p.downloadTrend || []);
    if (allPoints.length === 0) return { sharedMin: 0, sharedMax: 1 };
    return {
      sharedMin: Math.min(...allPoints),
      sharedMax: Math.max(...allPoints)
    };
  }, [packagesData]);

  // Factual takeaways: derived strictly from READY data
  const takeaways = useMemo(() => {
    const readyData = packagesData.filter(
      (p) => p.status === 'ready' && !p.pending && p.info && p.info.found !== false
    );
    if (readyData.length === 0) return [];
    if (isVersionCompare) {
      return buildVersionTakeaways(readyData);
    }
    return buildTakeaways(readyData);
  }, [packagesData, isVersionCompare]);

  // Partner options: current partner first, then alternatives, excluding specs already in comparePackages
  const partnerOptions = useMemo(() => {
    const otherSpecs = packagesData
      .map((p) => p.requestedName || p.name)
      .filter((s) => s && s.toLowerCase() !== partnerPkg.toLowerCase());
    return buildPartnerOptions(partnerPkg, availableAlternatives, otherSpecs);
  }, [partnerPkg, availableAlternatives, packagesData]);

  const handleAddSubmit = (e) => {
    e?.preventDefault?.();
    const existingSpecs = packagesData.map((p) => p.requestedName || p.name);
    const validation = validatePkgInput(customPkgInput, existingSpecs);
    if (!validation.valid) {
      setAddError(validation.error);
      return;
    }
    onAddPackage(validation.name);
    setCustomPkgInput('');
    setAddError(null);
    setShowAddInput(false);
  };

  // Heading built from displayed columns' requested names, never from leftover stale state
  const titleText = useMemo(() => {
    const base = buildCompareHeading(packagesData, isVersionCompare, primaryPkg);
    if (!isVersionCompare && isTopAlt && packagesData.length >= 2) {
      const topName = packagesData[1]?.info?.name || packagesData[1]?.requestedName || partnerPkg;
      const col0Name = packagesData[0]?.info?.name || packagesData[0]?.requestedName || primaryPkg;
      return `${base}. ${topName} is the top alternative for ${col0Name}.`;
    }
    return base;
  }, [isVersionCompare, primaryPkg, packagesData, partnerPkg, isTopAlt]);

  // Available major versions for interactive follow-up chips in version mode
  const availableMajors = useMemo(() => {
    if (!isVersionCompare) return [];
    for (const p of packagesData) {
      if (p.info?.availableMajors && p.info.availableMajors.length > 0) {
        return p.info.availableMajors;
      }
    }
    return [];
  }, [isVersionCompare, packagesData]);

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
            {titleText}
          </Typography>
        }
        subheader={
          isVersionCompare ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Version comparison: downloads are package-wide
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
                {onSwapVersions && packagesData.length >= 2 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SwapHorizIcon sx={{ fontSize: '15px !important' }} />}
                    onClick={onSwapVersions}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      height: 28,
                      borderRadius: '6px',
                      borderColor: tokens.border,
                      color: tokens.text.primary
                    }}
                  >
                    Swap versions
                  </Button>
                )}

                {availableMajors.length > 0 && onSelectMajor && (
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600, mr: 0.5 }}>
                      Compare other majors:
                    </Typography>
                    {availableMajors.slice(-8).map((maj) => (
                      <Chip
                        key={maj}
                        label={`v${maj}`}
                        size="small"
                        onClick={() => onSelectMajor(maj, 1)}
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          bgcolor: tokens.background.subtle,
                          border: '1px solid',
                          borderColor: tokens.border,
                          '&:hover': {
                            borderColor: accent
                          }
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          ) : (
            <Stack direction={isSidebar ? 'column' : 'row'} spacing={1.5} alignItems={isSidebar ? 'flex-start' : 'center'} sx={{ mt: 1 }}>
              {/* Rectangular partner selector */}
              {partnerOptions.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
                    Compare with:
                  </Typography>
                  <Select
                    size="small"
                    value={partnerPkg}
                    onChange={(e) => onPartnerChange(e.target.value)}
                    sx={{
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      height: 30,
                      bgcolor: tokens.background.paper,
                      borderColor: tokens.border,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: tokens.border
                      }
                    }}
                  >
                    {partnerOptions.map((opt) => (
                      <MenuItem key={opt.name} value={opt.name} sx={{ fontSize: '0.75rem' }}>
                        {opt.name} {opt.name === topAlternativeName ? '(top alternative)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </Stack>
              )}

              {/* Option to add a 3rd package (max 3 total) */}
              {packagesData.length < 3 && !showAddInput && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => setShowAddInput(true)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    height: 30,
                    borderRadius: '6px',
                    borderColor: tokens.border,
                    color: tokens.text.primary
                  }}
                >
                  Add package (max 3)
                </Button>
              )}

              {showAddInput && (
                <Box component="form" onSubmit={handleAddSubmit} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                  <TextField
                    size="small"
                    placeholder="e.g. fastify"
                    value={customPkgInput}
                    error={Boolean(addError)}
                    helperText={addError}
                    onChange={(e) => {
                      setCustomPkgInput(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    sx={{
                      width: addError ? 220 : 140,
                      '& input': { py: 0.5, px: 1, fontSize: '0.75rem' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: addError ? 'error.main' : tokens.border },
                      '& .MuiFormHelperText-root': { fontSize: '0.68rem', mx: 0.5, mt: 0.25 }
                    }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    type="submit"
                    sx={{
                      minWidth: 44,
                      height: 30,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      bgcolor: tokens.action.primary,
                      color: tokens.action.primaryText
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      setShowAddInput(false);
                      setAddError(null);
                    }}
                    sx={{ minWidth: 30, height: 30, p: 0 }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              )}
            </Stack>
          )
        }
        sx={{ pb: 1, px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        <CompareTable
          packagesData={packagesData}
          primaryPkg={primaryPkg}
          sharedMin={sharedMin}
          sharedMax={sharedMax}
          onRemovePackage={onRemovePackage}
          onRetryPackage={onRetryPackage}
          onInspect={onInspect}
          isSidebar={isSidebar}
          tokens={tokens}
          isVersionCompare={isVersionCompare}
        />

        {/* Factual Takeaways */}
        {takeaways.length > 0 && (
          <Box
            sx={{
              p: 2,
              bgcolor: tokens.background.subtle,
              border: '1px solid',
              borderColor: tokens.border,
              borderRadius: '6px'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: tokens.text.primary }}>
              {isVersionCompare ? 'Changes between versions' : 'Factual Takeaways'}
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2.5,
                '& li': {
                  mb: 0.5,
                  color: tokens.text.secondary,
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }
              }}
            >
              {takeaways.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
