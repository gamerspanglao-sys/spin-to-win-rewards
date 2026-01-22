import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, Plus, Trash2, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { VoucherRedemption } from "./VoucherRedemption";
import { Separator } from "@/components/ui/separator";
import { 
  getLoyverseToken, 
  setLoyverseToken, 
  testLoyverseConnection,
  clearCustomerCache 
} from "@/lib/loyverse";

export interface Prize {
  label: string;
  weight: number;
  color: string;
  repeat?: number;
}

interface PrizeEditorProps {
  prizes: Prize[];
  onPrizesChange: (prizes: Prize[]) => void;
  defaultPrizes: Prize[];
}

const PRESET_COLORS = [
  '#A855F7', '#EC4899', '#06B6D4', '#3B82F6', 
  '#10B981', '#F59E0B', '#F97316', '#EF4444', 
  '#8B5CF6', '#14B8A6', '#F43F5E', '#84CC16'
];

export const PrizeEditor = ({ prizes, onPrizesChange, defaultPrizes }: PrizeEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPrizes, setEditingPrizes] = useState<Prize[]>(prizes);
  const [loyverseToken, setLoyverseTokenState] = useState<string | null>(getLoyverseToken());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleOpen = (open: boolean) => {
    if (open) {
      setEditingPrizes([...prizes]);
      // Загружаем токен при открытии
      setLoyverseTokenState(getLoyverseToken());
    }
    setIsOpen(open);
  };

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    const updated = [...editingPrizes];
    if (field === 'weight' || field === 'repeat') {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditingPrizes(updated);
  };

  const addPrize = () => {
    const newPrize: Prize = {
      label: "New Prize",
      weight: 5,
      color: PRESET_COLORS[editingPrizes.length % PRESET_COLORS.length],
      repeat: 1
    };
    setEditingPrizes([...editingPrizes, newPrize]);
  };

  const removePrize = (index: number) => {
    if (editingPrizes.length <= 2) {
      toast.error("Minimum 2 prizes required");
      return;
    }
    setEditingPrizes(editingPrizes.filter((_, i) => i !== index));
  };

  const resetToDefaults = () => {
    setEditingPrizes([...defaultPrizes]);
    toast.success("Reset to default prizes");
  };

  const handleSave = () => {
    // Validate
    const hasEmpty = editingPrizes.some(p => !p.label.trim());
    if (hasEmpty) {
      toast.error("All prizes must have a name");
      return;
    }

    const totalWeight = editingPrizes.reduce((sum, p) => sum + p.weight * (p.repeat || 1), 0);
    if (totalWeight <= 0) {
      toast.error("Total weight must be greater than 0");
      return;
    }

    onPrizesChange(editingPrizes);
    setIsOpen(false);
    toast.success("Prizes saved!");
  };

  const getTotalWeight = () => {
    return editingPrizes.reduce((sum, p) => sum + p.weight * (p.repeat || 1), 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-2 border-primary/30 hover:border-primary transition-all h-11 w-11"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-l border-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Prize Editor
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={addPrize}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Prize
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Total weight display */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
            Total Weight: <span className="font-semibold text-foreground">{getTotalWeight().toFixed(2)}</span>
          </div>

          {/* Prize list */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {editingPrizes.map((prize, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border border-border bg-background/50 space-y-3"
                style={{ borderLeftColor: prize.color, borderLeftWidth: 4 }}
              >
                {/* Name */}
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={prize.label}
                    onChange={(e) => updatePrize(index, 'label', e.target.value)}
                    className="h-9 bg-input border-border"
                    placeholder="Prize name..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Weight */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Weight %</Label>
                    <Input
                      type="number"
                      value={prize.weight}
                      onChange={(e) => updatePrize(index, 'weight', e.target.value)}
                      className="h-9 bg-input border-border"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Repeat */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Repeat</Label>
                    <Input
                      type="number"
                      value={prize.repeat || 1}
                      onChange={(e) => updatePrize(index, 'repeat', e.target.value)}
                      className="h-9 bg-input border-border"
                      min="1"
                      max="5"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={prize.color}
                        onChange={(e) => updatePrize(index, 'color', e.target.value)}
                        className="w-full h-9 rounded cursor-pointer border-0"
                        style={{ backgroundColor: prize.color }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removePrize(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            Save Changes
          </Button>

          {/* Separator */}
          <Separator className="my-4" />

          {/* Loyverse API Settings - переместил выше */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold text-lg">Loyverse API Settings</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label>API Token</Label>
                <Input
                  type="password"
                  placeholder="Enter Loyverse API token"
                  value={loyverseToken || ''}
                  onChange={(e) => {
                    const token = e.target.value;
                    setLoyverseTokenState(token);
                    if (token) {
                      setLoyverseToken(token);
                    }
                  }}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your token from: Loyverse Dashboard → Settings → API
                </p>
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-500">
                    ⚠️ Note: Loyverse API may block browser requests (CORS). If "Failed to fetch" appears, you may need a proxy server or use this from a server environment.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={async () => {
                  if (!loyverseToken) {
                    toast.error("Please enter API token first");
                    return;
                  }
                  setIsTestingConnection(true);
                  try {
                    const result = await testLoyverseConnection();
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  } finally {
                    setIsTestingConnection(false);
                  }
                }}
                variant="outline"
                className="w-full"
                disabled={!loyverseToken || isTestingConnection}
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
              
              <Button
                onClick={() => {
                  clearCustomerCache();
                  toast.success("Cache cleared!");
                }}
                variant="outline"
                className="w-full"
              >
                Clear Cache
              </Button>
            </div>
          </div>

          {/* Separator */}
          <Separator className="my-4" />

          {/* Voucher Redemption Section */}
          <VoucherRedemption />
        </div>
      </SheetContent>
    </Sheet>
  );
};
