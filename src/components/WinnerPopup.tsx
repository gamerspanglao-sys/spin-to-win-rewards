import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface WinnerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  prize: string;
  prizeColor: string;
}

export const WinnerPopup = ({ isOpen, onClose, playerName, prize, prizeColor }: WinnerPopupProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay content appearance for dramatic effect
      setTimeout(() => setShowContent(true), 100);
      
      // Multiple confetti bursts
      const fireConfetti = () => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.4, x: 0.5 },
          colors: [prizeColor, '#FFD700', '#FF1493', '#00FFFF', '#FF6B6B']
        });
      };
      
      fireConfetti();
      setTimeout(fireConfetti, 300);
      setTimeout(fireConfetti, 600);
    } else {
      setShowContent(false);
    }
  }, [isOpen, prizeColor]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none overflow-visible">
        <div 
          className={`relative p-8 rounded-3xl transition-all duration-500 transform ${
            showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          style={{
            background: `linear-gradient(135deg, ${prizeColor}22, ${prizeColor}44)`,
            backdropFilter: 'blur(20px)',
            border: `3px solid ${prizeColor}`,
            boxShadow: `0 0 60px ${prizeColor}66, inset 0 0 60px ${prizeColor}22`
          }}
        >
          {/* Animated glow rings */}
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{ 
              boxShadow: `0 0 40px ${prizeColor}88`,
            }}
          />
          
          {/* Stars decoration */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="text-5xl animate-bounce">🎉</span>
          </div>
          
          {/* Content */}
          <div className="text-center space-y-4 relative z-10 pt-4">
            <h2 className="text-2xl font-bold text-white/90 tracking-wide">
              CONGRATULATIONS!
            </h2>
            
            <div 
              className="text-3xl md:text-4xl font-extrabold py-2 animate-pulse"
              style={{ 
                color: prizeColor,
                textShadow: `0 0 20px ${prizeColor}, 0 0 40px ${prizeColor}66`
              }}
            >
              {playerName}
            </div>
            
            <div className="text-lg text-white/80">
              You won
            </div>
            
            <div 
              className="text-2xl md:text-3xl font-bold py-4 px-6 rounded-2xl mx-auto inline-block"
              style={{
                background: `linear-gradient(135deg, ${prizeColor}44, ${prizeColor}66)`,
                border: `2px solid ${prizeColor}`,
                color: '#fff',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              {prize}
            </div>
            
            {/* Sparkles */}
            <div className="flex justify-center gap-2 text-2xl">
              <span className="animate-spin" style={{ animationDuration: '3s' }}>✨</span>
              <span className="animate-bounce">🌟</span>
              <span className="animate-spin" style={{ animationDuration: '2s' }}>✨</span>
            </div>
            
            <Button
              onClick={onClose}
              className="mt-4 px-8 py-3 text-lg font-bold rounded-full transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${prizeColor}, ${prizeColor}cc)`,
                boxShadow: `0 0 20px ${prizeColor}66`
              }}
            >
              AWESOME! 🎯
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
