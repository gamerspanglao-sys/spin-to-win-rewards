import { useState, useRef, useEffect } from "react";
import { SpinningWheel, SpinningWheelRef, WheelSector } from "@/components/SpinningWheel";
import { WinnersLeaderboard, Winner } from "@/components/WinnersLeaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Prize configuration with weights
interface Prize {
  label: string;
  weight: number;
  repeat?: number;
}

const PRIZES: Prize[] = [
  { label: "See you tomorrow ❤️", weight: 46.95, repeat: 3 },
  { label: "FREE Billiard Game", weight: 20, repeat: 2 },
  { label: "30 min Karaoke", weight: 3 },
  { label: "30 min PS5", weight: 5 },
  { label: "1 hour PS5", weight: 3 },
  { label: "VR 1 Game", weight: 5 },
  { label: "Red Horse Beer", weight: 2 },
  { label: "Beer Tower", weight: 0.05 },
  { label: "Tequila Shot 🥃", weight: 2 },
  { label: "Rum Coke 🍹", weight: 2 },
  { label: "Cola Glass 🥤", weight: 10 },
];

const COLORS = [
  '#A855F7', '#EC4899', '#06B6D4', '#3B82F6', 
  '#10B981', '#F59E0B', '#F97316', '#EF4444', 
  '#8B5CF6', '#14B8A6', '#F43F5E', '#84CC16'
];

// Generate sectors from prizes with smart shuffling
const generateSectors = (): WheelSector[] => {
  const sectors: WheelSector[] = [];
  const seeTomorrowLabel = "See you tomorrow ❤️";
  
  PRIZES.forEach((prize, prizeIndex) => {
    const repeat = prize.repeat || 1;
    for (let i = 0; i < repeat; i++) {
      sectors.push({
        label: prize.label,
        color: COLORS[sectors.length % COLORS.length],
        weight: prize.weight
      });
    }
  });
  
  // Shuffle avoiding adjacent "See you tomorrow" sectors
  const shuffled: WheelSector[] = [];
  const seeTomorrow = sectors.filter(s => s.label === seeTomorrowLabel);
  const others = sectors.filter(s => s.label !== seeTomorrowLabel);
  
  // Shuffle both arrays
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };
  
  const shuffledOthers = shuffleArray(others);
  const shuffledSeeTomorrow = shuffleArray(seeTomorrow);
  
  // Interleave to avoid adjacency
  let othersIdx = 0;
  let seeTomorrowIdx = 0;
  
  while (othersIdx < shuffledOthers.length || seeTomorrowIdx < shuffledSeeTomorrow.length) {
    if (othersIdx < shuffledOthers.length) {
      shuffled.push(shuffledOthers[othersIdx++]);
    }
    if (seeTomorrowIdx < shuffledSeeTomorrow.length && shuffled.length > 0) {
      shuffled.push(shuffledSeeTomorrow[seeTomorrowIdx++]);
    }
    if (othersIdx < shuffledOthers.length) {
      shuffled.push(shuffledOthers[othersIdx++]);
    }
  }
  
  return shuffled;
};

const SECTORS = generateSectors();
const STORAGE_KEY = 'prize-wheel-winners';

