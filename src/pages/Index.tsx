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
  { label: "VR Roller Coaster (1 race)", weight: 5 },
  { label: "Red Horse Beer", weight: 2 },
  { label: "Beer Tower", weight: 0.05 },
  { label: "Tequila Shot 🥃", weight: 15 },
  { label: "Rum Coke 🍹", weight: 5 },
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

    // Create simple audio using Web Audio API for compatibility
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create spin sound (mechanical whir)
    const createSpinSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 100;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    // Create win sound (victory chime)
    const createWinSound = () => {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.5);
        oscillator.start(audioContext.currentTime + i * 0.15);
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.5);
      });
    };
    
    // Store functions
    (spinSoundRef.current as any) = { play: () => createSpinSound() };
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 md:p-8 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-7xl font-bold mb-2 md:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-neon">
            Prize Wheel 🎡
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">Spin to win amazing prizes!</p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-6 md:gap-8 items-start">
          {/* Winners Leaderboard - Left Side on Desktop, Below on Mobile */}
          <div className="order-2 lg:order-1 w-full lg:w-auto animate-fade-in">
            <WinnersLeaderboard winners={winners} onReset={handleReset} />
          </div>

          {/* Center: Wheel and Controls */}
          <div className="order-1 lg:order-2 flex flex-col items-center gap-6 md:gap-8 w-full animate-scale-in">
            {/* Controls */}
            <div className="w-full max-w-md space-y-3 md:space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpin()}
                  className="flex-1 bg-background/50 backdrop-blur-sm border-2 border-primary/30 focus:border-primary text-base md:text-lg"
                  disabled={isSpinning}
                />
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="outline"
                  size="icon"
                  className="border-2 border-primary/30 hover:border-primary transition-all"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={toggleFullscreen}
                  variant="outline"
                  size="icon"
                  className="border-2 border-primary/30 hover:border-primary transition-all"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={handleSpin}
                disabled={isSpinning || cooldownTime > 0}
                className={`w-full h-12 md:h-14 text-lg md:text-xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:scale-105 transition-all neon-glow-purple ${!isSpinning && cooldownTime === 0 && 'animate-pulse-glow'}`}
                size="lg"
              >
                {isSpinning ? "SPINNING..." : cooldownTime > 0 ? `WAIT ${cooldownTime}s` : "🎯 SPIN THE WHEEL"}
              </Button>
            </div>

            {/* Spinning Wheel */}
            <div className="w-full flex items-center justify-center" style={{ height: 'min(90vw, 80vh, 700px)' }}>
              <SpinningWheel
                ref={wheelRef}
                sectors={SECTORS}
                onSpinEnd={handleSpinEnd}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 md:mt-12 text-muted-foreground text-xs md:text-sm animate-fade-in">
          <p>Press Enter or click SPIN to play • Good luck! 🍀</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
