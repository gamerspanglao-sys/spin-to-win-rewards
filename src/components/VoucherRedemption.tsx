import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Check, X, AlertCircle } from "lucide-react";
import { findVoucherByCode, isVoucherValid, redeemVoucher, formatExpiryDate, Voucher } from "@/lib/vouchers";
import { toast } from "sonner";

interface VoucherRedemptionProps {
  className?: string;
}

export const VoucherRedemption = ({ className }: VoucherRedemptionProps) => {
  const [code, setCode] = useState("");
  const [checkedVoucher, setCheckedVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = () => {
    const trimmedCode = code.trim().toUpperCase().replace(/\s/g, '');
    
    if (trimmedCode.length !== 4) {
      setError("Code must be 4 characters");
      setCheckedVoucher(null);
      return;
    }

    const voucher = findVoucherByCode(trimmedCode);
    
    if (!voucher) {
      setError("Voucher not found");
      setCheckedVoucher(null);
      return;
    }

    setCheckedVoucher(voucher);
    setError(null);
  };

  const handleRedeem = () => {
    if (!checkedVoucher) return;

    const result = redeemVoucher(checkedVoucher.code);
    
    if (result.success) {
      toast.success(`Voucher redeemed! Prize: ${checkedVoucher.prize.label}`);
      setCode("");
      setCheckedVoucher(null);
    } else {
      toast.error(result.error || "Failed to redeem");
      if (result.voucher) {
        setCheckedVoucher(result.voucher);
      }
    }
  };

  const handleClear = () => {
    setCode("");
    setCheckedVoucher(null);
    setError(null);
  };

  const getStatusColor = () => {
    if (!checkedVoucher) return 'border-border';
    if (checkedVoucher.redeemed) return 'border-yellow-500';
    if (!isVoucherValid(checkedVoucher)) return 'border-destructive';
    return 'border-green-500';
  };

  const getStatusBg = () => {
    if (!checkedVoucher) return 'bg-muted/30';
    if (checkedVoucher.redeemed) return 'bg-yellow-500/10';
    if (!isVoucherValid(checkedVoucher)) return 'bg-destructive/10';
    return 'bg-green-500/10';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <Ticket className="w-4 h-4" />
        <span>Redeem Voucher</span>
      </div>

      {/* Code Input */}
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
            setCheckedVoucher(null);
          }}
          placeholder="XXXX"
          className="flex-1 h-10 bg-input border-border font-mono tracking-wider uppercase"
          maxLength={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="voucher-code-field"
        />
        <Button
          onClick={handleCheck}
          variant="outline"
          size="sm"
          className="h-10 px-4"
          disabled={code.trim().length < 4}
        >
          Check
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Voucher Details */}
      {checkedVoucher && (
        <div className={`p-4 rounded-xl border-2 ${getStatusColor()} ${getStatusBg()} space-y-3`}>
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span 
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{
                backgroundColor: checkedVoucher.redeemed 
                  ? 'rgb(234 179 8 / 0.2)' 
                  : isVoucherValid(checkedVoucher) 
                    ? 'rgb(34 197 94 / 0.2)' 
                    : 'rgb(239 68 68 / 0.2)',
                color: checkedVoucher.redeemed 
                  ? 'rgb(234 179 8)' 
                  : isVoucherValid(checkedVoucher) 
                    ? 'rgb(34 197 94)' 
                    : 'rgb(239 68 68)'
              }}
            >
              {checkedVoucher.redeemed ? '⚠️ ALREADY USED' : isVoucherValid(checkedVoucher) ? '✓ VALID' : '✕ EXPIRED'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <Label className="text-muted-foreground">Code:</Label>
              <span className="font-mono font-bold">{checkedVoucher.code}</span>
            </div>
            <div className="flex justify-between">
              <Label className="text-muted-foreground">Player:</Label>
              <span className="font-semibold">{checkedVoucher.playerName}</span>
            </div>
            <div className="flex justify-between">
              <Label className="text-muted-foreground">Prize:</Label>
              <span 
                className="font-semibold"
                style={{ color: checkedVoucher.prize.color }}
              >
                {checkedVoucher.prize.label}
              </span>
            </div>
            <div className="flex justify-between">
              <Label className="text-muted-foreground">Expires:</Label>
              <span className={checkedVoucher.expiresAt < Date.now() ? 'text-destructive' : ''}>
                {formatExpiryDate(checkedVoucher.expiresAt)}
              </span>
            </div>
            {checkedVoucher.redeemed && checkedVoucher.redeemedAt && (
              <div className="flex justify-between">
                <Label className="text-muted-foreground">Redeemed:</Label>
                <span className="text-yellow-500">
                  {formatExpiryDate(checkedVoucher.redeemedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Redeem Button */}
          {isVoucherValid(checkedVoucher) && !checkedVoucher.redeemed && (
            <Button
              onClick={handleRedeem}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Redeemed
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
