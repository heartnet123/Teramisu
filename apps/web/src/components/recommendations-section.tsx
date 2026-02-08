"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerUrl } from "@/lib/server-url";

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

type RecommendationsSectionProps = {
  title: string;
  productId?: string;
  productIds?: string[];
  type?: "frequently-bought-together" | "personalized" | "category" | "cart";
  maxProducts?: number;
  className?: string;
};

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function ProductCard({ product, onProductClick }: { product: Product; onProductClick?: (productId: string) => void }) {
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product.id);
    }
  };

  return (
    <Link
      href={`/shop/${product.id}`}
      onClick={handleClick}
      className="group block space-y-3 animate-fade-in"
    >
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

export default function RecommendationsSection({
  title,
  productId,
  productIds,
  type = "frequently-bought-together",
  maxProducts = 3,
  className = "",
}: RecommendationsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError(null);

        let url = "";
        let options: RequestInit = { cache: "no-store" };

        if (type === "frequently-bought-together" && productId) {
          url = `${getServerUrl()}/api/recommendations/frequently-bought-together/${encodeURIComponent(productId)}`;
        } else if (type === "personalized") {
          url = `${getServerUrl()}/api/recommendations/personalized`;
        } else if (type === "category" && productId) {
          // For category-based, we'd need to fetch product first to get its category
          // This is a simplified version - in real use, you'd pass category directly
          url = `${getServerUrl()}/api/recommendations/category/Featured`;
        } else if (type === "cart" && productIds && productIds.length > 0) {
          url = `${getServerUrl()}/api/recommendations/cart`;
          options = {
            ...options,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds, limit: maxProducts }),
          };
        } else {
          setProducts([]);
          return;
        }

        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error("Failed to load recommendations");
        }

        const data = await res.json();
        if (!mounted) return;

        const recommendations = data.recommendations || data.products || [];
        setProducts(recommendations.slice(0, maxProducts));
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadRecommendations();
    return () => {
      mounted = false;
    };
  }, [productId, productIds, type, maxProducts]);

  const handleProductClick = async (recommendedProductId: string) => {
    try {
      const trackData: Record<string, unknown> = {
        type: "click",
        recommendedProductId,
        recommendationType: type === "cart" ? "cart_related" : type === "frequently-bought-together" ? "frequently_bought_together" : type === "category" ? "category_based" : "personalized",
      };

      // For cart-based recommendations, track the first product in cart as the source
      if (type === "cart" && productIds && productIds.length > 0) {
        trackData.productId = productIds[0];
      } else if (productId) {
        trackData.productId = productId;
      } else {
        // No productId to track
        return;
      }

      await fetch(`${getServerUrl()}/api/recommendations/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackData),
      });
    } catch {
      // Silently fail - tracking shouldn't break UX
    }
  };

  if (loading) {
    return (
      <section className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {Array.from({ length: maxProducts }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] rounded-[32px]" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
    </section>
  );
}
