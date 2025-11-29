import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface WheelSector {
  label: string;
  color: string;
  weight?: number;
}

interface SpinningWheelProps {
  sectors: WheelSector[];
  onSpinEnd: (winnerIndex: number) => void;
}

export interface SpinningWheelRef {
  spin: () => void;
}

const COLORS = [
  '#A855F7', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#F97316', // orange
  '#EF4444', // red
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#84CC16', // lime
];

export const SpinningWheel = forwardRef<SpinningWheelRef, SpinningWheelProps>(
  ({ sectors, onSpinEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef(0);
    const isSpinningRef = useRef(false);
    const arrowRef = useRef<HTMLDivElement>(null);

    const drawWheel = (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      const anglePerSector = (2 * Math.PI) / sectors.length;

      // Draw sectors
      sectors.forEach((sector, i) => {
        const startAngle = i * anglePerSector;
        const endAngle = startAngle + anglePerSector;
        const midAngle = startAngle + anglePerSector / 2;

        // Draw sector
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = sector.color || COLORS[i % COLORS.length];
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text horizontally from center to edge
        ctx.save();
        ctx.rotate(midAngle);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';

        // Position text starting from center, running outward
        const textX = radius * 0.25; // Start text 25% from center
        const maxWidth = radius * 0.6; // Allow text to extend to 85% of radius

        // Wrap text if needed
        const words = sector.label.split(' ');
        let line = '';
        const lines: string[] = [];
        
        words.forEach(word => {
          const testLine = line + (line ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        });
        if (line) lines.push(line);

        // Draw lines
        const lineHeight = 24;
        const totalHeight = lines.length * lineHeight;
        let startY = -totalHeight / 2 + lineHeight / 2;

        lines.forEach((textLine, idx) => {
          ctx.fillText(textLine, textX, startY + idx * lineHeight);
        });

        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e1e1e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw outer rim glow
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.restore();
    };

    const fitCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const size = Math.min(container.clientWidth, container.clientHeight);
      const ratio = window.devicePixelRatio || 1;

      canvas.width = size * ratio;
      canvas.height = size * ratio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
    };

    useEffect(() => {
      fitCanvas();
      drawWheel(0);

      const handleResize = () => {
        fitCanvas();
        drawWheel(rotationRef.current);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [sectors]);

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const weightedPickIndex = (): number => {
      const totalWeight = sectors.reduce((sum, sector) => sum + (sector.weight || 1), 0);
      let random = Math.random() * totalWeight;
      
      for (let i = 0; i < sectors.length; i++) {
        random -= (sectors[i].weight || 1);
        if (random <= 0) return i;
      }
      
      return sectors.length - 1;
    };

    const spin = async () => {
      if (isSpinningRef.current) return;
      isSpinningRef.current = true;

      // Random duration between 7-20 seconds
      const duration = 7000 + Math.random() * 13000;
      
      // Weighted random winner selection
      const winnerIndex = weightedPickIndex();
      
      // Calculate target rotation
      const anglePerSector = (2 * Math.PI) / sectors.length;
      const winnerAngle = winnerIndex * anglePerSector + anglePerSector / 2;
      
      // We want the arrow (at 0 radians, pointing right) to point to the winner
      // So we rotate the wheel so the winner sector's center is at 0
      const targetRotation = -winnerAngle + Math.PI * 2 * (5 + Math.floor(Math.random() * 5)); // 5-10 full rotations
      
      const startRotation = rotationRef.current;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        rotationRef.current = startRotation + (targetRotation - startRotation) * easedProgress;
        drawWheel(rotationRef.current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Spin complete
          isSpinningRef.current = false;
          
          // Trigger arrow bounce
          if (arrowRef.current) {
            arrowRef.current.classList.remove('arrow-bounce');
            void arrowRef.current.offsetWidth; // Force reflow
            arrowRef.current.classList.add('arrow-bounce');
          }

          onSpinEnd(winnerIndex);
        }
      };

      requestAnimationFrame(animate);
    };

    useImperativeHandle(ref, () => ({
      spin,
    }));

    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="relative w-full h-full max-w-full max-h-full aspect-square">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
          
          {/* Яркая стрелка-указатель справа */}
          <div
            ref={arrowRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[20px] z-20"
          >
            <div className="relative flex items-center gap-2">
              {/* Светящаяся точка */}
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse-glow neon-glow-purple shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
              
              {/* Большая треугольная стрелка */}
              <div className="relative">
                <div className="w-0 h-0 border-t-[35px] border-t-transparent border-b-[35px] border-b-transparent border-r-[50px] border-r-primary neon-glow-purple shadow-[0_0_30px_rgba(168,85,247,0.6)]" 
                     style={{ filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.9))' }}
                />
                {/* Внутренняя светящаяся линия */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45px] h-[3px] bg-gradient-to-r from-white to-transparent opacity-70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SpinningWheel.displayName = 'SpinningWheel';