const Index = () => {
  const [playerName, setPlayerName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const wheelRef = useRef<SpinningWheelRef>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const tickSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load winners from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWinners(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load winners', e);
      }
    }

    // Create audio context for sounds
    let audioContext: AudioContext | null = null;
    let melodyInterval: NodeJS.Timeout | null = null;
    
    const getAudioContext = () => {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return audioContext;
    };
    
    // Fun carnival melody notes
    const melodyNotes = [
      392, 440, 494, 523, 587, 659, 698, 784, // G4 to G5
      784, 698, 659, 587, 523, 494, 440, 392  // Back down
    ];
    let noteIndex = 0;
    
    const playNote = (freq: number, duration: number = 0.15) => {
      const ctx = getAudioContext();
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
    };
    
    // Start fun spinning melody
    const startSpinSound = () => {
      noteIndex = 0;
      melodyInterval = setInterval(() => {
        playNote(melodyNotes[noteIndex % melodyNotes.length], 0.12);
        noteIndex++;
      }, 120);
    };
    
    const stopSpinSound = () => {
      if (melodyInterval) {
        clearInterval(melodyInterval);
        melodyInterval = null;
      }
    };
    
    // Create win sound (victory fanfare)
    const createWinSound = () => {
      const ctx = getAudioContext();
      const fanfare = [523, 659, 784, 1047, 1047, 784, 1047]; // C5, E5, G5, C6
      fanfare.forEach((freq, i) => {
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
    };
    
    // Store functions
    (spinSoundRef.current as any) = { 
      play: () => startSpinSound(),
      stop: () => stopSpinSound()
    };
    (winSoundRef.current as any) = { play: () => createWinSound() };
  }, []);
  
  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSpin = () => {
    const name = playerName.trim();
    if (!name) {
      toast.error("Please enter your name!");
      return;
    }

    if (isSpinning) return;
    
    if (cooldownTime > 0) {
      toast.error(`Please wait ${cooldownTime} seconds before spinning again!`);
      return;
    }

    setIsSpinning(true);
    
    if (soundEnabled && spinSoundRef.current) {
      (spinSoundRef.current as any).play();
    }

    wheelRef.current?.spin();
  };

  const handleSpinEnd = (winnerIndex: number) => {
    // Stop spin sound
    if (soundEnabled && spinSoundRef.current) {
      (spinSoundRef.current as any).stop?.();
    }
    
    // Dramatic pause before showing result
    setTimeout(() => {
      const prize = SECTORS[winnerIndex].label;
      const sectorColor = SECTORS[winnerIndex].color;
      
      // Play win sound
      if (soundEnabled && winSoundRef.current) {
        (winSoundRef.current as any).play();
      }

      // Confetti effect matching sector color
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 168, g: 85, b: 247 };
      };
      
      const rgb = hexToRgb(sectorColor);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [
          sectorColor,
          `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          '#FFD700',
          '#FF1493',
          '#00FFFF'
        ]
      });

      const newWinner: Winner = {
        name: playerName,
        prize,
        timestamp: Date.now(),
      };

      const updatedWinners = [newWinner, ...winners].slice(0, 10);
      setWinners(updatedWinners);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWinners));

      toast.success(`🎉 ${playerName} won: ${prize}!`, {
        duration: 5000,
        className: "text-lg font-bold",
      });

      setIsSpinning(false);
      setCooldownTime(60); // 60 second cooldown
    }, 500);
  };

  const handleReset = () => {
    setWinners([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Leaderboard reset!");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error("Fullscreen not supported");
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isSpinning) {
        handleSpin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerName, isSpinning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-neon tracking-wider">
            GAMERS
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-center lg:items-start">
          {/* Center: Wheel and Controls */}
          <div className="flex-1 flex flex-col items-center gap-4 w-full order-1">
            {/* Controls */}
            <div className="w-full max-w-md space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpin()}
                  className="flex-1 bg-background/50 backdrop-blur-sm border-2 border-primary/30 focus:border-primary text-base h-11"
                  disabled={isSpinning}
                />
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="outline"
                  size="icon"
                  className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={toggleFullscreen}
                  variant="outline"
                  size="icon"
                  className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={handleSpin}
                disabled={isSpinning || cooldownTime > 0}
                className={`w-full h-12 text-lg font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:scale-105 transition-all neon-glow-purple ${!isSpinning && cooldownTime === 0 && 'animate-pulse-glow'}`}
                size="lg"
              >
                {isSpinning ? "SPINNING..." : cooldownTime > 0 ? `WAIT ${cooldownTime}s` : "🎯 SPIN THE WHEEL"}
              </Button>
            </div>

            {/* Spinning Wheel */}
            <div className="w-full max-w-[500px] aspect-square">
              <SpinningWheel
                ref={wheelRef}
                sectors={SECTORS}
                onSpinEnd={handleSpinEnd}
              />
            </div>
          </div>

          {/* Winners Leaderboard - Right Side */}
          <div className="w-full lg:w-[280px] flex-shrink-0 animate-fade-in order-2">
            <WinnersLeaderboard winners={winners} onReset={handleReset} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
