"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConsentSignForm({ consentId }: { consentId: string }) {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!signature.trim()) {
      setMessage("Please enter your full name as signature");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/portal/consents/${consentId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature }),
    });
    setLoading(false);

    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to sign consent");
    }
  }

  return (
    <form onSubmit={handleSign} className="space-y-3 border-t border-slate-100 pt-4">
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="space-y-2">
        <Label htmlFor={`sig-${consentId}`}>Type your full name to sign</Label>
        <Input
          id={`sig-${consentId}`}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Your full legal name"
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Signing..." : "Sign consent"}
      </Button>
    </form>
  );
}
