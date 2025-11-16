import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PurchaseInputProps {
  onEligible: () => void;
}

export const PurchaseInput = ({ onEligible }: PurchaseInputProps) => {
  const [amount, setAmount] = useState("");
  const [isEligible, setIsEligible] = useState(false);

  const handleCheck = () => {
    const numAmount = parseFloat(amount);
    if (numAmount >= 700) {
      setIsEligible(true);
      onEligible();
    }
  };

  return (
    <Card className="p-8 bg-card border-2 border-border backdrop-blur-sm">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary text-glow">
            Purchase Verification
          </h2>
          <p className="text-muted-foreground">
            Enter your purchase amount to unlock the spin wheel!
          </p>
          <p className="text-sm text-secondary font-semibold">
            Minimum: ₱700
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">
              ₱
            </span>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 h-14 text-lg bg-input border-2 border-border focus:border-primary transition-all"
              disabled={isEligible}
            />
          </div>

          <Button
            onClick={handleCheck}
            disabled={isEligible || !amount || parseFloat(amount) < 700}
            className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform glow-cyan disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isEligible ? "✓ Verified! Spin Below" : "Verify Purchase"}
          </Button>

          {amount && parseFloat(amount) < 700 && (
            <p className="text-destructive text-sm text-center">
              Purchase amount must be at least ₱700
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
