import { useState, useEffect, useRef, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useImageStore } from './useImageStore';
import { API_BASE_URL, GENERATION_TIMEOUT_MS } from '../utils/config';

type StyleId = 'cartoon' | 'anime' | 'pixel' | 'sketch' | 'flat';
type Status = 'pending' | 'loading' | 'done' | 'failed';

const STYLES: StyleId[] = ['cartoon', 'anime', 'pixel', 'sketch', 'flat'];

// Stagger delay between parallel requests (ms) — prevents backend rate-limit bursts
const STAGGER_DELAY_MS = 1500;

interface GenerateOptions {
  customPrompt?: string;
  intensity?: number; // 0.0–1.0, maps to ControlNet strength
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function useGenerateCliparts(imageUri: string, options?: GenerateOptions) {
  const { setResult } = useImageStore();
  const [statuses, setStatuses] = useState<Record<StyleId, Status>>(
    () => Object.fromEntries(STYLES.map(s => [s, 'pending'])) as Record<StyleId, Status>
  );
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const abortRef = useRef<AbortController[]>([]);
  const doneCountRef = useRef(0);

  const updateStatus = useCallback((styleId: StyleId, status: Status) => {
    setStatuses(prev => ({ ...prev, [styleId]: status }));
  }, []);

  const generateStyle = useCallback(
    async (styleId: StyleId, base64Image: string): Promise<void> => {
      const controller = new AbortController();
      abortRef.current.push(controller);

      // Per-style timeout
      const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

      updateStatus(styleId, 'loading');

      try {
        const body: Record<string, unknown> = {
          imageBase64: base64Image,
          style: styleId,
        };

        // Pass optional prompt & intensity to backend
        if (options?.customPrompt) body.customPrompt = options.customPrompt;
        if (options?.intensity !== undefined) body.intensity = options.intensity;

        console.log(`[generate] firing request for ${styleId} to ${API_BASE_URL}/api/generate`);

        const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();

        if (!data.imageUrl) {
          throw new Error('No image URL in response');
        }

        console.log(`[generate] ${styleId} success from ${data.provider}`);

        // Download the result image locally for persistence
        let uri = data.imageUrl;
        try {
          const filename = `clipart_${styleId}_${Date.now()}.png`;
          const localPath = `${FileSystem.documentDirectory}${filename}`;
          const downloadResult = await FileSystem.downloadAsync(data.imageUrl, localPath);
          uri = downloadResult.uri;
        } catch (downloadErr: any) {
          console.warn(`[generate] local persistence failed for ${styleId}, using remote URL.`, downloadErr.message);
        }

        setResult(styleId, uri);
        updateStatus(styleId, 'done');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`[generate] ${styleId} timed out after ${GENERATION_TIMEOUT_MS / 1000}s`);
        } else {
          console.error(`[generate] ${styleId} failed:`, err.message);
        }
        updateStatus(styleId, 'failed');
      } finally {
        clearTimeout(timeoutId);
        doneCountRef.current += 1;
        setProgress((doneCountRef.current / STYLES.length) * 100);
        if (doneCountRef.current === STYLES.length) {
          setIsComplete(true);
        }
      }
    },
    [updateStatus, setResult, options?.customPrompt, options?.intensity]
  );

  // Retry a single failed style
  const retryStyle = useCallback(
    async (styleId: StyleId) => {
      if (!imageUri) return;
      doneCountRef.current = Math.max(0, doneCountRef.current - 1);
      setProgress((doneCountRef.current / STYLES.length) * 100);
      setIsComplete(false);

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await generateStyle(styleId, base64);
    },
    [imageUri, generateStyle]
  );

  useEffect(() => {
    if (!imageUri) return;

    let cancelled = false;

    const run = async () => {
      try {
        // Convert image to base64 once
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (cancelled) return;

        console.log(`[generate] starting staggered parallel generation for ${STYLES.length} styles`);

        // Staggered parallel: fire each request with a small delay to prevent
        // burst-hitting the backend rate limiter, but still run in parallel overall
        const promises = STYLES.map((styleId, index) =>
          sleep(index * STAGGER_DELAY_MS).then(() => {
            if (!cancelled) return generateStyle(styleId, base64);
          })
        );

        await Promise.allSettled(promises);
      } catch (err: any) {
        console.error('[generate] critical setup error:', err.message);
      }
    };

    run();

    return () => {
      cancelled = true;
      abortRef.current.forEach(c => c.abort());
    };
  }, [imageUri]);

  return { statuses, progress, isComplete, retryStyle };
}
