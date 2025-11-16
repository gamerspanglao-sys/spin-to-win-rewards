import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export interface LeaderboardEntry {
  name: string;
  prize: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onReset: () => void;
}

export const Leaderboard = ({ entries, onReset }: LeaderboardProps) => {
  const handleReset = () => {
    const pass = prompt('Enter admin password:');
    if (pass === '7111') {
      onReset();
    } else if (pass !== null) {
      alert('Wrong password');
    }
  };

  return (
    <Card className="fixed left-4 top-20 w-[280px] bg-card/40 backdrop-blur-md border border-border/30 p-4 z-20">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-primary" />
        <strong className="text-foreground text-base">Last 10 Winners</strong>
      </div>
      <ul className="space-y-2 mb-3">
        {entries.length === 0 ? (
          <li className="text-muted-foreground text-sm p-2">No winners yet</li>
        ) : (
          entries.map((entry, idx) => (
            <li
              key={idx}
              className="bg-card/50 rounded-lg p-2 text-sm text-foreground border border-border/20"
            >
              <span className="font-semibold text-primary">{entry.name}</span>
              <span className="text-muted-foreground"> — </span>
              <span>{entry.prize}</span>
            </li>
          ))
        )}
      </ul>
      <Button
        onClick={handleReset}
        variant="outline"
        className="w-full text-sm"
      >
        Reset
      </Button>
    </Card>
  );
};
