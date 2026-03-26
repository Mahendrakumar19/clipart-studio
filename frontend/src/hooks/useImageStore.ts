import { useCallback, useSyncExternalStore } from 'react';

/**
 * Lightweight global store using useSyncExternalStore for proper React 18 subscription.
 * Stores the selected image URI, generated results, and generation options.
 */

interface StoreState {
  image: string | null;
  results: Record<string, string>;
  customPrompt: string;
  intensity: number; // 0.0–1.0 (maps to ControlNet strength)
}

let _state: StoreState = {
  image: null,
  results: {},
  customPrompt: '',
  intensity: 0.75,
};

const _listeners = new Set<() => void>();
const notify = () => _listeners.forEach(fn => fn());
const subscribe = (listener: () => void) => {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
};
const getSnapshot = () => _state;

export function useImageStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const setImage = useCallback((uri: string) => {
    _state = { ..._state, image: uri, results: {} };
    notify();
  }, []);

  const setResult = useCallback((styleId: string, uri: string) => {
    _state = { ..._state, results: { ..._state.results, [styleId]: uri } };
    notify();
  }, []);

  const setCustomPrompt = useCallback((prompt: string) => {
    _state = { ..._state, customPrompt: prompt };
    notify();
  }, []);

  const setIntensity = useCallback((value: number) => {
    _state = { ..._state, intensity: Math.max(0, Math.min(1, value)) };
    notify();
  }, []);

  const clearAll = useCallback(() => {
    _state = { image: null, results: {}, customPrompt: '', intensity: 0.75 };
    notify();
  }, []);

  return {
    image: state.image,
    results: state.results,
    customPrompt: state.customPrompt,
    intensity: state.intensity,
    setImage,
    setResult,
    setCustomPrompt,
    setIntensity,
    clearAll,
  };
}
