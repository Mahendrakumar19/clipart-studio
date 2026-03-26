// ⚠️  IMPORTANT: Change this to your deployed backend URL before building the APK
// For local testing: use your machine's local IP (e.g. http://192.168.1.x:3001)
// For production:   deploy backend to Railway/Render and put the URL here

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.6.27.202:3001';

export const GENERATION_TIMEOUT_MS = 180_000; // 3 minutes per style (accounts for cold start + queue)

export const STYLES = [
  { id: 'cartoon', label: 'Cartoon',   emoji: '🎨', color: '#FF6B6B' },
  { id: 'anime',   label: 'Anime',     emoji: '✨', color: '#A78BFA' },
  { id: 'pixel',   label: 'Pixel Art', emoji: '🕹️', color: '#34D399' },
  { id: 'sketch',  label: 'Sketch',    emoji: '✏️', color: '#60A5FA' },
  { id: 'flat',    label: 'Flat Art',  emoji: '🎭', color: '#FBBF24' },
] as const;
