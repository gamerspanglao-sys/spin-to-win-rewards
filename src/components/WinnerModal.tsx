import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Prize {
  name: string;
}

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
}

export const WinnerModal = ({ isOpen, onClose, prize }: WinnerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-2 border-primary glow-cyan max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-primary text-glow mb-4">
            🎉 Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center space-y-6">
            <div className="text-4xl font-bold text-secondary text-glow py-8">
              {prize?.name}
            </div>
            <p className="text-foreground text-lg">
              Show this screen to our staff to claim your reward!
            </p>
            <Button
              onClick={onClose}
              className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform glow-cyan"
            >
              Claim Reward
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
