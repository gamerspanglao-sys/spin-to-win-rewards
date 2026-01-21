import { useState, useRef, useEffect, useMemo } from "react";
import { SpinningWheel, SpinningWheelRef, WheelSector } from "@/components/SpinningWheel";
import { WinnersLeaderboard, Winner } from "@/components/WinnersLeaderboard";
import { WinnerPopup } from "@/components/WinnerPopup";
import { PrizeEditor, Prize } from "@/components/PrizeEditor";
import { VoucherRedemption } from "@/components/VoucherRedemption";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Maximize2, Volume2, VolumeX, Ticket } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cleanExpiredVouchers } from "@/lib/vouchers";
import { useGameSounds } from "@/hooks/useGameSounds";

// Default prize configuration
const DEFAULT_PRIZES: Prize[] = [
  { label: "See you tomorrow ❤️", weight: 46.95, color: '#A855F7', repeat: 3 },
  { label: "FREE Billiard Game", weight: 20, color: '#EC4899', repeat: 2 },
  { label: "30 min Karaoke", weight: 3, color: '#06B6D4' },
  { label: "30 min PS5", weight: 5, color: '#3B82F6' },
  { label: "1 hour PS5", weight: 3, color: '#10B981' },
  { label: "VR 1 Game", weight: 5, color: '#F59E0B' },
  { label: "Red Horse Beer", weight: 2, color: '#F97316' },
  { label: "Beer Tower", weight: 0.05, color: '#EF4444' },
  { label: "Tequila Shot 🥃", weight: 2, color: '#8B5CF6' },
  { label: "Rum Coke 🍹", weight: 2, color: '#14B8A6' },
  { label: "Cola Glass 🥤", weight: 10, color: '#F43F5E' },
];

const STORAGE_KEY = 'prize-wheel-winners';
const PRIZES_STORAGE_KEY = 'prize-wheel-prizes';

// Generate sectors from prizes with smart shuffling
const generateSectors = (prizes: Prize[]): WheelSector[] => {
  const sectors: WheelSector[] = [];
  const seeTomorrowLabel = "See you tomorrow ❤️";
  
  prizes.forEach((prize) => {
    const repeat = prize.repeat || 1;
    for (let i = 0; i < repeat; i++) {
      sectors.push({
        label: prize.label,
        color: prize.color,
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

// Load prizes from localStorage
const loadPrizes = (): Prize[] => {
  try {
    const saved = localStorage.getItem(PRIZES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load prizes', e);
  }
  return DEFAULT_PRIZES;
};

const Index = () => {
  const [playerName, setPlayerName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [lastWin, setLastWin] = useState<{ name: string; prize: string; color: string } | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>(loadPrizes);
  const wheelRef = useRef<SpinningWheelRef>(null);
  
  // Use the game sounds hook
  const { startSpinSound, stopSpinSound, playWinSound, playTickSound } = useGameSounds();

  // Generate sectors from current prizes
  const sectors = useMemo(() => generateSectors(prizes), [prizes]);

  // Handle prizes change
  const handlePrizesChange = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    localStorage.setItem(PRIZES_STORAGE_KEY, JSON.stringify(newPrizes));
  };

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Clean expired vouchers on app load
    cleanExpiredVouchers();

    // Load winners from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWinners(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load winners', e);
      }
    }
  }, []);

  // Tick sound wrapper that respects sound toggle
  const handleTickSound = () => {
    if (soundEnabled) {
      playTickSound();
    }
  };
  
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
    
    if (soundEnabled) {
      startSpinSound();
    }

    wheelRef.current?.spin();
  };

  const handleSpinEnd = (winnerIndex: number) => {
    // Stop spin sound
    if (soundEnabled) {
      stopSpinSound();
    }
    
    // Dramatic pause before showing result
    setTimeout(() => {
      const prize = sectors[winnerIndex].label;
      const sectorColor = sectors[winnerIndex].color;
      
      // Play win sound
      if (soundEnabled) {
        playWinSound();
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

      // Show winner popup
      setLastWin({ name: playerName, prize, color: sectorColor });
      setShowWinnerPopup(true);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 md:p-6 overflow-y-auto">
      {/* Fixed buttons in corner */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        {/* Voucher Redemption Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="relative h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-2 border-amber-300/50 shadow-lg shadow-amber-500/30 animate-pulse hover:animate-none transition-all hover:scale-110"
            >
              <Ticket className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] sm:w-[400px]">
            <div className="pt-6">
              <VoucherRedemption />
            </div>
          </SheetContent>
        </Sheet>

        {/* Fullscreen button */}
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="icon"
          className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11 bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-6xl mx-auto pb-16">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-center lg:items-start justify-center">
          {/* Center: Wheel and Controls */}
          <div className="flex-1 flex flex-col items-center gap-4 w-full order-1">
            {/* Controls */}
            <div className="w-full max-w-md space-y-3">
              {/* Header - aligned with controls */}
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-neon tracking-wider text-center animate-fade-in">
                GAMERS
              </h1>
              
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
                <PrizeEditor
                  prizes={prizes}
                  onPrizesChange={handlePrizesChange}
                  defaultPrizes={DEFAULT_PRIZES}
                />
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
            <div className={`w-full aspect-square ${isFullscreen ? 'max-w-[75vh]' : 'max-w-[500px]'}`}>
              <SpinningWheel
                ref={wheelRef}
                sectors={sectors}
                onSpinEnd={handleSpinEnd}
                onTick={handleTickSound}
              />
            </div>
          </div>

          {/* Winners Leaderboard & Voucher Redemption - Right Side on desktop, bottom on mobile */}
          <div className="w-full lg:w-[280px] flex-shrink-0 animate-fade-in order-3 lg:order-2 space-y-4">
            <WinnersLeaderboard winners={winners} onReset={handleReset} />
            <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border">
              <VoucherRedemption />
            </div>
          </div>
        </div>
      </div>
      
      {/* Winner Popup */}
      {lastWin && (
        <WinnerPopup
          isOpen={showWinnerPopup}
          onClose={() => setShowWinnerPopup(false)}
          playerName={lastWin.name}
          prize={lastWin.prize}
          prizeColor={lastWin.color}
        />
      )}
    </div>
  );
};

export default Index;
