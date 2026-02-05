
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Remove manual externalization of standard application dependencies
// to allow Vite to correctly bundle and resolve modular exports from node_modules.
export default defineConfig({
  plugins: [react()],
});
