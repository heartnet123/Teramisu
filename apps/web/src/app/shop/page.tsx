"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerUrl } from "@/lib/server-url";
import { ProductCard, type Product } from "@/components/product-card";

/**
 * Minimal Shop page showcasing the new design tokens, glassy cards and microinteractions.
 * - Client rendered so we can filter/search locally
 * - Uses Button primitives created earlier
 */

const categories = ["Featured", "Chairs", "Armchairs", "Table lamp", "Ceiling Light", "Decors", "Rugs", "Cushions"];
type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export default function ShopPage() {
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("featured");
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
    const matches = products.filter((p) => {
      if (selectedTags.size > 0 && !selectedTags.has(p.category)) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    });
    const sorted = [...matches];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return sorted;
  }, [q, selectedTags, products, sortBy]);

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

  const activeCategory = Array.from(selectedTags)[0] || "Shop";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 space-y-10 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  Filter <span className="text-muted-foreground font-normal text-sm ml-1">({selectedTags.size})</span>
                </h2>
                {selectedTags.size > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="bg-[#f9f9f9] rounded-2xl p-6 space-y-6">
                {/* Categories */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    Categories <span className="text-muted-foreground font-normal text-xs">({selectedTags.size})</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleTag(c)}
                        className={`text-left text-sm transition-colors ${selectedTags.has(c)
                            ? "font-bold text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <header className="space-y-8">
              <h1 className="text-6xl font-black tracking-tight">{activeCategory}</h1>

              <div className="flex items-center justify-between text-sm py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Link href="/shop" className="hover:text-foreground transition-colors">
                    Shop
                  </Link>
                  <span>›</span>
                  <span className="text-foreground font-medium">{activeCategory}</span>
                </div>

                <div className="text-muted-foreground">
                  {filtered.length} results
                </div>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
                  <SelectTrigger className="h-9 w-[180px] text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A-Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </header>

            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/5] rounded-[32px]" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="py-24 text-center">
                    <p className="text-xl font-medium">No results found</p>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        clearAllTags();
                        setQ("");
                      }}
                    >
                      Reset all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
