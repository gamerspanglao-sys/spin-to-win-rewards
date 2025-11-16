import { useState, useRef } from "react";

interface Prize {
  id: number;
  name: string;
  color: string;
  textColor: string;
}

const prizes: Prize[] = [
  { id: 1, name: "Free Game", color: "hsl(var(--primary))", textColor: "hsl(var(--primary-foreground))" },
  { id: 2, name: "20% OFF", color: "hsl(var(--secondary))", textColor: "hsl(var(--secondary-foreground))" },
  { id: 3, name: "Free Drink", color: "hsl(var(--accent))", textColor: "hsl(var(--accent-foreground))" },
  { id: 4, name: "10% OFF", color: "hsl(var(--primary))", textColor: "hsl(var(--primary-foreground))" },
  { id: 5, name: "Free Snack", color: "hsl(var(--secondary))", textColor: "hsl(var(--secondary-foreground))" },
  { id: 6, name: "30% OFF", color: "hsl(var(--accent))", textColor: "hsl(var(--accent-foreground))" },
  { id: 7, name: "2 Free Games", color: "hsl(var(--primary))", textColor: "hsl(var(--primary-foreground))" },
  { id: 8, name: "15% OFF", color: "hsl(var(--secondary))", textColor: "hsl(var(--secondary-foreground))" },
];

interface SpinWheelProps {
  onWin: (prize: Prize) => void;
}

export const SpinWheel = ({ onWin }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const randomDegree = Math.floor(Math.random() * 360) + 1800; // At least 5 full rotations
    const finalRotation = rotation + randomDegree;
    setRotation(finalRotation);

    setTimeout(() => {
      const normalizedRotation = finalRotation % 360;
      const segmentAngle = 360 / prizes.length;
      const winningIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % prizes.length;
      const winningPrize = prizes[winningIndex];
      
      setIsSpinning(false);
      onWin(winningPrize);
    }, 4000);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary glow-cyan" />
      </div>

      {/* Wheel Container */}
      <div className="relative w-[400px] h-[400px] rounded-full glow-cyan border-4 border-primary overflow-hidden">
        <div
          ref={wheelRef}
          className="w-full h-full relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-4 border-primary z-10 glow-cyan flex items-center justify-center">
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className="w-full h-full rounded-full bg-primary text-primary-foreground font-bold text-sm hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SPIN
            </button>
          </div>

          {/* Prize segments */}
          {prizes.map((prize, index) => {
            const rotation = segmentAngle * index;
            return (
              <div
                key={prize.id}
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((0 * Math.PI) / 180)}% ${
                    50 + 50 * Math.sin((0 * Math.PI) / 180)
                  }%, ${50 + 50 * Math.cos((segmentAngle * Math.PI) / 180)}% ${
                    50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)
                  }%)`,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: prize.color }}
                >
                  <div
                    className="absolute top-[30%] left-1/2 -translate-x-1/2 font-bold text-sm whitespace-nowrap"
                    style={{
                      transform: `translateX(-50%) rotate(${segmentAngle / 2}deg)`,
                      color: prize.textColor,
                    }}
                  >
                    {prize.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
