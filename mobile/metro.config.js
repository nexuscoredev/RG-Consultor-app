const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

/** expo-sqlite na web importa `wa-sqlite.wasm` — tem de ser extensão de asset, não módulo JS. */
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'wasm'])];

/**
 * SQLite na web (WASM + worker) precisa de contexto isolado → `SharedArrayBuffer`.
 * Sem estes headers o browser mostra "SharedArrayBuffer is not defined".
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
 */
const prevEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const inner = prevEnhance ? prevEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      return inner(req, res, next);
    };
  },
};

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
