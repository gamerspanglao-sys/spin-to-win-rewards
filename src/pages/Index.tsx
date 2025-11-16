import { useState, useEffect } from "react";
import { PrizeWheel, Prize } from "@/components/PrizeWheel";
import { Leaderboard, LeaderboardEntry } from "@/components/Leaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      alert('Enter name');
      return;
    }
    setIsSpinning(true);
    setResultText('Spinning... good luck!');
  };

  const handleLanded = (prize: string) => {
    setResultText(`${playerName} — ${prize}`);
    
    const newEntry = { name: playerName, prize };
    const updated = [newEntry, ...leaderboard].slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('gamersLB', JSON.stringify(updated));
    
    setIsSpinning(false);
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4">
      {/* Top Controls */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        <Input
          type="text"
          placeholder="Enter player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-[320px] h-12 text-center text-lg bg-card border-2 border-border focus:border-primary"
          autoComplete="off"
        />
        <Button
          onClick={handleSpin}
          disabled={isSpinning}
          className="h-12 px-6 text-base font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform glow-cyan disabled:opacity-50"
        >
          SPIN
        </Button>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          className="h-12 px-6"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Leaderboard */}
      <Leaderboard entries={leaderboard} onReset={handleResetLeaderboard} />

      {/* Wheel */}
      <div className="animate-scale-in">
        <PrizeWheel
          prizes={PRIZES}
          onLanded={handleLanded}
          isSpinning={isSpinning}
        />
      </div>

      {/* Result Box */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card/60 backdrop-blur-md border border-border/40 rounded-xl px-8 py-4 z-20">
        <p className="text-foreground text-xl font-semibold text-center">
          {resultText}
        </p>
      </div>

      {/* Small credits */}
      <div className="fixed right-4 bottom-4 text-xs text-muted-foreground z-20">
        <p>Gamers Reward Wheel</p>
      </div>
    </div>
  );
};

export default Index;
