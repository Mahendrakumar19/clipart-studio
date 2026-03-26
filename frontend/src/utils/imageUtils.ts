import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1024; // px
const QUALITY = 0.85;

/**
 * Compresses and resizes an image to be suitable for AI processing.
 * Ensures we don't send oversized images to the backend.
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION, height: MAX_DIMENSION } }],
      {
        compress: QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );
    return result.uri;
  } catch (err) {
    console.warn('Image compression failed, using original:', err);
    return uri;
  }
}

/**
 * Validates that a given URI points to an image file.
 */
export function isValidImageUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const lower = uri.toLowerCase();
  return (
    lower.startsWith('file://') ||
    lower.startsWith('content://') ||
    lower.startsWith('ph://') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.png') ||
    lower.includes('.webp')
  );
}
