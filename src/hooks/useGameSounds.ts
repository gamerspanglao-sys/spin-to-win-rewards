import { useRef, useCallback } from 'react';

// Приятная мелодия для вращения (более мягкая)
const SPIN_MELODY = [
  440, 523, 659, 784, 659, 523, 440, 392,  // A4, C5, E5, G5 - более мягкая последовательность
];

// Приятная победная мелодия
const WIN_FANFARE = [
  523, 659, 784, 988, 784, 659, 523  // Более короткая и приятная
];

// Тик при вращении - более мягкий
const TICK_FREQUENCIES = [400, 500, 600];

export const useGameSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const melodyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noteIndexRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Автоматически активируем контекст при первом создании
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    }
    return audioContextRef.current;
  }, []);

  const ensureAudioReady = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        // Пытаемся активировать через пользовательское взаимодействие
        await ctx.resume();
      } catch (e) {
        console.warn('Audio context suspended, user interaction required');
      }
    }
    return ctx;
  }, [getAudioContext]);

  const playNote = useCallback((freq: number, duration: number = 0.2, volume: number = 0.15) => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      return;
    }
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Используем sine для более приятного звука
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Более мягкий звук с плавным затуханием
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Error playing note:', e);
    }
  }, [getAudioContext]);

  const playTickSound = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      return;
    }
    
    try {
      // Мягкий тик с вариацией частоты
      const freq = TICK_FREQUENCIES[Math.floor(Math.random() * TICK_FREQUENCIES.length)];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Используем triangle для более мягкого звука
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      // Более тихий и приятный звук
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.error('Error playing tick:', e);
    }
  }, [getAudioContext]);

  const startSpinSound = useCallback(async () => {
    // Ensure audio context is ready
    await ensureAudioReady();
    
    // Stop any existing melody first
    if (melodyIntervalRef.current) {
      clearInterval(melodyIntervalRef.current);
    }
    
    noteIndexRef.current = 0;
    
    // Начинаем с мягкой ноты
    playNote(SPIN_MELODY[0], 0.2, 0.12);
    noteIndexRef.current = 1;
    
    // Более медленная и приятная мелодия
    melodyIntervalRef.current = setInterval(() => {
      const note = SPIN_MELODY[noteIndexRef.current % SPIN_MELODY.length];
      playNote(note, 0.2, 0.12);
      noteIndexRef.current++;
    }, 150); // Медленнее для более приятного звука
  }, [ensureAudioReady, playNote]);

  const stopSpinSound = useCallback(() => {
    if (melodyIntervalRef.current) {
      clearInterval(melodyIntervalRef.current);
      melodyIntervalRef.current = null;
    }
  }, []);

  const playWinSound = useCallback(async () => {
    const ctx = await ensureAudioReady();
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }
    
    try {
      // Приятная победная мелодия
      WIN_FANFARE.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Используем sine для приятного звука
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Мягкий звук с плавным затуханием
        const startTime = ctx.currentTime + i * 0.12;
        const duration = 0.3;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.error('Error playing win sound:', e);
    }
  }, [ensureAudioReady]);

  return {
    startSpinSound,
    stopSpinSound,
    playWinSound,
    playTickSound,
  };
};
