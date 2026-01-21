import { useRef, useCallback } from 'react';

// Fun carnival melody notes
const MELODY_NOTES = [
  392, 440, 494, 523, 587, 659, 698, 784, // G4 to G5
  784, 698, 659, 587, 523, 494, 440, 392  // Back down
];

const WIN_FANFARE = [523, 659, 784, 1047, 1047, 784, 1047]; // C5, E5, G5, C6

export const useGameSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const melodyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noteIndexRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const ensureAudioReady = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Failed to resume audio context:', e);
      }
    }
    return ctx;
  }, [getAudioContext]);

  const playNote = useCallback((freq: number, duration: number = 0.15) => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Error playing note:', e);
    }
  }, [getAudioContext]);

  const playTickSound = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = 800 + Math.random() * 200;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
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
    
    // Start playing immediately
    playNote(MELODY_NOTES[0], 0.12);
    noteIndexRef.current = 1;
    
    melodyIntervalRef.current = setInterval(() => {
      playNote(MELODY_NOTES[noteIndexRef.current % MELODY_NOTES.length], 0.12);
      noteIndexRef.current++;
    }, 120);
  }, [ensureAudioReady, playNote]);

  const stopSpinSound = useCallback(() => {
    if (melodyIntervalRef.current) {
      clearInterval(melodyIntervalRef.current);
      melodyIntervalRef.current = null;
    }
  }, []);

  const playWinSound = useCallback(async () => {
    const ctx = await ensureAudioReady();
    if (ctx.state !== 'running') return;
    
    try {
      WIN_FANFARE.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
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
