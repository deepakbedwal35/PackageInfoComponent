import './index.css';
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import NewComponent, { parseIntent, THEME_TOKENS } from '../frontend/NewComponent';
import defaultSearchData from '../../searchData.json';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  IconButton,
  Container,
  Stack,
  Tooltip,
  Select,
  MenuItem,
  ListSubheader,
  FormControl,
  Link
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// ==========================================
// LOCAL STORAGE KEYS & SAFE HELPERS
// ==========================================
const STORAGE_KEYS = {
  QUERY: 'hd_sandbox_query',
  CASE: 'hd_sandbox_case',
  THEME: 'hd_sandbox_theme',
  LAYOUT: 'hd_sandbox_layout'
};

function getStoredItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredItem(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    // Fail silently in private/blocked environments
  }
}

function clearAllStoredItems() {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUERY);
    localStorage.removeItem(STORAGE_KEYS.CASE);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.LAYOUT);
  } catch {
    // Fail silently
  }
}

// Synchronize URL query params with history.replaceState and mirror to localStorage
function syncUrlAndStorage(searchData, selectedCase, theme, layout) {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Theme & Layout
    params.set('theme', theme);
    params.set('layout', layout);
    setStoredItem(STORAGE_KEYS.THEME, theme);
    setStoredItem(STORAGE_KEYS.LAYOUT, layout);

    // Case and Query
    if (searchData === null || selectedCase === '__NULL_DATA__' || selectedCase === 'null') {
      params.set('case', 'null');
      params.delete('q');
      setStoredItem(STORAGE_KEYS.CASE, '__NULL_DATA__');
      setStoredItem(STORAGE_KEYS.QUERY, '');
    } else {
      const q = (searchData.query || '').trim();
      if (q) {
        params.set('q', q);
        setStoredItem(STORAGE_KEYS.QUERY, q);
      } else {
        params.delete('q');
        setStoredItem(STORAGE_KEYS.QUERY, '');
      }

      if (selectedCase && selectedCase !== '__NULL_DATA__' && selectedCase !== 'null') {
        params.set('case', selectedCase);
        setStoredItem(STORAGE_KEYS.CASE, selectedCase);
      } else {
        params.delete('case');
        setStoredItem(STORAGE_KEYS.CASE, '');
      }
    }

    window.history.replaceState(null, '', url.toString());
  } catch {
    // Fail silently
  }
}

// Resolve initial state on load: URL ?q= -> localStorage -> default 'npm express'
function getInitialSandboxState() {
  let urlParams = null;
  try {
    urlParams = new URLSearchParams(window.location.search);
  } catch {
    urlParams = new URLSearchParams('');
  }

  // 1. Theme
  const urlTheme = urlParams.get('theme');
  const storedTheme = getStoredItem(STORAGE_KEYS.THEME);
  const initialTheme = (urlTheme || storedTheme || 'dark').trim();

  // 2. Layout
  const urlLayout = urlParams.get('layout');
  const storedLayout = getStoredItem(STORAGE_KEYS.LAYOUT);
  const initialLayout = (urlLayout || storedLayout || 'mainline').trim();

  // 3. Null data edge case
  const urlCase = urlParams.get('case');
  const storedCase = getStoredItem(STORAGE_KEYS.CASE);
  const activeCase = (urlCase || storedCase || '').trim();

  if (activeCase === 'null' || activeCase === '__NULL_DATA__') {
    return {
      queryInput: '(null searchData)',
      activeSearchData: null,
      selectedTestCase: '__NULL_DATA__',
      themeName: initialTheme,
      format: initialLayout
    };
  }

  // 4. Query resolution: URL -> localStorage -> default 'npm express'
  const urlQ = urlParams.get('q');
  const storedQ = getStoredItem(STORAGE_KEYS.QUERY);

  let resolvedQuery = '';
  if (urlQ && urlQ.trim()) {
    resolvedQuery = urlQ.trim();
  } else if (storedQ && storedQ.trim()) {
    resolvedQuery = storedQ.trim();
  } else {
    resolvedQuery = 'npm express';
  }

  return {
    queryInput: resolvedQuery,
    activeSearchData: { query: resolvedQuery },
    selectedTestCase: activeCase || resolvedQuery,
    themeName: initialTheme,
    format: initialLayout
  };
}

