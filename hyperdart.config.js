import pkg from './package.json' with { type: 'json' };

export default {
  name: pkg.name,
  triggers: {
    keywords: [
      'npm',
      'package info',
      'compare packages',
      'npm alternatives',
      'npm package',
      'package details',
      'npm compare',
      'npm vs',
      'best npm package',
      'npm library'
    ]
  },
  query_format: {
    regex: [
      '^(?:npm\\s+)?([@a-z0-9_.-]+)$',
      '^([@a-z0-9_.-]+)\\s+npm$',
      '^(?:compare\\s+)?([@a-z0-9_.-]+)\\s+(?:vs|versus|and)\\s+([@a-z0-9_.-]+)',
      '([@a-z0-9_.-]+)\\s+vs\\s+([@a-z0-9_.-]+)',
      '(?:npm\\s+)?alternatives?\\s+(?:to|for)\\s+([@a-z0-9_.-]+)',
      '([@a-z0-9_.-]+)\\s+alternatives?',
      '(?:best|top|recommended)\\s+(?:npm\\s+)?(?:package|packages|lib|library)\\s+(?:for\\s+)?(.+)',
      '^(?:npm\\s+)?(?:package|package\\s+info|info|view)\\s+([@a-z0-9_.-]+)'
    ]
  },
  client: {
    location: pkg.module,
    moduleName: pkg.umdName || 'HD' + pkg.name,
    baseURL: '/' + pkg.name
  },
  format: {
    mainline: true,
    sidebar: true
  },
  permissions: {},
  info: {
    description: 'Standalone npm package search, version compare, alternatives finder, and smart use-case recommender'
  },
  github: 'https://github.com/hyperdart/npm-package-component',
  demovideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  demoVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
};
