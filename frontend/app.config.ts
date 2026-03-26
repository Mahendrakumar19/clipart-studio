import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Clipart Studio',
  slug: 'clipart-studio',
  scheme: 'clipart-studio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0F',
  },
  android: {
    package: 'com.yourname.clipartstudio',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0F',
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_MEDIA_IMAGES',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Clipart Studio to access your photos.',
        cameraPermission: 'Allow Clipart Studio to use your camera.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow Clipart Studio to save generated cliparts.',
        savePhotosPermission: 'Allow Clipart Studio to save images.',
        isAccessMediaLocationEnabled: true,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
};

export default config;
