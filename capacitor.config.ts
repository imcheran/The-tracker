
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cheran.tracker',
  appName: 'Tracker',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
      // Web Client ID: Used to get the ID Token for Firebase
      serverClientId: '965709257556-i7958klip6ut3mb5fgaffh2p55q3attn.apps.googleusercontent.com', 
      // Android Client ID: Used for Native App Verification (SHA-1)
      androidClientId: '965709257556-vvibqmkm2kgnnn274aontvubn9spv24l.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
  server: {
    url: 'https://tracker-ashen.vercel.app',
    cleartext: true
  }
};

export default config;
