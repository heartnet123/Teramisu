"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Footer from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import IconSearch from "@/components/icons/search";
import Loader from "@/components/loader";
import { useCartStore } from "@/service/store";
import { getServerUrl } from "@/lib/server-url";

/**
 * Minimal Shop page showcasing the new design tokens, glassy cards and microinteractions.
 * - Client rendered so we can filter/search locally
 * - Uses Card + Button primitives created earlier
 */

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

const categories = ["All", "Apparel", "Home", "Accessories", "Bags", "Eyewear", "Electronics", "Stationery"];

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/* Small ProductCard inside the page so we avoid creating more files for now */
function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  function onAdd() {
    if (product.availability === "out" || product.stock <= 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      maxQuantity: product.stock,
      quantity: 1,
    });
  }

  const availabilityBadge =
    product.availability === "out" ? (
      <Badge variant="destructive">Out of stock</Badge>
    ) : product.availability === "low" ? (
      <Badge variant="warning">Low stock</Badge>
    ) : (
      <Badge variant="success">In stock</Badge>
    );

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
          {availabilityBadge}
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full h-44 rounded-md overflow-hidden mb-3 bg-muted">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{product.category}</div>
            <div className="font-semibold">{currency(product.price)}</div>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2">
              <Link href={`/shop/${product.id}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
              <Button size="sm" onClick={onAdd} disabled={product.availability === "out" || product.stock <= 0}>
                {product.availability === "out" || product.stock <= 0 ? "Unavailable" : "Add to cart"}
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ShopPage() {
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${getServerUrl()}/api/products`, { cache: "no-store" });
        const data = (await res.json()) as { products: Product[] };
        if (!mounted) return;
        setProducts(data.products ?? []);
      } catch {
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedTags.size > 0 && !selectedTags.has(p.category)) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    });
  }, [q, selectedTags, products]);

  // Simulate loader when searching
  async function onSearchChange(v: string) {
    setQ(v);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setLoading(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function clearAllTags() {
    setSelectedTags(new Set());
  }

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Shop</h1>
          <p className="text-sm text-muted-foreground">A curated collection with a minimalist, glassy aesthetic.</p>
        </header>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <div className="relative flex-1">
              <Input
                aria-label="Search products"
                placeholder="Search products, collections..."
                value={q}
                onChange={(e) => void onSearchChange(e.target.value)}
                className="pr-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <IconSearch />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-auto">
            {categories.slice(1).map((c) => (
              <button
                key={c}
                onClick={() => toggleTag(c)}
                className={`tab ${selectedTags.has(c) ? "tab-active" : ""}`}
                aria-pressed={selectedTags.has(c)}
                role="tab"
              >
                {c}
                <span className="tab-underline" />
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={clearAllTags}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loadingProducts ? (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="w-full h-44 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ) : loading ? (
          <div className="py-8">
            <Loader />
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No products found. Try a different search or category.
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}