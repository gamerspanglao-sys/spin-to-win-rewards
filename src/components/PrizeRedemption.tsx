import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Gift, Search, X } from "lucide-react";

export interface RedeemablePrize {
  id: number;
  winNumber: number;
  playerName: string;
  prize: string;
  timestamp: number;
  redeemed: boolean;
  redeemedAt?: number;
}

interface PrizeRedemptionProps {
  prizes: RedeemablePrize[];
  onRedeem: (id: number) => void;
  onUnredeem: (id: number) => void;
}

export const PrizeRedemption = ({ prizes, onRedeem, onUnredeem }: PrizeRedemptionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (prize: RedeemablePrize) => {
    const password = prompt('Enter password:');
    if (password === '7111') {
      if (prize.redeemed) {
        onUnredeem(prize.id);
      } else {
        onRedeem(prize.id);
      }
    } else if (password !== null) {
      alert('Wrong password!');
    }
  };

  const filteredPrizes = prizes.filter(prize => {
    const matchesSearch = 
      prize.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prize.prize.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prize.winNumber.toString().includes(searchQuery);
    
    if (showOnlyPending) {
      return matchesSearch && !prize.redeemed;
    }
    return matchesSearch;
  });

  const pendingCount = prizes.filter(p => !p.redeemed).length;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-2 border-neon-cyan/50 hover:border-neon-cyan bg-background/50 gap-2"
        >
          <Gift className="w-4 h-4" />
          Prizes
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-neon-pink text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-neon-cyan" />
            Prize Redemption
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, prize, or #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showOnlyPending ? "default" : "outline"}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className="gap-2"
            >
              {showOnlyPending ? "Pending Only" : "Show All"}
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="px-3 py-1 rounded-full bg-neon-pink/20 text-neon-pink">
              Pending: {pendingCount}
            </div>
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400">
              Redeemed: {prizes.filter(p => p.redeemed).length}
            </div>
          </div>
          
          {/* Prize list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredPrizes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {prizes.length === 0 ? "No prizes to redeem yet" : "No matching prizes found"}
              </div>
            ) : (
              filteredPrizes.map(prize => (
                <Card 
                  key={prize.id}
                  className={`p-3 transition-all ${
                    prize.redeemed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Win number */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        background: prize.redeemed 
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                          : 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: prize.redeemed ? 'white' : 'black'
                      }}
                    >
                      #{prize.winNumber}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{prize.playerName}</div>
                      <div className="text-sm text-neon-pink truncate">{prize.prize}</div>
                      <div className="text-xs text-muted-foreground">
                        Won: {formatDate(prize.timestamp)}
                        {prize.redeemed && prize.redeemedAt && (
                          <span className="text-green-400 ml-2">
                            ✓ Redeemed: {formatDate(prize.redeemedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action button */}
                    <Button
                      size="sm"
                      variant={prize.redeemed ? "outline" : "default"}
                      onClick={() => handleAction(prize)}
                      className={`shrink-0 ${
                        prize.redeemed 
                          ? 'border-red-500/50 hover:bg-red-500/10 text-red-400' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {prize.redeemed ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Undo
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Redeem
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
