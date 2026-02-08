"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/service/store";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ShoppingBag,
} from "lucide-react";

type WishlistItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
    isActive: boolean;
  } | null;
};

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const addItem = useCartStore((s) => s.addItem);
  const [items, setItems] = React.useState<WishlistItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login?redirect=/wishlist");
      return;
    }

    if (session?.user) {
      fetchWishlist();
    }
  }, [session, sessionLoading, router]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/user/wishlist`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`${getServerUrl()}/api/user/wishlist/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setItems(items.filter((item) => item.productId !== productId));
        toast.success("ลบออกจากรายการโปรดแล้ว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product) return;

    if (item.product.stock <= 0) {
      toast.error("สินค้าหมด");
      return;
    }

    addItem({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      maxQuantity: item.product.stock,
    });

    toast.success("เพิ่มลงตะกร้าแล้ว");
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">รายการโปรดว่างเปล่า</h1>
        <p className="text-muted-foreground mb-6">
          บันทึกสินค้าที่ชอบไว้ดูทีหลังได้ที่นี่
        </p>
        <Button asChild>
          <Link href="/shop">เลือกซื้อสินค้า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold">รายการโปรด</h1>
          <span className="text-muted-foreground">({items.length} รายการ)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            if (!item.product) return null;

            const isOutOfStock = item.product.stock <= 0 || !item.product.isActive;

            return (
              <Card key={item.id} className="overflow-hidden group">
                <Link href={`/shop/${item.product.id}`}>
                  <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                          สินค้าหมด
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/shop/${item.product.id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:underline">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-primary mt-1">
                    ฿{item.product.price.toLocaleString()}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isOutOfStock ? "หมด" : "เพิ่มลงตะกร้า"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleRemove(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

