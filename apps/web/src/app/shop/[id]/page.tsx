"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/service/store";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Heart, Star, ShoppingCart, MessageSquare } from "lucide-react";

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

type Review = {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
};

type ReviewsData = {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
};

function currency(n: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const { data: session } = authClient.useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ReviewsData | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${getServerUrl()}/api/products/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
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

  // Load reviews
  useEffect(() => {
    let mounted = true;
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${getServerUrl()}/api/products/${encodeURIComponent(id)}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setReviews(data);
        }
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    }
    if (id) void loadReviews();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Check wishlist status
  useEffect(() => {
    if (!session?.user || !id) return;
    let mounted = true;
    async function checkWishlist() {
      try {
        const res = await fetch(`${getServerUrl()}/api/user/wishlist`, {
          credentials: "include",
        });
        if (res.ok) {
          const items = await res.json();
          if (mounted) {
            setIsInWishlist(items.some((item: any) => item.productId === id));
          }
        }
      } catch {}
    }
    checkWishlist();
    return () => {
      mounted = false;
    };
  }, [session, id]);

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

  const handleWishlist = async () => {
    if (!session?.user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      router.push("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        const res = await fetch(`${getServerUrl()}/api/user/wishlist/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setIsInWishlist(false);
          toast.success("ลบออกจากรายการโปรดแล้ว");
        }
      } else {
        const res = await fetch(`${getServerUrl()}/api/user/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId: id }),
        });
        if (res.ok) {
          setIsInWishlist(true);
          toast.success("เพิ่มในรายการโปรดแล้ว");
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${getServerUrl()}/api/user/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: id,
          rating: reviewRating,
          title: reviewTitle || undefined,
          comment: reviewComment || undefined,
        }),
      });

      if (res.ok) {
        toast.success("ขอบคุณสำหรับรีวิว!");
        setShowReviewForm(false);
        setReviewTitle("");
        setReviewComment("");
        setReviewRating(5);
        // Reload reviews
        const reviewsRes = await fetch(`${getServerUrl()}/api/products/${id}/reviews`);
        if (reviewsRes.ok) {
          setReviews(await reviewsRes.json());
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!loading && !product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">ไม่พบสินค้า</h2>
          <p className="text-sm text-muted-foreground mt-2">
            สินค้าที่คุณกำลังหาอาจถูกลบไปแล้ว
          </p>
          <div className="mt-4">
            <Link href="/shop">
              <Button>กลับไปหน้าร้าน</Button>
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
    toast.success("เพิ่มลงตะกร้าแล้ว");
  }

  const availabilityBadge =
    product?.availability === "out" || (product?.stock ?? 0) <= 0 ? (
      <Badge variant="destructive">สินค้าหมด</Badge>
    ) : product?.availability === "low" ? (
      <Badge className="bg-orange-100 text-orange-700">เหลือน้อย</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-700">มีสินค้า</Badge>
    );

  return (
    <main className="min-h-screen py-10 w-full max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full rounded-xl overflow-hidden bg-muted">
          {loading ? (
            <Skeleton className="w-full aspect-[4/3]" />
          ) : (
            <img
              src={product!.image}
              alt={product!.name}
              className="w-full h-full object-cover"
            />
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
              <div className="text-sm text-muted-foreground mb-2">{product!.category}</div>

              {/* Rating Summary */}
              {reviews && reviews.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={Math.round(reviews.avgRating)} />
                  <span className="text-sm font-medium">{reviews.avgRating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.totalReviews} รีวิว)
                  </span>
                </div>
              )}

              <div className="text-3xl font-bold text-primary mb-4">
                {currency(product!.price)}
              </div>
              <p className="text-muted-foreground mb-6">{product!.description}</p>
              <div className="text-sm text-muted-foreground mb-4">
                {product!.stock <= 0 ? "สินค้าหมดชั่วคราว" : `คงเหลือ: ${product!.stock} ชิ้น`}
              </div>
            </>
          )}

          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-muted-foreground">จำนวน</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={loading || (product?.stock ?? 0) <= 0 || qty <= 1}
              >
                −
              </Button>
              <Input
                type="number"
                min={1}
                max={product?.stock ?? 1}
                value={qty}
                onChange={(e) => {
                  const n = Number(e.target.value || 1);
                  const capped = product
                    ? Math.min(Math.max(1, n), Math.max(1, product.stock))
                    : Math.max(1, n);
                  setQty(capped);
                }}
                className="w-16 text-center"
                disabled={loading || (product?.stock ?? 0) <= 0}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setQty((q) => (product ? Math.min(q + 1, Math.max(1, product.stock)) : q + 1))
                }
                disabled={
                  loading || (product?.stock ?? 0) <= 0 || (product ? qty >= product.stock : false)
                }
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onAddToCart}
              disabled={
                loading || (product?.stock ?? 0) <= 0 || product?.availability === "out"
              }
              className="flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {loading
                ? "กำลังโหลด..."
                : (product?.stock ?? 0) <= 0 || product?.availability === "out"
                  ? "สินค้าหมด"
                  : "เพิ่มลงตะกร้า"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={isInWishlist ? "text-red-500 border-red-200" : ""}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? "fill-red-500" : ""}`} />
            </Button>
          </div>

          <div className="mt-4">
            <Link href="/shop">
              <Button variant="ghost" className="w-full">
                ← ดูสินค้าเพิ่มเติม
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            รีวิวจากลูกค้า
            {reviews && <span className="text-muted-foreground">({reviews.totalReviews})</span>}
          </h2>
          {session?.user && (
            <Button variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
              เขียนรีวิว
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && session?.user && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">เขียนรีวิวของคุณ</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">คะแนน</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">หัวข้อ (ไม่บังคับ)</label>
                <Input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="สรุปความรู้สึกต่อสินค้า"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">รีวิว</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="บอกเล่าประสบการณ์ของคุณ..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowReviewForm(false)}
                  disabled={submittingReview}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? "กำลังส่ง..." : "ส่งรีวิว"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Reviews List */}
        {loadingReviews ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {review.user.image ? (
                      <img
                        src={review.user.image}
                        alt={review.user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      review.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{review.user.name}</span>
                      {review.isVerifiedPurchase && (
                        <Badge variant="outline" className="text-xs">
                          ซื้อจริง
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    {review.title && <p className="font-medium mb-1">{review.title}</p>}
                    {review.comment && (
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">ยังไม่มีรีวิว</p>
            {!session?.user && (
              <p className="text-sm text-muted-foreground mt-2">
                <Link href="/login" className="text-primary hover:underline">
                  เข้าสู่ระบบ
                </Link>{" "}
                เพื่อเขียนรีวิว
              </p>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
