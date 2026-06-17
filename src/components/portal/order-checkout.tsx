"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

export function OrderCheckout({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const items = Object.entries(selected).filter(([, qty]) => qty > 0);
  const total = items.reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product?.price ?? 0) * qty;
  }, 0);

  async function handleCheckout() {
    if (items.length === 0) {
      setMessage("Select at least one product");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/portal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(([productId, quantity]) => ({ productId, quantity })),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Checkout failed");
      return;
    }

    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      setMessage("Order created. Payment link will be sent shortly.");
      window.location.reload();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.includes("created") || message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="font-medium">{product.name}</p>
                {product.description && <p className="text-sm text-slate-500">{product.description}</p>}
                <p className="text-sm font-medium text-teal-600">{formatCurrency(product.price)}</p>
              </div>
              <input
                type="number"
                min={0}
                max={99}
                value={selected[product.id] ?? 0}
                onChange={(e) => setSelected({ ...selected, [product.id]: parseInt(e.target.value) || 0 })}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
              />
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="font-medium">Total: {formatCurrency(total)}</span>
            <Button onClick={handleCheckout} disabled={loading}>
              {loading ? "Processing..." : "Checkout with Stripe"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
