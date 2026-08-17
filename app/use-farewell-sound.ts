"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
  ambienceTimer: number;
};

export function useFarewellSound(initialVolume = 0.24) {
  const engineRef = useRef<AudioEngine | null>(null);
  const lastPaperAt = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);

  const makeTone = useCallback((frequency: number, duration: number, level: number, type: OscillatorType = "sine") => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = engine.context.currentTime;
    const oscillator = engine.context.createOscillator();
    const envelope = engine.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(level, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope).connect(engine.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }, []);

  const playClick = useCallback(() => {
    if (!enabled || !engineRef.current) return;
    makeTone(520, 0.055, 0.035, "sine");
    window.setTimeout(() => makeTone(720, 0.045, 0.018, "sine"), 28);
  }, [enabled, makeTone]);

  const playPaper = useCallback(() => {
    const engine = engineRef.current;
    const nowMs = performance.now();
    if (!enabled || !engine || nowMs - lastPaperAt.current < 260) return;
    lastPaperAt.current = nowMs;
    const context = engine.context;
    const duration = 0.13;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1850;
    filter.Q.value = 0.7;
    envelope.gain.setValueAtTime(0.0001, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter).connect(envelope).connect(engine.master);
    source.start();
  }, [enabled]);

  const start = useCallback(() => {
    if (engineRef.current) return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtx();
    const master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
    const frequencies = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 261.63, 329.63, 392, 523.25];
    let step = 0;
    const ambience = () => {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequencies[step++ % frequencies.length];
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.085, now + 0.06);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
      oscillator.connect(envelope).connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.76);
    };
    ambience();
    const ambienceTimer = window.setInterval(ambience, 760);
    engineRef.current = { context, master, ambienceTimer };
    setEnabled(true);
    window.setTimeout(() => makeTone(660, 0.06, 0.025), 40);
  }, [makeTone, volume]);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      window.clearInterval(engine.ambienceTimer);
      engine.master.gain.setTargetAtTime(0, engine.context.currentTime, 0.04);
      window.setTimeout(() => void engine.context.close(), 160);
    }
    engineRef.current = null;
    setEnabled(false);
  }, []);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
    const engine = engineRef.current;
    if (engine) engine.master.gain.setTargetAtTime(next, engine.context.currentTime, 0.06);
  }, []);

  useEffect(() => () => {
    const engine = engineRef.current;
    if (engine) {
      window.clearInterval(engine.ambienceTimer);
      void engine.context.close();
    }
  }, []);

  return { enabled, volume, setVolume, start, stop, playClick, playPaper };
}
