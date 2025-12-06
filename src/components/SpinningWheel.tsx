import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface WheelSector {
  label: string;
  color: string;
  weight?: number;
}

interface SpinningWheelProps {
  sectors: WheelSector[];
  onSpinEnd: (winnerIndex: number) => void;
  onTick?: () => void;
}

export interface SpinningWheelRef {
  spin: () => void;
  highlightWinner: (index: number) => void;
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
  ({ sectors, onSpinEnd, onTick }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef(0);
    const isSpinningRef = useRef(false);
    const winnerIndexRef = useRef<number | null>(null);
    const lastSectorRef = useRef<number>(-1);
    const highlightAnimationRef = useRef<number>(0);

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
      
      // Calculate highlight pulse for winner
      const highlightPulse = winnerIndexRef.current !== null 
        ? 0.3 + Math.sin(highlightAnimationRef.current * 0.1) * 0.2 
        : 0;

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
        
        // Highlight winner sector with glow
        if (winnerIndexRef.current === i) {
          ctx.shadowColor = 'rgba(255, 215, 0, ' + highlightPulse + ')';
          ctx.shadowBlur = 30;
          ctx.fillStyle = sector.color || COLORS[i % COLORS.length];
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Golden overlay
          ctx.fillStyle = 'rgba(255, 215, 0, ' + (highlightPulse * 0.3) + ')';
          ctx.fill();
        }

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
      
      // Draw winner marker at TOP (fixed position pointing down)
      ctx.save();
      ctx.translate(centerX, centerY);
      
      const markerY = -(radius + 15);
      
      // Glow effect
      ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
      ctx.shadowBlur = 25;
      
      // Diamond/gem shape marker
      ctx.beginPath();
      ctx.moveTo(0, markerY - 35); // Top point
      ctx.lineTo(20, markerY - 15); // Right
      ctx.lineTo(0, markerY + 10); // Bottom point (pointing to wheel)
      ctx.lineTo(-20, markerY - 15); // Left
      ctx.closePath();
      
      // Gradient fill
      const markerGradient = ctx.createLinearGradient(-20, markerY - 35, 20, markerY + 10);
      markerGradient.addColorStop(0, '#FFD700');
      markerGradient.addColorStop(0.5, '#FFA500');
      markerGradient.addColorStop(1, '#FF6B6B');
      ctx.fillStyle = markerGradient;
      ctx.fill();
      
      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Inner shine
      ctx.beginPath();
      ctx.moveTo(0, markerY - 30);
      ctx.lineTo(12, markerY - 15);
      ctx.lineTo(0, markerY);
      ctx.lineTo(-12, markerY - 15);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      
      // Animated sparkle at tip
      const sparkleSize = 3 + Math.sin(Date.now() * 0.01) * 2;
      ctx.beginPath();
      ctx.arc(0, markerY + 10, sparkleSize, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fill();
      
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
      
      // Animation loop for winner highlight
      let animationFrame: number;
      const animate = () => {
        if (winnerIndexRef.current !== null) {
          highlightAnimationRef.current += 1;
          drawWheel(rotationRef.current);
        }
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrame);
      };
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
      winnerIndexRef.current = null; // Clear previous winner highlight

      // Random duration between 10-25 seconds
      const duration = 10000 + Math.random() * 15000;
      
      // Weighted random winner selection
      const winnerIndex = weightedPickIndex();
      
      // Calculate target rotation
      const anglePerSector = (2 * Math.PI) / sectors.length;
      const winnerAngle = winnerIndex * anglePerSector + anglePerSector / 2;
      
      // Always spin forward by adding extra full rotations to current position
      const extraRotations = Math.PI * 2 * (8 + Math.floor(Math.random() * 5)); // 8-12 full rotations
      const targetAngle = -Math.PI / 2 - winnerAngle; // Where we want to stop
      
      // Normalize target to be ahead of current rotation
      const currentNormalized = rotationRef.current % (Math.PI * 2);
      const targetRotation = rotationRef.current + extraRotations + (targetAngle - currentNormalized);
      
      const startRotation = rotationRef.current;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        rotationRef.current = startRotation + (targetRotation - startRotation) * easedProgress;
        drawWheel(rotationRef.current);
        
        // Calculate current sector for tick sound
        const anglePerSector = (2 * Math.PI) / sectors.length;
        const normalizedRotation = ((rotationRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointerAngle = Math.PI / 2; // Top of wheel
        const adjustedAngle = (pointerAngle - normalizedRotation + Math.PI * 2) % (Math.PI * 2);
        const currentSector = Math.floor(adjustedAngle / anglePerSector) % sectors.length;
        
        // Play tick when crossing sector boundary
        if (currentSector !== lastSectorRef.current && progress < 0.95) {
          lastSectorRef.current = currentSector;
          onTick?.();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Spin complete
          isSpinningRef.current = false;
          winnerIndexRef.current = winnerIndex;
          highlightAnimationRef.current = 0;
          
          onSpinEnd(winnerIndex);
        }
      };

      requestAnimationFrame(animate);
    };

    const highlightWinner = (index: number) => {
      winnerIndexRef.current = index;
      highlightAnimationRef.current = 0;
    };

    useImperativeHandle(ref, () => ({
      spin,
      highlightWinner,
    }));

    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    );
  }
);

SpinningWheel.displayName = 'SpinningWheel';
