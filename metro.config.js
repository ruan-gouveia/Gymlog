const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Suporte a WebAssembly (.wasm) para o expo-sqlite na web
config.resolver.assetExts.push('wasm');

// Headers COEP e COOP para SharedArrayBuffer e Web Workers
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './src/global.css' });