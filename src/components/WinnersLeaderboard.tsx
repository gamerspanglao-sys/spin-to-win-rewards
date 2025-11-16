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
    <Card className="w-full max-w-[300px] bg-card/80 backdrop-blur-md border-2 border-primary/30 neon-glow-purple p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-neon-yellow" />
        <h2 className="text-xl font-bold text-neon-cyan text-neon">Last 10 Winners</h2>
      </div>

      <div className="space-y-2 mb-4 max-h-[500px] overflow-y-auto">
        {winners.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No winners yet!</p>
        ) : (
          winners.map((winner, index) => (
            <div
              key={winner.timestamp}
              className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-neon-purple font-bold text-lg">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{winner.name}</p>
                  <p className="text-sm text-neon-pink">{winner.prize}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={handleReset}
        variant="outline"
        className="w-full border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
        size="sm"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </Card>
  );
};
