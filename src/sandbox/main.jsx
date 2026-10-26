import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import NewComponent from '../frontend/NewComponent';
import defaultSearchData from '../../searchData.json';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  Container,
  Paper,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function SandboxApp() {
  const [queryInput, setQueryInput] = useState('npm express');
  const [activeSearchData, setActiveSearchData] = useState({ query: 'npm express' });
  const [themeName, setThemeName] = useState('dark');
  const [format, setFormat] = useState('mainline');
  const [loadedTimestamp, setLoadedTimestamp] = useState(null);

  const presets = [
    { label: 'Details', query: 'npm express', desc: 'Single package view' },
    { label: 'Compare', query: 'compare react and vue', desc: '2 packages comparison' },
    { label: 'Version Compare', query: 'express 4 vs 5', desc: 'Version-aware comparison' },
    { label: 'Alternatives', query: 'npm alternatives to moment', desc: 'Ranked alternatives' },
    { label: 'Use-case', query: 'best npm package for date formatting', desc: 'NLP search & recommendations' },
    { label: 'Deprecated', query: 'npm request', desc: 'Deprecated package alert' },
    { label: 'Scoped', query: 'package info @mui/material', desc: 'Scoped package' }
  ];

  const handleApplyPreset = (q) => {
    setQueryInput(q);
    setActiveSearchData({ query: q });
  };

  const handleApplyCustomQuery = (e) => {
    e.preventDefault();
    setActiveSearchData({ query: queryInput });
  };

  const handleTestNullData = () => {
    setQueryInput('(null searchData)');
    setActiveSearchData(null);
  };

  const handleTestUnmatched = () => {
    const unmatch = 'randomnonexistentquery12345';
    setQueryInput(unmatch);
    setActiveSearchData({ query: unmatch });
  };

  const messageHandlers = {
    componentLoaded: () => {
      setLoadedTimestamp(new Date().toLocaleTimeString());
    }
  };

  const UIOptions = {
    themeName,
    format,
    sandbox: true
  };

  const isDark = themeName === 'dark' || themeName === 'lightsOut';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#0b0f19' : '#f1f5f9', color: isDark ? '#fff' : '#0f172a' }}>
      {/* Sandbox Control Header */}
      <AppBar position="sticky" elevation={2} sx={{ bgcolor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#fff' : '#0f172a' }}>
        <Toolbar variant="dense" sx={{ flexWrap: 'wrap', gap: 1.5, py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                bgcolor: '#cb3837',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14
              }}
            >
              hD
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              npm Package Sandbox
            </Typography>
          </Stack>

          {/* Quick Query Input */}
          <Box component="form" onSubmit={handleApplyCustomQuery} sx={{ display: 'flex', gap: 1, flexGrow: 1, maxWidth: 440 }}>
            <TextField
              size="small"
              fullWidth
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. npm express, compare react and vue"
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#fff' : '#0f172a',
                  fontSize: '0.85rem'
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon />}
              sx={{ bgcolor: '#cb3837', '&:hover': { bgcolor: '#b02a29' }, textTransform: 'none', fontWeight: 700 }}
            >
              Run
            </Button>
          </Box>

          {/* Format Toggle */}
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Mainline View (Full width)">
              <Button
                variant={format === 'mainline' ? 'contained' : 'outlined'}
                onClick={() => setFormat('mainline')}
                startIcon={<ViewStreamIcon />}
                sx={{ textTransform: 'none' }}
              >
                Mainline
              </Button>
            </Tooltip>
            <Tooltip title="Sidebar View (Compact ~380px)">
              <Button
                variant={format === 'sidebar' ? 'contained' : 'outlined'}
                onClick={() => setFormat('sidebar')}
                startIcon={<ViewSidebarIcon />}
                sx={{ textTransform: 'none' }}
              >
                Sidebar
              </Button>
            </Tooltip>
          </ButtonGroup>

          {/* Theme Toggle */}
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setThemeName(themeName === 'dark' ? 'light' : 'dark')}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

          {/* Callback signal chip */}
          {loadedTimestamp && (
            <Chip
              label={`Ready: ${loadedTimestamp}`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          )}
        </Toolbar>

        {/* Preset query buttons bar */}
        <Box
          sx={{
            px: 2,
            py: 0.8,
            bgcolor: isDark ? '#111827' : '#f8fafc',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
            QUICK PRESETS:
          </Typography>
          {presets.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              clickable
              size="small"
              color={activeSearchData?.query === p.query ? 'primary' : 'default'}
              variant={activeSearchData?.query === p.query ? 'filled' : 'outlined'}
              onClick={() => handleApplyPreset(p.query)}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          ))}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Sandbox edge cases */}
          <Chip
            label="Null Data (Case 1)"
            clickable
            size="small"
            color={activeSearchData === null ? 'warning' : 'default'}
            variant="outlined"
            onClick={handleTestNullData}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />

          <Chip
            label="Unmatched (Case 2)"
            clickable
            size="small"
            color={activeSearchData?.query === 'randomnonexistentquery12345' ? 'warning' : 'default'}
            variant="outlined"
            onClick={handleTestUnmatched}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </Box>
      </AppBar>

      {/* Main Component Render Frame */}
      <Container
        maxWidth={format === 'mainline' ? 'md' : 'xs'}
        sx={{
          py: 4,
          transition: 'max-width 0.3s ease',
          display: 'flex',
          justifyContent: 'center'
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
    </Box>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<SandboxApp />);
