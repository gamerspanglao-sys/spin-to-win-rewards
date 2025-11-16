import { useState, useEffect } from "react";
import { PrizeWheel, Prize } from "@/components/PrizeWheel";
import { Leaderboard, LeaderboardEntry } from "@/components/Leaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Maximize2, Gamepad2 } from "lucide-react";

const PRIZES: Prize[] = [
  { label: "See you tomorrow ❤️", weight: 46.95, repeat: 3 },
  { label: "FREE Billiard Game", weight: 20 },
  { label: "30 min Karaoke", weight: 3 },
  { label: "30 min PS5", weight: 5 },
  { label: "1 hour PS5", weight: 3 },
  { label: "VR Roller Coaster (1 race)", weight: 5 },
  { label: "Red Horse Beer", weight: 2 },
  { label: "Beer Tower", weight: 0.05 },
  { label: "One Dance — Let's Dance", weight: 15 },
];

const Index = () => {
  const [playerName, setPlayerName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultText, setResultText] = useState("Ready — enter name and press SPIN");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentPrize, setCurrentPrize] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('gamersLB');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    const name = playerName.trim();
    if (!name) {
      alert('Enter player name');
      return;
    }
    setIsSpinning(true);
    setShowResult(false);
    setResultText('Spinning... good luck! 🎮');
  };

  const handleLanded = (prize: string) => {
    setCurrentPrize(prize);
    setResultText(`${playerName} won: ${prize}`);
    setShowResult(true);
    
    const newEntry = { name: playerName, prize };
    const updated = [newEntry, ...leaderboard].slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('gamersLB', JSON.stringify(updated));
    
    setTimeout(() => {
      setIsSpinning(false);
    }, 500);
  };

  const handleResetLeaderboard = () => {
    setLeaderboard([]);
    localStorage.setItem('gamersLB', '[]');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSpin();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerName, isSpinning]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-12 relative">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Gamepad2 className="w-16 h-16 text-primary animate-pulse-glow" />
          <h1 className="text-6xl font-bold text-primary text-glow">
            Prize Wheel
          </h1>
          <Gamepad2 className="w-16 h-16 text-secondary animate-pulse-glow" />
        </div>
        <p className="text-xl text-foreground">
          Enter your name and spin for amazing rewards!
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-8 bg-card border-2 border-border backdrop-blur-sm animate-scale-in max-w-md w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-primary text-glow">
              Player Registration
            </h2>
            <p className="text-muted-foreground">
              Ready to win? Enter your name below!
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="h-14 text-lg text-center bg-input border-2 border-border focus:border-primary transition-all"
              autoComplete="off"
              disabled={isSpinning}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || !playerName.trim()}
                className="flex-1 h-14 text-lg font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform glow-cyan disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSpinning ? "SPINNING..." : "SPIN WHEEL"}
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                className="h-14 px-4"
                title="Fullscreen (F)"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Wheel */}
      <div className="animate-scale-in">
        <PrizeWheel
          prizes={PRIZES}
          onLanded={handleLanded}
          isSpinning={isSpinning}
        />
      </div>

      {/* Result Display */}
      {showResult && (
        <Card className="p-6 bg-card border-2 border-primary backdrop-blur-sm animate-scale-in glow-cyan max-w-lg w-full">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-bold text-primary text-glow">
              🎉 Congratulations! 🎉
            </h3>
            <div className="text-2xl font-bold text-secondary text-glow">
              {currentPrize}
            </div>
            <p className="text-foreground">
              Show this screen to staff to claim your prize!
            </p>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <div className="fixed left-4 top-20 max-w-[280px] w-full animate-fade-in hidden lg:block">
        <Leaderboard entries={leaderboard} onReset={handleResetLeaderboard} />
      </div>

      {/* Mobile Leaderboard */}
      <div className="lg:hidden w-full max-w-md animate-fade-in">
        <Leaderboard entries={leaderboard} onReset={handleResetLeaderboard} />
      </div>

      {/* Status Text */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl px-6 py-3 z-20 hidden lg:block">
        <p className="text-foreground text-lg font-medium">
          {resultText}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm">
        <p>Video Gaming Bar • Press F for fullscreen</p>
      </div>
    </div>
  );
};

export default Index;
