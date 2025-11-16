import { useEffect, useRef } from "react";

export interface Prize {
  label: string;
  weight: number;
  repeat?: number;
}

interface Sector {
  label: string;
  weight: number;
  index: number;
  eqStart: number;
  eqEnd: number;
  eqMid: number;
}

interface PrizeWheelProps {
  prizes: Prize[];
  onLanded: (prize: string) => void;
  isSpinning: boolean;
}

const PALETTE = [
  '#ff3b3b', '#ffcc00', '#00c8ff', '#9b59ff', 
  '#00e676', '#ff6bcb', '#ff8a00', '#00bfa5', 
  '#ffd6a5', '#6be6ff'
];

export const PrizeWheel = ({ prizes, onLanded, isSpinning }: PrizeWheelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectorsRef = useRef<Sector[]>([]);
  const rotationRef = useRef(0);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Initialize sectors
  useEffect(() => {
    let sectors: Sector[] = [];
    prizes.forEach(p => {
      const repeats = p.repeat || 1;
      const part = p.weight / repeats;
      for (let i = 0; i < repeats; i++) {
        sectors.push({ label: p.label, weight: part, index: 0, eqStart: 0, eqEnd: 0, eqMid: 0 });
      }
    });

    // Shuffle avoiding adjacent "See you tomorrow"
    sectors = shuffleAvoidAdj(sectors);

    // Compute equal angles
    const totalSectors = sectors.length;
    sectors.forEach((s, i) => {
      s.index = i;
      s.eqStart = (i / totalSectors) * Math.PI * 2;
      s.eqEnd = ((i + 1) / totalSectors) * Math.PI * 2;
      s.eqMid = (s.eqStart + s.eqEnd) / 2;
    });

    sectorsRef.current = sectors;
    drawWheel(0);
  }, [prizes]);

  const shuffleAvoidAdj = (arr: Sector[]): Sector[] => {
    let tries = 0;
    while (tries < 400) {
      const a = [...arr].sort(() => Math.random() - 0.5);
      let ok = true;
      for (let i = 0; i < a.length; i++) {
        const nxt = a[(i + 1) % a.length];
        if (a[i].label.includes('See you') && nxt.label.includes('See you')) {
          ok = false;
          break;
        }
      }
      if (ok) return a;
      tries++;
    }
    return arr;
  };

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    const count = sectorsRef.current.length;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const start = i * angleStep;
      const end = start + angleStep;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();

      // Draw text
      const mid = start + angleStep / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.rotate(-mid);
      ctx.translate(r * 0.72, 0);

      const text = sectorsRef.current[i].label;
      wrapText(ctx, text, 0, 0, r * 0.9, 32);

      ctx.restore();
      ctx.restore();
    }

    // Outer rim
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();

    // Center disc
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.restore();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? ' ' : '') + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = words[n];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    const totalH = lines.length * lineHeight;
    let startY = y - totalH / 2 + lineHeight / 2;
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
  };

  const fitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  };

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', () => {
      fitCanvas();
      drawWheel(rotationRef.current);
    });
    return () => window.removeEventListener('resize', fitCanvas);
  }, []);

  const weightedPickIndex = (): number => {
    const sectors = sectorsRef.current;
    const tot = sectors.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * tot;
    let acc = 0;
    for (let i = 0; i < sectors.length; i++) {
      acc += sectors[i].weight;
      if (r <= acc) return i;
    }
    return sectors.length - 1;
  };

  const spinToIndex = (idx: number): number => {
    const targetMid = sectorsRef.current[idx].eqMid;
    const desired = -targetMid;
    const normalized = ((desired % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const extra = (Math.floor(Math.random() * 6) + 5) * Math.PI * 2;
    return normalized + extra;
  };

  const easeOut = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  const animateTo = async (finalRot: number, duration: number = 8000) => {
    const start = performance.now();
    const from = rotationRef.current;
    
    return new Promise<void>(res => {
      const f = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const v = from + (finalRot - from) * easeOut(t);
        rotationRef.current = v;
        drawWheel(rotationRef.current);
        if (t < 1) requestAnimationFrame(f);
        else res();
      };
      requestAnimationFrame(f);
    });
  };

  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  useEffect(() => {
    const spin = async () => {
      if (!isSpinning) return;

      const idx = weightedPickIndex();
      const final = spinToIndex(idx);
      const duration = Math.floor(rand(7000, 20000));
      
      if (arrowRef.current) {
        arrowRef.current.classList.remove('bounce');
      }
      
      await animateTo(final, duration);
      
      if (arrowRef.current) {
        void arrowRef.current.offsetWidth;
        arrowRef.current.classList.add('bounce');
      }

      const prize = sectorsRef.current[idx].label;
      onLanded(prize);
    };

    if (isSpinning) {
      spin();
    }
  }, [isSpinning]);

  return (
    <div className="relative w-[78vmin] h-[78vmin] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width="1000"
        height="1000"
        className="w-full h-full rounded-full shadow-2xl"
      />
      <div
        ref={arrowRef}
        className="absolute right-[4%] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[26px] border-t-transparent border-b-[26px] border-b-transparent border-l-[40px] border-l-primary z-10 glow-cyan"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))' }}
      />
    </div>
  );
};
