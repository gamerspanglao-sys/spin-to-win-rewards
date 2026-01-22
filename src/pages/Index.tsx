import { useState, useRef, useEffect, useMemo } from "react";
import { SpinningWheel, SpinningWheelRef, WheelSector } from "@/components/SpinningWheel";
import { WinnersLeaderboard, Winner } from "@/components/WinnersLeaderboard";
import { WinnerPopup } from "@/components/WinnerPopup";
import { PrizeEditor, Prize } from "@/components/PrizeEditor";
import { VoucherRedemption } from "@/components/VoucherRedemption";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Maximize2, Volume2, VolumeX, Ticket, Wallet, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cleanExpiredVouchers } from "@/lib/vouchers";
import { useGameSounds } from "@/hooks/useGameSounds";
import { 
  canCustomerSpinByReceipt as checkLoyverseBalance,
  getLoyverseToken,
  type LoyverseCustomer 
} from "@/lib/loyverse";

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
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [lastWin, setLastWin] = useState<{ name: string; prize: string; color: string } | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>(loadPrizes);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [customerData, setCustomerData] = useState<LoyverseCustomer | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const wheelRef = useRef<SpinningWheelRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the game sounds hook
  const { startSpinSound, stopSpinSound, playWinSound, playTickSound } = useGameSounds();

  // Активируем аудио контекст при первом взаимодействии
  useEffect(() => {
    const activateAudio = async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        ctx.close();
      } catch (e) {
        // Игнорируем ошибки
      }
    };

    // Активируем при первом клике на странице
    const handleFirstClick = () => {
      activateAudio();
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('touchstart', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick, { once: true });
    document.addEventListener('touchstart', handleFirstClick, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('touchstart', handleFirstClick);
    };
  }, []);

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
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
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

  // Проверка баланса через Loyverse по номеру чека
  const handleCheckBalance = async () => {
    const receipt = receiptNumber.trim();
    if (!receipt) {
      toast.error("Please enter receipt number first!");
      return;
    }

    const token = getLoyverseToken();
    if (!token) {
      toast.error("Loyverse API token not configured. Please configure it in settings.");
      return;
    }

    setIsCheckingBalance(true);
    setBalanceError(null);
    
    try {
      const result = await checkLoyverseBalance(receipt);
      
      if (result.allowed) {
        setCustomerBalance(result.balance || 0);
        setCustomerData(result.customer || null);
        toast.success(`Balance verified: ₱${result.balance?.toFixed(2)}`);
      } else {
        setBalanceError(result.reason || "Cannot verify balance");
        setCustomerBalance(result.balance || 0);
        setCustomerData(result.customer || null);
        toast.error(result.reason || "Insufficient balance");
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to check balance";
      setBalanceError(errorMsg);
      
      // Показываем более понятное сообщение
      if (errorMsg.includes('CORS') || errorMsg.includes('Failed to fetch')) {
        toast.error("CORS Error: API blocks browser. Token may be valid - check console.");
        console.error("Loyverse API Error:", error);
        console.log("If token is correct, this is a CORS issue. Token validation:", token ? "Token exists" : "No token");
      } else if (errorMsg.includes('Invalid token') || errorMsg.includes('401')) {
        toast.error("Invalid API token. Please check token in Settings.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Сброс данных баланса при смене номера чека
  useEffect(() => {
    setCustomerBalance(null);
    setCustomerData(null);
    setBalanceError(null);
  }, [receiptNumber]);

  const handleSpin = () => {
    const receipt = receiptNumber.trim();
    if (!receipt) {
      toast.error("Please enter receipt number!");
      return;
    }

    if (isSpinning) return;
    
    // Проверка баланса через Loyverse
    const token = getLoyverseToken();
    if (token) {
      if (!customerData || !customerBalance || customerBalance < 700) {
        toast.error("Please verify your balance first!");
        handleCheckBalance();
        return;
      }
    }
    
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
        name: customerData?.name || receiptNumber,
        prize,
        timestamp: Date.now(),
      };

      const updatedWinners = [newWinner, ...winners].slice(0, 10);
      setWinners(updatedWinners);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWinners));

      // Show winner popup
      setLastWin({ name: customerData?.name || receiptNumber, prize, color: sectorColor });
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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Use the container element for fullscreen
        const element = containerRef.current || document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari support
          await (element as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          // Safari support
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (error) {
      toast.error("Fullscreen not supported");
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
  }, [receiptNumber, isSpinning]);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative z-10"
    >
      {/* Animated background overlay */}
      <div className="animated-bg" />
      
      {/* Fixed buttons in corner */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        {/* Settings/PrizeEditor button */}
        <PrizeEditor
          prizes={prizes}
          onPrizesChange={handlePrizesChange}
          defaultPrizes={DEFAULT_PRIZES}
        />

        {/* Fullscreen button - uses portal to escape fixed container */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          variant="outline"
          size="icon"
          className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11 bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start justify-center">
          {/* Center: Wheel and Controls */}
          <div className="flex-1 flex flex-col items-center gap-6 w-full max-w-2xl mx-auto lg:mx-0 order-1">
            {/* Controls */}
            <div className="w-full max-w-md space-y-4">
              {/* Header - aligned with controls */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-neon tracking-wider text-center animate-fade-in">
                GAMERS
              </h1>
              
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter receipt number..."
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpin()}
                  className="flex-1 glass border-2 border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/50 text-base h-11 transition-all hover:border-primary/70 hover:shadow-lg hover:shadow-primary/30"
                  disabled={isSpinning}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  name="receipt-number-field"
                />
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="outline"
                  size="icon"
                  className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
                {/* Voucher Redemption Button - in top controls */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      size="icon"
                      className="relative h-11 w-11 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-2 border-amber-300/50 shadow-lg shadow-amber-500/30 animate-pulse hover:animate-none transition-all hover:scale-110"
                    >
                      <Ticket className="w-5 h-5 text-white" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-ping" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[400px]">
                    <div className="pt-6">
                      <VoucherRedemption />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Balance Check Section - только если токен настроен */}
              {getLoyverseToken() && (
                <div className="space-y-2">
                  {customerData && customerBalance !== null ? (
                  <div className={`p-3 rounded-lg border ${
                    customerBalance >= 700 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {customerBalance >= 700 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className="text-sm font-semibold">
                            {customerData.name}
                          </div>
                          <div className={`text-xs ${customerBalance >= 700 ? 'text-green-500' : 'text-red-500'}`}>
                            Balance: ₱{customerBalance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomerData(null);
                          setCustomerBalance(null);
                          setBalanceError(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                    {customerBalance < 700 && (
                      <div className="mt-2 text-xs text-red-500">
                        Minimum balance required: ₱700.00
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleCheckBalance}
                    variant="outline"
                    className="w-full glass border-2 border-primary/40"
                    disabled={!receiptNumber.trim() || isCheckingBalance}
                  >
                    {isCheckingBalance ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Check Balance (Loyverse)
                      </>
                    )}
                  </Button>
                )}

                  {/* Error Message */}
                  {balanceError && (
                    <div className="flex items-center gap-2 text-sm text-red-500 p-2 rounded bg-red-500/10">
                      <XCircle className="w-4 h-4" />
                      <span>{balanceError}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleSpin}
                disabled={isSpinning || cooldownTime > 0 || (getLoyverseToken() && (!customerData || !customerBalance || customerBalance < 700))}
                className={`w-full h-12 text-lg font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:scale-110 hover:shadow-2xl transition-all duration-300 neon-glow-purple ripple shimmer ${!isSpinning && cooldownTime === 0 && 'animate-pulse-glow'}`}
                size="lg"
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.8)',
                }}
              >
                {isSpinning ? "SPINNING..." : cooldownTime > 0 ? `WAIT ${cooldownTime}s` : "🎯 SPIN THE WHEEL"}
              </Button>
            </div>

            {/* Spinning Wheel */}
            <div className={`w-full aspect-square ${isFullscreen ? 'max-w-[75vh]' : 'max-w-[500px] md:max-w-[600px]'} mb-4`}>
              <SpinningWheel
                ref={wheelRef}
                sectors={sectors}
                onSpinEnd={handleSpinEnd}
                onTick={handleTickSound}
              />
            </div>
          </div>

          {/* Winners Leaderboard & Voucher Redemption - Right Side on desktop, bottom on mobile */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 animate-fade-in order-3 lg:order-2 space-y-6">
            <WinnersLeaderboard winners={winners} onReset={handleReset} />
            <div className="p-4 md:p-6 rounded-xl glass-strong border border-primary/20 animate-scale-in">
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
