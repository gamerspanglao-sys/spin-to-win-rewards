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
  winNumber?: number | null; // null for "See you tomorrow"
}



export const WinnerPopup = ({ isOpen, onClose, playerName, prize, prizeColor, winNumber }: WinnerPopupProps) => {
  const [showContent, setShowContent] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAnimationPhase(0);
      
      // Staged animations
      setTimeout(() => setShowContent(true), 100);
      setTimeout(() => setAnimationPhase(1), 300);
      setTimeout(() => setAnimationPhase(2), 600);
      setTimeout(() => setAnimationPhase(3), 900);
      
      // Multiple confetti bursts
      const fireConfetti = (delay: number, opts: Partial<confetti.Options> = {}) => {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 120,
            origin: { y: 0.5, x: 0.5 },
            colors: [prizeColor, '#FFD700', '#FF1493', '#00FFFF', '#FF6B6B', '#9333EA'],
            ...opts
          });
        }, delay);
      };
      
      fireConfetti(100, { origin: { y: 0.7, x: 0.3 } });
      fireConfetti(300, { origin: { y: 0.7, x: 0.7 } });
      fireConfetti(500, { origin: { y: 0.5, x: 0.5 }, particleCount: 150 });
      fireConfetti(800, { origin: { y: 0.6, x: 0.4 }, spread: 80 });
      fireConfetti(1000, { origin: { y: 0.6, x: 0.6 }, spread: 80 });
    } else {
      setShowContent(false);
      setAnimationPhase(0);
    }
  }, [isOpen, prizeColor]);

  const isRedeemable = winNumber !== null && winNumber !== undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-transparent shadow-none overflow-visible p-0">
        <div 
          className={`relative p-6 md:p-8 rounded-3xl transition-all duration-700 transform ${
            showContent ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-12'
          }`}
          style={{
            background: `linear-gradient(145deg, rgba(15,15,35,0.95), rgba(30,20,50,0.95))`,
            backdropFilter: 'blur(30px)',
            border: `4px solid ${prizeColor}`,
            boxShadow: `
              0 0 80px ${prizeColor}66, 
              0 0 120px ${prizeColor}33,
              inset 0 0 80px ${prizeColor}11,
              0 25px 50px rgba(0,0,0,0.5)
            `
          }}
        >
          {/* Animated corner decorations */}
          <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden">
            <div 
              className="absolute -top-10 -left-10 w-20 h-20 rotate-45"
              style={{ background: `linear-gradient(135deg, ${prizeColor}, transparent)` }}
            />
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
            <div 
              className="absolute -top-10 -right-10 w-20 h-20 -rotate-45"
              style={{ background: `linear-gradient(-135deg, ${prizeColor}, transparent)` }}
            />
          </div>
          
          {/* Floating emojis */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            <span className={`text-5xl transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`} style={{ animationDelay: '0.1s' }}>🎉</span>
            <span className={`text-6xl transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>🏆</span>
            <span className={`text-5xl transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`} style={{ animationDelay: '0.2s' }}>🎉</span>
          </div>
          
          {/* Content */}
          <div className="text-center space-y-4 relative z-10 pt-6">
            {/* Win number badge */}
            {isRedeemable && (
              <div 
                className={`absolute -top-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                  animationPhase >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
                style={{
                  background: `linear-gradient(135deg, #FFD700, #FFA500)`,
                  boxShadow: '0 0 30px #FFD70088, 0 4px 15px rgba(0,0,0,0.3)',
                  border: '3px solid white'
                }}
              >
                <div className="text-center">
                  <div className="text-xs font-bold text-black/70">#</div>
                  <div className="text-xl font-black text-black">{winNumber}</div>
                </div>
              </div>
            )}
            
            <h2 
              className={`text-2xl md:text-3xl font-black tracking-wider transition-all duration-500 ${
                animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                color: '#FFD700',
                textShadow: '0 0 20px #FFD700, 0 0 40px #FFD70066, 0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              🌟 CONGRATULATIONS! 🌟
            </h2>
            
            <div 
              className={`text-3xl md:text-4xl font-extrabold py-2 transition-all duration-500 ${
                animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ 
                color: prizeColor,
                textShadow: `0 0 30px ${prizeColor}, 0 0 60px ${prizeColor}66`
              }}
            >
              {playerName}
            </div>
            
            <div 
              className={`text-lg text-white/80 transition-all duration-300 ${
                animationPhase >= 2 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              You won
            </div>
            
            {/* Prize display */}
            <div 
              className={`text-xl md:text-2xl font-bold py-4 px-6 rounded-2xl mx-auto inline-block transition-all duration-500 ${
                animationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              style={{
                background: `linear-gradient(135deg, ${prizeColor}55, ${prizeColor}88)`,
                border: `3px solid ${prizeColor}`,
                color: '#fff',
                textShadow: '0 2px 15px rgba(0,0,0,0.4)',
                boxShadow: `0 0 30px ${prizeColor}44, inset 0 0 20px ${prizeColor}22`
              }}
            >
              {prize}
            </div>
            
            {/* QR Code section */}
            <div 
              className={`mt-6 transition-all duration-700 ${
                animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="text-sm text-white/70 mb-3">Follow us on Facebook!</div>
              <a 
                href="https://www.facebook.com/gamerspanglao" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block p-4 rounded-xl bg-white hover:scale-105 transition-transform"
                style={{
                  boxShadow: `0 0 30px ${prizeColor}44, 0 10px 30px rgba(0,0,0,0.3)`
                }}
              >
                <div className="w-[120px] h-[120px] flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.facebook.com/gamerspanglao`}
                    alt="Facebook QR Code"
                    className="w-full h-full"
                  />
                </div>
              </a>
              <div className="text-xs text-white/50 mt-2">@gamerspanglao</div>
            </div>
            
            {/* Sparkles */}
            <div className={`flex justify-center gap-3 text-2xl pt-2 ${animationPhase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="animate-spin" style={{ animationDuration: '3s' }}>✨</span>
              <span className="animate-bounce">⭐</span>
              <span className="animate-pulse">💫</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>⭐</span>
              <span className="animate-spin" style={{ animationDuration: '2s' }}>✨</span>
            </div>
            
            <Button
              onClick={onClose}
              className={`mt-4 px-10 py-4 text-lg font-bold rounded-full transition-all duration-300 hover:scale-110 ${
                animationPhase >= 3 ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: `linear-gradient(135deg, ${prizeColor}, ${prizeColor}aa)`,
                boxShadow: `0 0 30px ${prizeColor}66, 0 5px 20px rgba(0,0,0,0.3)`,
                border: '2px solid rgba(255,255,255,0.3)'
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
