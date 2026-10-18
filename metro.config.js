const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Garante que todas as respostas HTTP do Metro/Expo (incluindo o HTML raiz do ManifestMiddleware)
// recebam os cabeçalhos COOP e COEP necessários para isolamento cross-origin no navegador.
const writeHeadOriginal = http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead = function (...args) {
  if (!this.headersSent) {
    if (!this.getHeader('Cross-Origin-Embedder-Policy')) {
      this.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    }
    if (!this.getHeader('Cross-Origin-Opener-Policy')) {
      this.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
  }
  return writeHeadOriginal.apply(this, args);
};

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