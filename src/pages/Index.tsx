import { useState } from "react";
import { SpinWheel } from "@/components/SpinWheel";
import { PurchaseInput } from "@/components/PurchaseInput";
import { WinnerModal } from "@/components/WinnerModal";
import { Gamepad2 } from "lucide-react";

interface Prize {
  name: string;
}

const Index = () => {
  const [isEligible, setIsEligible] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleWin = (prize: Prize) => {
    setWinningPrize(prize);
    setShowModal(true);
  };

  const handleReset = () => {
    setShowModal(false);
    setIsEligible(false);
    setWinningPrize(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-12">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Gamepad2 className="w-16 h-16 text-primary animate-pulse-glow" />
          <h1 className="text-6xl font-bold text-primary text-glow">
            Prize Wheel
          </h1>
          <Gamepad2 className="w-16 h-16 text-secondary animate-pulse-glow" />
        </div>
        <p className="text-xl text-foreground max-w-2xl">
          Purchase ₱700 or more and spin the wheel for amazing rewards!
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12 w-full max-w-4xl">
        {!isEligible ? (
          <div className="w-full max-w-md animate-scale-in">
            <PurchaseInput onEligible={() => setIsEligible(true)} />
          </div>
        ) : (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary text-glow mb-2">
                You're Eligible! 🎮
              </p>
              <p className="text-muted-foreground">
                Click the center button to spin!
              </p>
            </div>
            <SpinWheel onWin={handleWin} />
          </div>
        )}
      </div>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={showModal}
        onClose={handleReset}
        prize={winningPrize}
      />

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm">
        <p>Video Gaming Bar • Rewards Program</p>
      </div>
    </div>
  );
};

export default Index;
