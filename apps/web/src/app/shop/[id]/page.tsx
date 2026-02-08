"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/service/store";
import { getServerUrl } from "@/lib/server-url";
import RecommendationsSection from "@/components/recommendations-section";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  availability: "in" | "low" | "out";
};

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${getServerUrl()}/api/products/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) {
          if (mounted) setProduct(null);
          return;
        }
        const data = (await res.json()) as Product;
        if (!mounted) return;
        setProduct(data);
        setQty(1);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const maxQty = useMemo(() => {
    if (!product) return 1;
    return Math.max(1, product.stock);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (product.stock <= 0) {
      setQty(1);
      return;
    }
    setQty((q) => Math.min(Math.max(1, q), maxQty));
  }, [product, maxQty]);

  if (!loading && !product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Product not found</h2>
          <p className="text-sm text-muted-foreground mt-2">The product you are looking for doesn't exist.</p>
          <div className="mt-4">
            <Link href="/shop">
              <Button>Back to shop</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function onAddToCart() {
    if (!product) return;
    if (product.stock <= 0 || product.availability === "out") return;
    addItem({
		id: product.id,
		name: product.name,
		price: product.price,
		image: product.image,
		maxQuantity: product.stock,
		quantity: Math.min(Math.max(1, qty), product.stock),
	});
    router.push("/cart");
  }

  const availabilityBadge =
    product?.availability === "out" || (product?.stock ?? 0) <= 0 ? (
      <Badge variant="destructive">Out of stock</Badge>
    ) : product?.availability === "low" ? (
      <Badge variant="warning">Low stock</Badge>
    ) : (
      <Badge variant="success">In stock</Badge>
    );

  return (
    <main className="min-h-screen py-10 w-full max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full rounded-md overflow-hidden bg-muted">
          {loading ? (
            <Skeleton className="w-full aspect-[4/3]" />
          ) : (
            <img src={product!.image} alt={product!.name} className="w-full h-full object-cover" />
          )}
        </div>

        <div>
          {loading ? (
            <>
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-4 w-40 mb-4" />
              <Skeleton className="h-8 w-28 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-6" />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{product!.name}</h1>
                {availabilityBadge}
              </div>
              <div className="text-sm text-muted-foreground mb-4">{product!.category}</div>
              <div className="text-2xl font-bold mb-4">{currency(product!.price)}</div>
              <p className="text-sm text-muted-foreground mb-6">{product!.description}</p>
              <div className="text-sm text-muted-foreground mb-4">
                {product!.stock <= 0 ? "Currently unavailable." : `Available: ${product!.stock}`}
              </div>
            </>
          )}

          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-muted-foreground">Quantity</label>
            <Input
              type="number"
              min={1}
              max={product?.stock ?? 1}
              value={qty}
              onChange={(e) => {
				const n = Number(e.target.value || 1);
				const capped = product ? Math.min(Math.max(1, n), Math.max(1, product.stock)) : Math.max(1, n);
				setQty(capped);
			}}
              className="w-24"
              disabled={loading || (product?.stock ?? 0) <= 0}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={loading || (product?.stock ?? 0) <= 0 || qty <= 1}
              >
                −
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQty((q) => (product ? Math.min(q + 1, Math.max(1, product.stock)) : q + 1))}
                disabled={loading || (product?.stock ?? 0) <= 0 || (product ? qty >= product.stock : false)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={onAddToCart} disabled={loading || (product?.stock ?? 0) <= 0 || product?.availability === "out"}>
              {loading ? "Loading…" : (product?.stock ?? 0) <= 0 || product?.availability === "out" ? "Out of stock" : "Add to cart"}
            </Button>
            <Link href="/shop">
              <Button variant="outline">Continue shopping</Button>
            </Link>
          </div>
        </div>
      </div>

      {!loading && product && (
        <div className="mt-16">
          <RecommendationsSection
            title="Frequently Bought Together"
            productId={product.id}
            type="frequently-bought-together"
            maxProducts={3}
          />
        </div>
      )}
    </main>
  );
}