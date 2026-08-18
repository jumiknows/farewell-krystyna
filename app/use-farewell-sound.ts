"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_FILES = {
  ambience: "/audio/paris-cafe-user-v8.mp3",
  envelope: "/audio/envelope-open.mp3",
  paper: "/audio/paper-rustle.mp3",
  select: "/audio/mechanical-select-v8.mp3",
  press: "/audio/mechanical-press-v8.mp3",
} as const;

export function useFarewellSound(initialVolume = 0.28) {
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(false);
  const volumeRef = useRef(initialVolume);
  const lastPaperAt = useRef(0);
  const lastSelectAt = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);

  const playEffect = useCallback((src: string, relativeVolume: number) => {
    if (!enabledRef.current) return;
    const effect = new Audio(src);
    effect.preload = "auto";
    effect.volume = Math.min(1, volumeRef.current * relativeVolume);
    void effect.play().catch(() => undefined);
  }, []);

  const playSelect = useCallback(() => {
    const now = performance.now();
    if (now - lastSelectAt.current < 110) return;
    lastSelectAt.current = now;
    playEffect(SOUND_FILES.select, 0.8);
  }, [playEffect]);

  const playPress = useCallback(() => playEffect(SOUND_FILES.press, 1.8), [playEffect]);
  const playConfirm = useCallback(() => playEffect(SOUND_FILES.press, 2.05), [playEffect]);

  const playPaper = useCallback(() => {
    const now = performance.now();
    if (now - lastPaperAt.current < 320) return;
    lastPaperAt.current = now;
    playEffect(SOUND_FILES.paper, 0.72);
  }, [playEffect]);

  const playEnvelope = useCallback(() => playEffect(SOUND_FILES.envelope, 1.05), [playEffect]);

  const start = useCallback(() => {
    if (ambienceRef.current) return;
    enabledRef.current = true;
    setEnabled(true);
    const mechanism = new Audio(SOUND_FILES.press);
    mechanism.volume = Math.min(1, volumeRef.current * 1.8);
    void mechanism.play().catch(() => undefined);
    const ambience = new Audio(SOUND_FILES.ambience);
    ambience.loop = true;
    ambience.preload = "auto";
    ambience.volume = volumeRef.current;
    ambienceRef.current = ambience;
    void ambience.play().catch(() => undefined);
  }, []);

  const stop = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    const ambience = ambienceRef.current;
    if (ambience) {
      ambience.pause();
      ambience.currentTime = 0;
    }
    ambienceRef.current = null;
  }, []);

  const setVolume = useCallback((next: number) => {
    volumeRef.current = next;
    setVolumeState(next);
    if (ambienceRef.current) ambienceRef.current.volume = next;
  }, []);

  useEffect(() => {
    Object.values(SOUND_FILES).forEach(src => {
      const audio = new Audio(src);
      audio.preload = "auto";
    });
    return () => {
      ambienceRef.current?.pause();
      ambienceRef.current = null;
    };
  }, []);

  return { enabled, volume, setVolume, start, stop, playSelect, playPress, playConfirm, playPaper, playEnvelope };
}
