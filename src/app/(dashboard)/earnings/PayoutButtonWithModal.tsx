"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MIN_PAYOUT } from "./EarningsBalanceCards";
import { Banknote, Loader2 } from "lucide-react";

type StripeBalance = { balance: number; pendingBalance?: number };

export function PayoutButtonWithModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/stripe/connect")
      .then((res) => res.json())
      .then((data: StripeBalance & { error?: string }) => {
        if (!data.error) setBalance(data.balance ?? 0);
      })
      .catch(() => {});
  }, []);

  const canPayout = balance >= MIN_PAYOUT;

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/payout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Payout failed",
          description: data.error ?? "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      setOpen(false);
      toast({
        title: "Payout requested!",
        description: `$${data.amount ?? balance.toFixed(2)} is being transferred.`,
      });
      setBalance(0);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!canPayout}
        className="gap-2"
      >
        <Banknote className="h-4 w-4" />
        Request Payout
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm payout</DialogTitle>
            <DialogDescription>
              You are about to request a payout of{" "}
              <strong>${balance.toFixed(2)}</strong> to your connected bank
              account. This may take a few business days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
