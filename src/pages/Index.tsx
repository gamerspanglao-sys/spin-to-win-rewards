import { useState, useRef, useEffect } from "react";
import { SpinningWheel, SpinningWheelRef, WheelSector } from "@/components/SpinningWheel";
import { WinnersLeaderboard, Winner } from "@/components/WinnersLeaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const SECTORS: WheelSector[] = [
  { label: "See you tomorrow ❤️", color: "#A855F7" },
  { label: "FREE Billiard Game", color: "#EC4899" },
  { label: "30 min Karaoke", color: "#06B6D4" },
  { label: "See you tomorrow ❤️", color: "#3B82F6" },
  { label: "30 min PS5", color: "#10B981" },
  { label: "1 hour PS5", color: "#F59E0B" },
  { label: "See you tomorrow ❤️", color: "#F97316" },
  { label: "VR Roller Coaster", color: "#EF4444" },
  { label: "Red Horse Beer", color: "#8B5CF6" },
  { label: "Beer Tower", color: "#14B8A6" },
  { label: "One Dance!", color: "#F43F5E" },
  { label: "FREE Billiard Game", color: "#84CC16" },
];

const STORAGE_KEY = 'prize-wheel-winners';

const Index = () => {
  const [playerName, setPlayerName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wheelRef = useRef<SpinningWheelRef>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);

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

    // Create audio elements for sound effects
    spinSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjGwU5k9nyyXosBSp+zPLaizsKHGC47OymUhQJQp3e8L1rIAUqfs/z3Ik3CBlnvO/knEwMDlCm4fC3YhsFOpPY8sp6KwUpecrw2Yo5CRxfu+zspVEUCUGb3vC9aiAFK3/Q8N2JOAYYY7zv5JtLDA1Qp+HwuGUcBTmT2fPJeiwFKHnJ8NqLOwocXrvs7KVSFQlBnN7wvWsgBSuA0fLcizgJGGK+8OSaSgwNUKjh8Lhl');
    winSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjGwU5k9nyyXosBSp+zPLaizsKHGC47OymUhQJQp3e8L1rIAUqfs/z3Ik3CBlnvO/knEwMDlCm4fC3YhsFOpPY8sp6KwUpecrw2Yo5CRxfu+zspVEUCUGb3vC9aiAFK3/Q8N2JOAYYY7zv5JtLDA1Qp+HwuGUcBTmT2fPJeiwFKHnJ8NqLOwocXrvs7KVSFQlBnN7wvWsgBSuA0fLcizgJGGK+8OSaSgwNUKjh8Lhl');
  }, []);

  const handleSpin = () => {
    const name = playerName.trim();
    if (!name) {
      toast.error("Please enter your name!");
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    
    if (soundEnabled && spinSoundRef.current) {
      spinSoundRef.current.play().catch(() => {});
    }

    wheelRef.current?.spin();
  };

  const handleSpinEnd = (winnerIndex: number) => {
    const prize = SECTORS[winnerIndex].label;
    
    if (soundEnabled && winSoundRef.current) {
      winSoundRef.current.play().catch(() => {});
    }

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
    });

    setIsSpinning(false);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 relative">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col sm:flex-row items-center gap-3">
        <Input
          type="text"
          placeholder="Enter your name..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={isSpinning}
          className="w-[280px] sm:w-[320px] h-12 text-center text-lg bg-card/80 backdrop-blur-sm border-2 border-primary/50 focus:border-primary neon-glow-purple font-semibold"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSpin}
            disabled={isSpinning || !playerName.trim()}
            className="h-12 px-8 text-lg font-bold bg-gradient-to-r from-neon-purple to-neon-pink hover:scale-105 transition-all neon-glow-purple disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSpinning ? "SPINNING..." : "SPIN"}
          </Button>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="icon"
            className="h-12 w-12 border-primary/50 neon-glow-purple"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="icon"
            className="h-12 w-12 border-primary/50 neon-glow-purple"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 items-center mt-20 lg:mt-0">
        {/* Leaderboard - Left side on desktop, below on mobile */}
        <div className="order-3 lg:order-1 flex justify-center">
          <WinnersLeaderboard winners={winners} onReset={handleReset} />
        </div>

        {/* Wheel - Center */}
        <div className="order-1 lg:order-2 flex justify-center">
          <SpinningWheel
            ref={wheelRef}
            sectors={SECTORS}
            onSpinEnd={handleSpinEnd}
          />
        </div>

        {/* Empty space for symmetry on desktop */}
        <div className="order-2 lg:order-3 hidden lg:block" />
      </div>

      {/* Footer info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-muted-foreground text-sm">
        <p>Press Enter to spin • F11 for fullscreen</p>
      </div>
    </div>
  );
};

export default Index;