function SandboxApp() {
  // Initialize state once from URL or storage
  const initialState = useMemo(() => getInitialSandboxState(), []);

  const [queryInput, setQueryInput] = useState(initialState.queryInput);
  const [activeSearchData, setActiveSearchData] = useState(initialState.activeSearchData);
  const [themeName, setThemeName] = useState(initialState.themeName);
  const [format, setFormat] = useState(initialState.format);
  const [selectedTestCase, setSelectedTestCase] = useState(initialState.selectedTestCase);
  const [isReady, setIsReady] = useState(false);

  // Sync initial state to URL and storage on mount
  useEffect(() => {
    syncUrlAndStorage(activeSearchData, selectedTestCase, themeName, format);
  }, []);

  const isDark = themeName === 'dark' || themeName === 'lightsOut';
  const tokens = isDark ? THEME_TOKENS.dark : THEME_TOKENS.light;

  // Determine active mode from query
  const detectedMode = useMemo(() => {
    if (activeSearchData === null) {
      return { id: 'empty', label: 'Null Data', color: tokens.modeAccents.empty };
    }
    const q = activeSearchData?.query || '';
    const parsed = parseIntent(q);
    const modeKey = parsed.view;
    const labels = {
      details: 'Details',
      compare: 'Compare',
      alternatives: 'Alternatives',
      'use-case': 'Use case',
      empty: 'Empty',
      unmatched: 'Unmatched'
    };
    return {
      id: modeKey,
      label: labels[modeKey] || 'Details',
      color: tokens.modeAccents[modeKey] || tokens.text.secondary
    };
  }, [activeSearchData, tokens]);

  const testCases = [
    { type: 'header', label: 'Views' },
    { value: 'npm express', label: 'Details: npm express' },
    { value: 'compare react and vue', label: 'Compare: compare react and vue' },
    { value: 'express 4 vs 5', label: 'Version compare: express 4 vs 5' },
    { value: 'npm alternatives to moment', label: 'Alternatives: npm alternatives to moment' },
    { value: 'best npm package for date formatting', label: 'Use case: best npm package for date formatting' },
    { type: 'header', label: 'Edge cases' },
    { value: 'npm request', label: 'Deprecated: npm request' },
    { value: 'package info @mui/material', label: 'Scoped: package info @mui/material' },
    { value: '__NULL_DATA__', label: 'Null data (Case 1)' },
    { value: 'randomnonexistentquery12345', label: 'Unmatched (Case 2)' }
  ];

  const handleSelectTestCase = (val) => {
    setSelectedTestCase(val);
    if (val === '__NULL_DATA__') {
      setQueryInput('(null searchData)');
      setActiveSearchData(null);
      syncUrlAndStorage(null, '__NULL_DATA__', themeName, format);
    } else {
      setQueryInput(val);
      setActiveSearchData({ query: val });
      syncUrlAndStorage({ query: val }, val, themeName, format);
    }
  };

  const handleApplyCustomQuery = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanQ = queryInput.trim();
    setSelectedTestCase(cleanQ);
    setActiveSearchData({ query: cleanQ });
    syncUrlAndStorage({ query: cleanQ }, cleanQ, themeName, format);
  };

  // Reset toolbar action: clears URL params, storage, and reloads default 'npm express'
  const handleReset = () => {
    clearAllStoredItems();
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // ignore
    }
    const defaultQuery = 'npm express';
    setQueryInput(defaultQuery);
    setActiveSearchData({ query: defaultQuery });
    setSelectedTestCase(defaultQuery);
    setThemeName('dark');
    setFormat('mainline');
  };

  const handleToggleTheme = () => {
    const nextTheme = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(nextTheme);
    syncUrlAndStorage(activeSearchData, selectedTestCase, nextTheme, format);
  };

  const handleToggleFormat = (newFormat) => {
    setFormat(newFormat);
    syncUrlAndStorage(activeSearchData, selectedTestCase, themeName, newFormat);
  };

  // Intercept local actions inside NewComponent (e.g. 'See alternatives', 'Compare with X', 'View details')
  // and sync the effective query to URL and storage
  const handleComponentClickCapture = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const text = (btn.textContent || '').trim();

    // 1. "See alternatives" button
    if (text === 'See alternatives') {
      const heading = document.querySelector('h2, .MuiCardContent-root h2');
      const pkg = heading ? heading.textContent.trim() : queryInput.replace(/^npm\s+/i, '');
      const newQ = `npm alternatives to ${pkg}`;
      setQueryInput(newQ);
      setActiveSearchData({ query: newQ });
      setSelectedTestCase(newQ);
      syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
      return;
    }

    // 2. "Compare with X" button
    if (text.startsWith('Compare with ')) {
      const target = text.replace('Compare with ', '').trim();
      const rowBox = btn.closest('.MuiBox-root');
      const rowTitle = rowBox ? rowBox.querySelector('h6, .MuiTypography-subtitle2') : null;
      const altPkg = rowTitle ? rowTitle.textContent.trim() : '';
      if (altPkg && target) {
        const newQ = `compare ${target} and ${altPkg}`;
        setQueryInput(newQ);
        setActiveSearchData({ query: newQ });
        setSelectedTestCase(newQ);
        syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        return;
      }
    }

    // 3. "View details" or "Inspect"
    if (text === 'View details' || text === 'Inspect') {
      const rowBox = btn.closest('.MuiBox-root, tr, .MuiTableRow-root');
      const rowTitle = rowBox ? rowBox.querySelector('h6, .MuiTypography-subtitle2') : null;
      const pkg = rowTitle ? rowTitle.textContent.trim() : '';
      if (pkg) {
        const newQ = `npm ${pkg}`;
        setQueryInput(newQ);
        setActiveSearchData({ query: newQ });
        setSelectedTestCase(newQ);
        syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        return;
      }
    }

    // 4. Mode strip buttons: "Details", "Compare", "Alternatives", "Use case"
    if (['Details', 'Compare', 'Alternatives', 'Use case'].includes(text)) {
      setTimeout(() => {
        const heading = document.querySelector('h2, .MuiCardContent-root h2, .MuiCardHeader-root h6');
        if (text === 'Details') {
          const currentPkg = heading?.textContent?.trim() || 'react';
          const newQ = `npm ${currentPkg}`;
          setQueryInput(newQ);
          setActiveSearchData({ query: newQ });
          syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        } else if (text === 'Compare') {
          const newQ = 'compare react and vue';
          setQueryInput(newQ);
          setActiveSearchData({ query: newQ });
          syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        } else if (text === 'Alternatives') {
          const currentPkg = heading?.textContent?.trim() || 'moment';
          const newQ = `npm alternatives to ${currentPkg}`;
          setQueryInput(newQ);
          setActiveSearchData({ query: newQ });
          syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        } else if (text === 'Use case') {
          const newQ = 'best npm package for date formatting';
          setQueryInput(newQ);
          setActiveSearchData({ query: newQ });
          syncUrlAndStorage({ query: newQ }, newQ, themeName, format);
        }
      }, 50);
    }
  };

  const messageHandlers = {
    componentLoaded: () => {
      setIsReady(true);
    }
  };

  const UIOptions = {
    themeName,
    format,
    sandbox: true
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: tokens.background.default,
        color: tokens.text.primary,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Sandbox Control Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: tokens.background.paper,
          color: tokens.text.primary,
          borderBottom: '1px solid',
          borderColor: tokens.divider,
          boxShadow: 'none'
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            flexWrap: 'wrap',
            gap: 1.5,
            py: 1,
            px: { xs: 1.5, sm: 2 }
          }}
        >
          {/* Logo - Neutral ink, developer tool look */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                bgcolor: isDark ? '#1f2937' : '#f3f4f6',
                border: '1px solid',
                borderColor: tokens.border,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.text.primary,
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'monospace'
              }}
            >
              hD
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: -0.2 }}>
              npm Sandbox
            </Typography>
          </Stack>

          {/* Quick Query Input */}
          <Box
            component="form"
            onSubmit={handleApplyCustomQuery}
            sx={{ display: 'flex', gap: 1, flexGrow: 1, maxWidth: 360 }}
          >
            <TextField
              size="small"
              fullWidth
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. npm express, compare react and vue"
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: tokens.background.default,
                  color: tokens.text.primary,
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  height: 36,
                  border: '1px solid',
                  borderColor: tokens.border
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon sx={{ fontSize: '15px !important' }} />}
              sx={{
                bgcolor: tokens.action.primary,
                color: tokens.action.primaryText,
                border: `1px solid ${tokens.action.primary}`,
                borderRadius: '6px',
                minHeight: 36,
                px: 1.75,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: tokens.action.hover,
                  boxShadow: 'none'
                }
              }}
            >
              Run
            </Button>
          </Box>

          {/* Detected Mode Label */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ pl: 0.5 }}>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
              Mode:
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                border: `1px solid ${detectedMode.color}`,
                color: detectedMode.color,
                fontSize: '0.75rem',
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              {detectedMode.label}
            </Box>
          </Stack>

          {/* Test cases dropdown */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedTestCase}
              onChange={(e) => handleSelectTestCase(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <span style={{ color: tokens.text.secondary }}>Select test case...</span>;
                const match = testCases.find((tc) => tc.value === selected);
                return match ? match.label : selected;
              }}
              sx={{
                height: 36,
                fontSize: '0.8rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: tokens.border,
                bgcolor: tokens.background.default,
                color: tokens.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }}
            >
              {testCases.map((tc, idx) => {
                if (tc.type === 'header') {
                  return (
                    <ListSubheader
                      key={idx}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        lineHeight: '28px',
                        color: tokens.text.secondary,
                        bgcolor: tokens.background.paper
                      }}
                    >
                      {tc.label}
                    </ListSubheader>
                  );
                }
                return (
                  <MenuItem key={tc.value} value={tc.value} sx={{ fontSize: '0.8rem' }}>
                    {tc.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Mainline / Sidebar Format Toggle */}
          <ButtonGroup size="small" sx={{ height: 36, borderRadius: '6px' }}>
            <Tooltip title="Mainline View (960px max width)">
              <Button
                variant={format === 'mainline' ? 'contained' : 'outlined'}
                onClick={() => handleToggleFormat('mainline')}
                startIcon={<ViewStreamIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px 0 0 6px',
                  minHeight: 36,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: tokens.border,
                  bgcolor: format === 'mainline' ? tokens.action.primary : 'transparent',
                  color: format === 'mainline' ? tokens.action.primaryText : tokens.text.primary,
                  '&:hover': {
                    bgcolor: format === 'mainline' ? tokens.action.hover : tokens.background.subtle,
                    borderColor: tokens.border
                  }
                }}
              >
                Mainline
              </Button>
            </Tooltip>
            <Tooltip title="Sidebar View (compact ~380px)">
              <Button
                variant={format === 'sidebar' ? 'contained' : 'outlined'}
                onClick={() => handleToggleFormat('sidebar')}
                startIcon={<ViewSidebarIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '0 6px 6px 0',
                  minHeight: 36,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: tokens.border,
                  bgcolor: format === 'sidebar' ? tokens.action.primary : 'transparent',
                  color: format === 'sidebar' ? tokens.action.primaryText : tokens.text.primary,
                  '&:hover': {
                    bgcolor: format === 'sidebar' ? tokens.action.hover : tokens.background.subtle,
                    borderColor: tokens.border
                  }
                }}
              >
                Sidebar
              </Button>
            </Tooltip>
          </ButtonGroup>

          {/* Theme Toggle - rectangular control */}
          <IconButton
            size="small"
            color="inherit"
            onClick={handleToggleTheme}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: tokens.border
            }}
          >
            {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>

          {/* Reset button: clears URL parameters, clears localStorage, restores default query */}
          <Tooltip title="Reset sandbox state and return to default query">
            <Button
              size="small"
              variant="text"
              startIcon={<RestartAltIcon sx={{ fontSize: '14px !important' }} />}
              onClick={handleReset}
              sx={{
                color: tokens.text.secondary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                minHeight: 32,
                px: 1,
                borderRadius: '4px',
                '&:hover': {
                  color: tokens.text.primary,
                  bgcolor: tokens.background.subtle
                }
              }}
            >
              Reset
            </Button>
          </Tooltip>

          {/* Status Indicator - plain muted text 'Ready' (no pill, no timestamp, no green) */}
          <Typography
            variant="caption"
            sx={{
              color: isReady ? tokens.text.secondary : tokens.text.disabled,
              fontWeight: 600,
              fontSize: '0.75rem',
              ml: 'auto'
            }}
          >
            {isReady ? 'Ready' : 'Initializing'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Component Render Container */}
      <Container
        maxWidth={false}
        onClickCapture={handleComponentClickCapture}
        sx={{
          py: 4,
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          maxWidth: format === 'mainline' ? 960 : 420,
          transition: 'max-width 150ms ease',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none'
          }
        }}
      >
        <Box sx={{ width: '100%' }}>
          <NewComponent
            searchData={activeSearchData}
            UIOptions={UIOptions}
            messageHandlers={messageHandlers}
          />
        </Box>
      </Container>

      {/* Footer with Hygiene Links */}
      <Box
        component="footer"
        sx={{
          py: 2.5,
          px: 2,
          borderTop: '1px solid',
          borderColor: tokens.divider,
          bgcolor: tokens.background.paper,
          textAlign: 'center'
        }}
      >
        <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
          <Link
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: tokens.text.secondary, fontSize: '0.8rem', fontWeight: 600 }}
          >
            Privacy
          </Link>
          <Link
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: tokens.text.secondary, fontSize: '0.8rem', fontWeight: 600 }}
          >
            Terms
          </Link>
          <Link
            href="https://github.com/hyperdart/npm-package-component"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: tokens.text.secondary, fontSize: '0.8rem', fontWeight: 600 }}
          >
            Docs
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<SandboxApp />);
