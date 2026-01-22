import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { VoucherDisplay } from "./VoucherDisplay";
import { createVoucher, saveVoucher, shouldGenerateVoucher, Voucher } from "@/lib/vouchers";

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
  const [step, setStep] = useState<'subscribe' | 'prize' | 'voucher'>('subscribe');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setStep('subscribe');
      setVoucher(null);
      setCountdown(5);
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
      setStep('subscribe');
      setVoucher(null);
      setCountdown(5);
    }
  }, [isOpen]);

  // Countdown timer for subscribe button
  useEffect(() => {
    if (isOpen && step === 'subscribe' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, countdown]);

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

  const handleShowVoucher = () => {
    // Generate and save voucher
    const newVoucher = createVoucher(playerName, prize, prizeColor);
    saveVoucher(newVoucher);
    setVoucher(newVoucher);
    setStep('voucher');
  };

  const handleClose = () => {
    onClose();
  };

  // Check if this prize should get a voucher
  const hasVoucher = shouldGenerateVoucher(prize);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none overflow-visible">
        <div 
          className={`relative p-8 rounded-3xl transition-all duration-500 transform ${
            showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          } animate-scale-in`}
          style={{
            background: step === 'subscribe' 
              ? 'linear-gradient(135deg, rgba(24, 119, 242, 0.15), rgba(24, 119, 242, 0.25))' 
              : `linear-gradient(135deg, ${prizeColor}22, ${prizeColor}44)`,
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: step === 'subscribe' 
              ? '3px solid #1877F2' 
              : `3px solid ${prizeColor}`,
            boxShadow: step === 'subscribe'
              ? '0 0 80px #1877F288, 0 0 120px #1877F244, inset 0 0 60px #1877F222'
              : `0 0 80px ${prizeColor}88, 0 0 120px ${prizeColor}44, inset 0 0 60px ${prizeColor}22`
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
                YOU WON!
              </h2>
              
              <p className="text-white/80 text-lg">
                Follow our page<br/>to see your prize!
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
                <span>Scan the QR code to follow us</span>
              </div>
              
              <Button
                onClick={handleSubscribed}
                disabled={countdown > 0}
                className="w-full px-6 py-3 text-lg font-bold rounded-full transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  boxShadow: countdown > 0 ? 'none' : '0 0 20px #10B98166'
                }}
              >
                {countdown > 0 ? `⏳ Wait ${countdown}s...` : '✅ I followed! Show my prize'}
              </Button>
            </div>
          ) : step === 'prize' ? (
            /* Step 2: Show Prize */
            <div className="text-center space-y-4 relative z-10 pt-4">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <span className="text-5xl animate-bounce">🎉</span>
              </div>
              
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
                onClick={hasVoucher ? handleShowVoucher : handleClose}
                className="mt-4 px-8 py-3 text-lg font-bold rounded-full transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${prizeColor}, ${prizeColor}cc)`,
                  boxShadow: `0 0 20px ${prizeColor}66`
                }}
              >
                {hasVoucher ? '🎫 GET VOUCHER' : 'AWESOME! 🎯'}
              </Button>
            </div>
          ) : (
            /* Step 3: Voucher Display */
            voucher && (
              <VoucherDisplay voucher={voucher} onClose={handleClose} />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
