"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerUrl } from "@/lib/server-url";

/**
 * Search results page displaying products matching the query.
 * - Reads query parameter from URL (?q=search_term)
 * - Fetches results from backend search API
 * - Displays products in grid layout
 * - Shows no results state with helpful suggestions and popular products
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

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/* Small ProductCard component matching shop page styling */
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`} className="group block space-y-3 animate-fade-in">
      <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-[#f3f3f1] relative transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-1 px-1">
        <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
        <p className="text-sm font-medium text-muted-foreground">{currency(product.price)}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSearchResults() {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${getServerUrl()}/api/products/search?q=${encodeURIComponent(query)}&sort=relevance`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = (await res.json()) as { products: Product[] };
        if (!mounted) return;

        setProducts(data.products ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "An error occurred");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSearchResults();

    return () => {
      mounted = false;
    };
  }, [query]);

  // Load popular products when no results found
  useEffect(() => {
    let mounted = true;

    async function loadPopularProducts() {
      // Only load popular products when we have a query with no results
      if (!query.trim() || loading || error || products.length > 0) {
        setPopularProducts([]);
        return;
      }

      try {
        setLoadingPopular(true);
        const res = await fetch(`${getServerUrl()}/api/products`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch popular products");
        }

        const data = (await res.json()) as { products: Product[] };
        if (!mounted) return;

        // Show first 6 products as popular recommendations
        setPopularProducts((data.products ?? []).slice(0, 6));
      } catch (err) {
        if (!mounted) return;
        setPopularProducts([]);
      } finally {
        if (mounted) setLoadingPopular(false);
      }
    }

    void loadPopularProducts();

    return () => {
      mounted = false;
    };
  }, [query, loading, error, products.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>›</span>
              <span className="text-foreground font-medium">Search</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-6xl font-black tracking-tight">
                {query.trim() ? `Search: "${query}"` : "Search"}
              </h1>
              {!query.trim() && (
                <p className="text-muted-foreground text-lg">
                  Enter a search term to find products
                </p>
              )}
            </div>

            {query.trim() && !loading && !error && (
              <div className="text-muted-foreground">
                {products.length} {products.length === 1 ? "result" : "results"} found
              </div>
            )}
          </header>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] rounded-[32px]" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <p className="text-xl font-medium text-destructive">Error loading results</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : !query.trim() ? (
            <div className="py-24 text-center">
              <p className="text-xl font-medium">Start your search</p>
              <p className="text-muted-foreground mt-2">
                Use the search bar to find products by name, category, or ingredients.
              </p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/shop">Browse all products</Link>
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="space-y-16">
              {/* No results message with suggestions */}
              <div className="py-16 text-center">
                <p className="text-2xl font-medium">No results found</p>
                <p className="text-muted-foreground mt-2">
                  We couldn't find any products matching "{query}"
                </p>

                {/* Helpful suggestions */}
                <div className="mt-8 max-w-md mx-auto">
                  <p className="text-sm font-semibold mb-4">Search tips:</p>
                  <ul className="text-sm text-muted-foreground space-y-2 text-left">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Check your spelling for typos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Try more general terms (e.g., "chair" instead of "ergonomic office chair")</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Try different keywords that describe the product</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Browse our categories for inspiration</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 space-x-4">
                  <Button variant="outline" asChild>
                    <Link href="/shop">Browse all products</Link>
                  </Button>
                </div>
              </div>

              {/* Popular products section */}
              {popularProducts.length > 0 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold">Popular Products</h2>
                    <p className="text-muted-foreground mt-2">
                      Explore our curated selection of trending items
                    </p>
                  </div>

                  {loadingPopular ? (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                      {popularProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
