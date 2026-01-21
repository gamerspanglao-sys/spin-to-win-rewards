import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";

interface WinnerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  prize: string;
  prizeColor: string;
}

const FACEBOOK_URL = "https://www.facebook.com/gamerspanglao";

export const WinnerPopup = ({ isOpen, onClose, playerName, prize, prizeColor }: WinnerPopupProps) => {
  const [showContent, setShowContent] = useState(false);
  const [step, setStep] = useState<'subscribe' | 'prize'>('subscribe');

  useEffect(() => {
    if (isOpen) {
      setStep('subscribe');
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
      setStep('subscribe');
    }
  }, [isOpen]);

  const handleSubscribed = () => {
    setStep('prize');
    
    // Confetti when revealing prize
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none overflow-visible">
        <div 
          className={`relative p-8 rounded-3xl transition-all duration-500 transform ${
            showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          style={{
            background: step === 'subscribe' 
              ? 'linear-gradient(135deg, #1877F222, #1877F244)' 
              : `linear-gradient(135deg, ${prizeColor}22, ${prizeColor}44)`,
            backdropFilter: 'blur(20px)',
            border: step === 'subscribe' 
              ? '3px solid #1877F2' 
              : `3px solid ${prizeColor}`,
            boxShadow: step === 'subscribe'
              ? '0 0 60px #1877F266, inset 0 0 60px #1877F222'
              : `0 0 60px ${prizeColor}66, inset 0 0 60px ${prizeColor}22`
          }}
        >
          {/* Animated glow rings */}
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{ 
              boxShadow: step === 'subscribe' 
                ? '0 0 40px #1877F288' 
                : `0 0 40px ${prizeColor}88`,
            }}
          />
          
          {step === 'subscribe' ? (
            /* Step 1: Subscribe to Facebook */
            <div className="text-center space-y-4 relative z-10">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <span className="text-5xl animate-bounce">🎁</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white/90 tracking-wide pt-4">
                ВЫ ВЫИГРАЛИ!
              </h2>
              
              <p className="text-white/80 text-lg">
                Подпишитесь на нашу группу,<br/>чтобы увидеть приз!
              </p>
              
              {/* QR Code */}
              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-lg">
                <QRCodeSVG 
                  value={FACEBOOK_URL}
                  size={150}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#1877F2"
                />
              </div>
              
              <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                <span>📱</span>
                <span>Сканируйте QR или нажмите кнопку</span>
              </div>
              
              <div className="space-y-2">
                <a 
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <Button
                    className="w-full px-6 py-3 text-lg font-bold rounded-full transition-all hover:scale-105"
                    style={{
                      background: '#1877F2',
                      boxShadow: '0 0 20px #1877F266'
                    }}
                  >
                    📘 Открыть Facebook
                  </Button>
                </a>
                
                <Button
                  onClick={handleSubscribed}
                  className="w-full px-6 py-3 text-lg font-bold rounded-full transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{
                    boxShadow: '0 0 20px #10B98166'
                  }}
                >
                  ✅ Я подписался! Показать приз
                </Button>
              </div>
            </div>
          ) : (
            /* Step 2: Show Prize */
            <div className="text-center space-y-4 relative z-10 pt-4">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <span className="text-5xl animate-bounce">🎉</span>
              </div>
              
              <h2 className="text-2xl font-bold text-white/90 tracking-wide">
                ПОЗДРАВЛЯЕМ!
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
                Вы выиграли
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
                СУПЕР! 🎯
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
