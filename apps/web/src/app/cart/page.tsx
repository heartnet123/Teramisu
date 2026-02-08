"use client";
import React from "react";
import Link from "next/link";
import { useCartStore } from "../../service/store";
import { toast } from "sonner";
import RecommendationsSection from "../../components/recommendations-section";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const clearCart = useCartStore((s) => s.clearCart);
  const syncWithServer = useCartStore((s) => s.syncWithServer);
  const syncing = useCartStore((s) => s.syncing);
  const lastConflicts = useCartStore((s) => s.lastConflicts);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  React.useEffect(() => {
    let mounted = true;
    void syncWithServer().then((res) => {
      if (!mounted) return;
      if (!res.ok) {
        toast.error("Could not sync cart", { description: "Please try again." });
        return;
      }
      if (res.conflicts.length > 0) {
        toast.warning("We updated your cart", {
          description: res.conflicts.length === 1 ? res.conflicts[0]?.message : `${res.conflicts.length} changes applied.`,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [syncWithServer]);

  async function onCheckout() {
    const res = await syncWithServer();
    if (!res.ok) {
      toast.error("Checkout blocked", { description: "We couldn't validate your cart. Please try again." });
      return;
    }
    if (res.conflicts.length > 0) {
      toast.warning("Cart updated", { description: "Please review changes before paying." });
      return;
    }
    toast.success("Cart is up to date", { description: "Ready for checkout." });
  }

  return (
    <div className="max-w-7xl mx-auto p-6 pt-24">
      <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-stone-600">Your cart is empty.</p>
          <Link href="/shop" className="inline-block rounded bg-stone-900 text-white px-4 py-2">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          {lastConflicts.length > 0 ? (
            <div className="mb-4 border rounded-md p-3 bg-muted">
              <div className="font-medium">Cart updated due to stock/price changes</div>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                {lastConflicts.slice(0, 5).map((c) => (
                  <li key={`${c.type}-${c.id}`}>• {c.message}</li>
                ))}
                {lastConflicts.length > 5 ? <li>• And {lastConflicts.length - 5} more…</li> : null}
              </ul>
            </div>
          ) : null}

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-md">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                ) : (
                  <div className="w-20 h-20 bg-stone-100 flex items-center justify-center rounded text-sm">{item.name[0]}</div>
                )}

                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-stone-500">${item.price.toFixed(2)}</div>
                  {typeof item.maxQuantity === "number" ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.maxQuantity <= 0 ? "Out of stock" : `In stock: ${item.maxQuantity}`}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="glass-button p-1"
                    onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                    aria-label={`Decrease ${item.name}`}
                  >
                    −
                  </button>
                  <div className="px-3">{item.quantity}</div>
                  <button
                    className="glass-button p-1"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    disabled={typeof item.maxQuantity === "number" ? item.quantity >= item.maxQuantity : false}
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <div className="w-28 text-right">
                  <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  <button className="text-sm text-red-500 mt-1" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-lg font-medium">
              Total: ${total.toFixed(2)}
              {syncing ? <span className="ml-2 text-sm text-muted-foreground">Recalculating…</span> : null}
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-outline" onClick={() => clearCart()}>
                Clear cart
              </button>
              <button className="btn-primary" onClick={onCheckout} disabled={syncing}>
                {syncing ? "Validating…" : "Checkout"}
              </button>
            </div>
          </div>

          <div className="mt-12">
            <RecommendationsSection
              title="You Might Also Like"
              productIds={items.map((item) => item.id)}
              type="cart"
              maxProducts={3}
              className="mt-8"
            />
          </div>
        </>
      )}
    </div>
  );
}