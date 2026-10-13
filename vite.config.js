import { defineConfig } from 'vite';
import { resolve } from 'path';
import {
  computeReferenceFidelityBuildFingerprint
} from './scripts/lib/reference-fidelity-build-fingerprint.mjs';

const referenceFidelityBuildFingerprint =
  computeReferenceFidelityBuildFingerprint(__dirname);

export default defineConfig({
  root: '.',
  base: './',
  define: {
    __MIRRORLIFE_BUILD_FINGERPRINT__: JSON.stringify(referenceFidelityBuildFingerprint),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        atrium: resolve(__dirname, 'atrium.html'),
      },
    },
  },
  server: {
    port: 4173,
    open: '/game.html',
  },
});
