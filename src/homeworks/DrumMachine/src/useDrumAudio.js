import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioEngine, DEFAULT_VOLUME } from './audioEngine.js';
import { DEFAULT_KIT_ID } from './kits.js';

/**
 * Hook bọc audioEngine. Engine nằm trong ref (không phải state) vì không có gì để render lại.
 * Engine tạo lười lần đầu cần tới, nên StrictMode (dispose rồi mount lại) tự tạo engine mới
 * và áp lại cài đặt hiện tại từ settingsRef.
 */
export function useDrumAudio() {
  const [kit, setKitState] = useState(DEFAULT_KIT_ID);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [muted, setMutedState] = useState(false);
  const [error, setError] = useState(null);

  const engineRef = useRef(null);
  const settingsRef = useRef({ kit: DEFAULT_KIT_ID, volume: DEFAULT_VOLUME, muted: false });

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const engine = createAudioEngine({ onError: (err) => setError(err.message) });
      const settings = settingsRef.current;
      engine.setKit(settings.kit);
      engine.setVolume(settings.volume);
      engine.setMuted(settings.muted);
      engineRef.current = engine;
    }
    return engineRef.current;
  }, []);

  // Tải sẵn byte của kit (chưa cần AudioContext) để hit đầu tiên chỉ còn việc giải mã.
  useEffect(() => {
    getEngine()
      .prefetch(kit)
      .catch((err) => setError(err.message));
  }, [getEngine, kit]);

  // Chỉ cleanup khi unmount: dọn AudioContext.
  useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  const trigger = useCallback((padId, options) => getEngine().play(padId, options), [getEngine]);
  const now = useCallback(() => getEngine().now(), [getEngine]);
  const getLevelDb = useCallback(() => getEngine().getLevelDb(), [getEngine]);

  const setKit = useCallback(
    (id) => {
      getEngine().setKit(id);
      settingsRef.current.kit = id;
      setError(null);
      setKitState(id);
    },
    [getEngine],
  );

  const setVolume = useCallback(
    (value) => {
      getEngine().setVolume(value);
      settingsRef.current.volume = value;
      setVolumeState(value);
    },
    [getEngine],
  );

  const setMuted = useCallback(
    (value) => {
      getEngine().setMuted(value);
      settingsRef.current.muted = value;
      setMutedState(value);
    },
    [getEngine],
  );

  return { trigger, now, getLevelDb, kit, setKit, volume, setVolume, muted, setMuted, error };
}
