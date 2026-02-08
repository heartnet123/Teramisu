"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShoppingBag,
} from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  product: {
    id: string;
    name: string;
    image?: string;
  };
};

type Order = {
  id: string;
  status: string;
  shipmentStatus?: string;
  totalAmount: string;
  trackingNumber?: string;
  createdAt: string;
  items: OrderItem[];
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "รอยืนยัน", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  processing: { label: "กำลังเตรียมสินค้า", color: "bg-purple-100 text-purple-700", icon: Package },
  shipped: { label: "จัดส่งแล้ว", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { label: "ส่งสำเร็จ", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login?redirect=/orders");
      return;
    }

    if (session?.user) {
      fetchOrders();
    }
  }, [session, sessionLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/user/orders`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">ยังไม่มีคำสั่งซื้อ</h1>
        <p className="text-muted-foreground mb-6">เริ่มช้อปปิ้งสินค้าที่คุณชอบกันเลย!</p>
        <Button asChild>
          <Link href="/shop">เลือกซื้อสินค้า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">คำสั่งซื้อของฉัน</h1>

        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                <Link href={`/orders/${order.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        คำสั่งซื้อ #{order.id.slice(0, 12)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Product Images */}
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-12 rounded-lg bg-muted overflow-hidden border-2 border-background"
                        >
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              ?
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {order.items.length} รายการ
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-muted-foreground">
                          เลขติดตาม: {order.trackingNumber}
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="font-semibold">
                        ฿{parseFloat(order.totalAmount).toLocaleString()}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

