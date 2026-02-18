import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diogenes.app',
  appName: 'Diogenes',
  webDir: 'public', // Using public as placeholder since we load from server
  server: {
    // URL to your deployed manufacturing build
    // CHANGE THIS TO YOUR PRODUCTION URL (e.g. gyral.vercel.app)
    url: 'https://gyral.vercel.app',
    cleartext: true, // Allow http for development
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
