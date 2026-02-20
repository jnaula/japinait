import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  // Read .env file manually to ensure we use the correct Supabase credentials
  // This bypasses shell environment variables that might be pointing to the wrong project
  let envConfig = {};
  try {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    envConfig = envFile.split('\n').reduce((acc, line) => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0 && !line.startsWith('#')) {
        acc[key.trim()] = values.join('=').trim();
      }
      return acc;
    }, {});
  } catch (e) {
    console.warn('Could not read .env file', e);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Force use of .env values if they exist, otherwise fallback to process.env (via import.meta.env default behavior)
      ...(envConfig.VITE_SUPABASE_URL ? { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(envConfig.VITE_SUPABASE_URL) } : {}),
      ...(envConfig.VITE_SUPABASE_ANON_KEY ? { 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(envConfig.VITE_SUPABASE_ANON_KEY) } : {}),
    },
    server: {
      historyApiFallback: true,
      host: '0.0.0.0',
      port: 3000,
      hmr: {
        clientPort: 3000,
      },
      allowedHosts: ['.e2b.app', '.e2b.dev'],
    },
  }
})