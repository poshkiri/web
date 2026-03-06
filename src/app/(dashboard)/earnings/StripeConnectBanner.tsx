"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function StripeConnectBanner() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.error);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm">Connect Stripe to receive payouts</span>
      <Button
        size="sm"
        onClick={handleConnect}
        disabled={loading}
        className="shrink-0"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting…
          </>
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  );
}
