import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Camera } from "lucide-react";
import { Voucher, formatExpiryDate } from "@/lib/vouchers";
import { toast } from "sonner";

interface VoucherDisplayProps {
  voucher: Voucher;
  onClose: () => void;
}

export const VoucherDisplay = ({ voucher, onClose }: VoucherDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Format code with spaces for readability
  const formattedCode = voucher.code.split('').join(' ');

  return (
    <div className="text-center space-y-4 relative z-10 pt-4">
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <span className="text-5xl">🎫</span>
      </div>
      
      <h2 className="text-xl font-bold text-white/90 tracking-wide">
        YOUR PRIZE VOUCHER
      </h2>
      
      {/* Voucher Code - Large and prominent */}
      <div 
        className="py-4 px-6 rounded-2xl mx-auto inline-block"
        style={{
          background: `linear-gradient(135deg, ${voucher.prize.color}33, ${voucher.prize.color}55)`,
          border: `3px dashed ${voucher.prize.color}`,
        }}
      >
        <div 
          className="text-3xl md:text-4xl font-mono font-extrabold tracking-[0.3em]"
          style={{ 
            color: voucher.prize.color,
            textShadow: `0 0 20px ${voucher.prize.color}66`
          }}
        >
          {formattedCode}
        </div>
      </div>

      {/* Prize Info */}
      <div className="space-y-2 text-white/80">
        <div className="text-lg">
          <span className="text-white/60">Player:</span>{" "}
          <span className="font-semibold text-white">{voucher.playerName}</span>
        </div>
        <div className="text-lg">
          <span className="text-white/60">Prize:</span>{" "}
          <span 
            className="font-semibold"
            style={{ color: voucher.prize.color }}
          >
            {voucher.prize.label}
          </span>
        </div>
        <div className="text-sm text-white/60">
          Valid until: {formatExpiryDate(voucher.expiresAt)}
        </div>
      </div>

      {/* Screenshot reminder */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white/10 mx-auto w-fit">
        <Camera className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-yellow-400 font-medium">
          Take a screenshot!
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center pt-2">
        <Button
          onClick={handleCopyCode}
          variant="outline"
          className="px-6 py-3 text-base font-semibold rounded-full border-2 bg-white/10 hover:bg-white/20 transition-all"
          style={{ borderColor: voucher.prize.color }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>
        
        <Button
          onClick={onClose}
          className="px-6 py-3 text-base font-bold rounded-full transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${voucher.prize.color}, ${voucher.prize.color}cc)`,
            boxShadow: `0 0 20px ${voucher.prize.color}66`
          }}
        >
          Done! ✓
        </Button>
      </div>
    </div>
  );
};
