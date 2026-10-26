import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import hdConfig from './hyperdart.config';
import hDBackend from '@hyperdart/backend';

function createDartFramePlugin(hdConfig, pkg) {
  const baseURL = hdConfig?.client?.baseURL || "/";
  const updatedConfig = {
    ...hdConfig,
    client: {
      ...hdConfig.client,
      location: '/' + pkg.source,
    },
  };

  return {
    name: 'vite-plugin-dart-frame',
    configureServer(server) {
      server.middlewares.use(baseURL, async (req, res, next) => {
        try {
          const rawHtml = await hDBackend.createDartFrame(updatedConfig, null);
          const html = await server.transformIndexHtml(req.originalUrl, rawHtml);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        } catch (e) {
          server.ssrFixStacktrace(e);
          next(e);
        }
      });


    },
  };
}

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  const { dir: outDir, name: fileName } = path.parse(pkg.module);

  return {
    // base: hdConfig.client.baseURL,
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      createDartFramePlugin(hdConfig, pkg),
      cssInjectedByJsPlugin(),
      visualizer(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    },
    server: {
      port: 3000,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        '/proxy/npm-registry': {
          target: 'https://registry.npmmirror.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/npm-registry/, ''),
          secure: true,
          headers: {
            'Accept': 'application/json'
          }
        },
        '/proxy/npm-downloads': {
          target: 'https://registry.npmmirror.com/downloads',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/npm-downloads/, ''),
          secure: true,
          headers: {
            'Accept': 'application/json'
          }
        },
        '/proxy/bundlephobia': {
          target: 'https://bundlephobia.com/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/bundlephobia/, ''),
          secure: true,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://bundlephobia.com/'
          }
        },
        '/nodeapi': {
          target: 'https://dev.hyperdart.com',
          changeOrigin: true,
          secure: true,
        },
        '/c': {
          target: 'https://dev.hyperdart.com',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      lib: {
        entry: pkg.source,
        name: pkg.umdName || 'HD' + pkg.name,
        fileName,
        formats: ['es'],
      },
      emptyOutDir: false,
      outDir,
    },
  };
});
