/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Vercel Web Analytics
   ═══════════════════════════════════════════════════════════════ */

import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto', // Automatically detects production/development
  debug: false, // Set to true for development debugging
});
