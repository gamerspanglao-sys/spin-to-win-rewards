import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw } from "lucide-react";

export interface Winner {
  name: string;
  prize: string;
  timestamp: number;
}

interface WinnersLeaderboardProps {
  winners: Winner[];
  onReset: () => void;
}

export const WinnersLeaderboard = ({ winners, onReset }: WinnersLeaderboardProps) => {
  const handleReset = () => {
    const password = prompt('Enter password to reset:');
    if (password === '7111') {
      onReset();
    } else if (password !== null) {
      alert('Wrong password!');
    }
  };

  return (
    <Card className="w-full lg:max-w-[300px] bg-card/80 backdrop-blur-md border-2 border-primary/30 neon-glow-purple p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-neon-yellow" />
        <h2 className="text-lg md:text-xl font-bold text-neon-cyan text-neon">Last 10 Winners</h2>
      </div>

      <div className="space-y-2 mb-4 max-h-[300px] md:max-h-[500px] overflow-y-auto">
        {winners.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm md:text-base">No winners yet!</p>
        ) : (
          winners.map((winner, index) => (
            <div
              key={winner.timestamp}
              className="bg-muted/50 rounded-lg p-2.5 md:p-3 border border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start gap-2">
                <span className="text-neon-purple font-bold text-base md:text-lg">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-sm md:text-base">{winner.name}</p>
                  <p className="text-xs md:text-sm text-neon-pink">{winner.prize}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={handleReset}
        variant="outline"
        className="w-full border-destructive/50 hover:bg-destructive/10 hover:border-destructive transition-all"
        size="sm"
      >
        <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
        Reset
      </Button>
    </Card>
  );
};
