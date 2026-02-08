"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getServerUrl } from "@/lib/server-url";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Copy,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  approvedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
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

const shipmentStatusConfig: Record<string, { label: string; step: number }> = {
  preparing: { label: "กำลังเตรียมสินค้า", step: 1 },
  shipped: { label: "จัดส่งแล้ว", step: 2 },
  in_transit: { label: "กำลังขนส่ง", step: 3 },
  out_for_delivery: { label: "กำลังนำส่ง", step: 4 },
  delivered: { label: "ส่งสำเร็จ", step: 5 },
};

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/track/${orderId}`);

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกแล้ว");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">ไม่พบคำสั่งซื้อ</h1>
            <p className="text-muted-foreground mb-6">
              ไม่พบคำสั่งซื้อหมายเลข {orderId} หรือคำสั่งซื้อนี้อาจถูกยกเลิกแล้ว
            </p>
            <Button asChild>
              <Link href="/">กลับหน้าหลัก</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const currentShipmentStep = order.shipmentStatus
    ? shipmentStatusConfig[order.shipmentStatus]?.step || 0
    : 0;

  const subtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.priceAtPurchase) * item.quantity,
    0
  );
  const shippingCost = parseFloat(order.totalAmount) - subtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold">ติดตามคำสั่งซื้อ</h1>
              <p className="text-sm text-muted-foreground">#{order.id}</p>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline (if shipped) */}
            {order.status === "shipped" && order.shipmentStatus && (
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  ติดตามพัสดุ
                </h2>

                {order.trackingNumber && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">เลขติดตาม:</span>
                    <span className="font-mono font-medium">{order.trackingNumber}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(order.trackingNumber!)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <div className="relative">
                  {Object.entries(shipmentStatusConfig).map(([key, value], index) => {
                    const isActive = value.step <= currentShipmentStep;
                    const isCurrent = value.step === currentShipmentStep;

                    return (
                      <div key={key} className="flex items-start gap-4 pb-6 last:pb-0">
                        <div className="relative">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              isActive
                                ? "bg-primary border-primary"
                                : "bg-background border-muted-foreground/30"
                            }`}
                          />
                          {index < Object.keys(shipmentStatusConfig).length - 1 && (
                            <div
                              className={`absolute left-1.5 top-4 w-0.5 h-6 ${
                                value.step < currentShipmentStep
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isCurrent ? "text-primary" : isActive ? "" : "text-muted-foreground"
                            }`}
                          >
                            {value.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">สินค้าในคำสั่งซื้อ</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/shop/${item.product.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        ฿{parseFloat(item.priceAtPurchase).toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-medium">
                      ฿{(parseFloat(item.priceAtPurchase) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  ที่อยู่จัดส่ง
                </h2>
                <p className="text-sm whitespace-pre-line">{order.shippingAddress}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">สรุปคำสั่งซื้อ</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ราคาสินค้า</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ค่าจัดส่ง</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">ฟรี</span>
                    ) : (
                      `฿${shippingCost.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>รวมทั้งหมด</span>
                  <span>฿{parseFloat(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Order Timeline */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">ไทม์ไลน์</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สั่งซื้อเมื่อ</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {order.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยืนยันเมื่อ</span>
                    <span>
                      {new Date(order.approvedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จัดส่งเมื่อ</span>
                    <span>
                      {new Date(order.shippedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ส่งถึงเมื่อ</span>
                    <span>
                      {new Date(order.deliveredAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex justify-between text-red-600">
                    <span>ยกเลิกเมื่อ</span>
                    <span>
                      {new Date(order.cancelledAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/shop">ซื้อสินค้าต่อ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
